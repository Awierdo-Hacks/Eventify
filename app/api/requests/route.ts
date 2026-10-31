import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { getServiceRequestsForSession } from '@/lib/page-data';
import { z } from 'zod';
import { parseBody, dateString } from '@/lib/validation';
import { checkRateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { isProviderAvailable, toDayKey } from '@/lib/availability';
import { assertSlotUsable, postSystemMessage, recomputeSlotStatus, workflowErrorResponse } from '@/lib/workflow';
import { eventTypeLabel } from '@/lib/labels';

// GET - List service requests
export async function GET(request: Request) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized - login required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    // Same data shape as the server-rendered dashboards (lib/page-data.ts)
    const requests = await getServiceRequestsForSession(session, { status: searchParams.get('status'), providerId: searchParams.get('providerId') });

    return NextResponse.json({
      requests,
      total: requests.length,
    });
  } catch (error) {
    console.error('requests API error:', error);
    return NextResponse.json(
      { error: 'Er is iets misgegaan bij het ophalen van aanvragen' },
      { status: 500 }
    );
  }
}

const createRequestSchema = z.object({
  providerId: z.string().min(1),
  eventSlotId: z.string().min(1).nullish(),
  eventType: z.string().trim().min(1).max(50),
  eventDate: dateString,
  eventLocation: z.string().trim().min(2).max(200),
  guestCount: z.coerce.number().int().min(1).max(100_000),
  budgetRange: z.enum(['LOW', 'MEDIUM', 'HIGH', 'PREMIUM']).nullish(),
  description: z.string().trim().max(5000).optional().default(''),
  customerName: z.string().trim().max(200).optional(),
  customerEmail: z.string().trim().email().max(254).optional(),
  customerPhone: z.string().trim().max(40).optional(),
  preferredContact: z.string().trim().max(50).nullish(),
});

// POST - Create new service request
export async function POST(request: Request) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized - login required' },
        { status: 401 }
      );
    }

    if (session.role !== 'CUSTOMER') {
      return NextResponse.json(
        { error: 'Alleen klanten kunnen een offerte aanvragen' },
        { status: 403 }
      );
    }

    if (!(await checkRateLimit(`request:${session.id}`, 20, 60 * 60_000))) {
      return rateLimitResponse();
    }

    const { data, error } = await parseBody(request, createRequestSchema);
    if (error) return error;

    const provider = await prisma.serviceProvider.findUnique({
      where: { id: data.providerId },
      select: { id: true, user_id: true, category: true, business_name: true, verified: true, is_active: true },
    });

    if (!provider || !provider.verified || !provider.is_active) {
      return NextResponse.json({ error: 'Provider niet gevonden' }, { status: 404 });
    }

    const eventDate = new Date(data.eventDate);
    if (toDayKey(eventDate) < toDayKey(new Date())) {
      return NextResponse.json({ error: 'Kies een datum in de toekomst' }, { status: 400 });
    }

    if (!(await isProviderAvailable(provider.id, eventDate))) {
      return NextResponse.json(
        { error: `${provider.business_name} is niet beschikbaar op deze datum. Kies een andere datum.` },
        { status: 409 }
      );
    }

    // One open request per provider per event slot
    if (data.eventSlotId) {
      await assertSlotUsable(prisma, {
        slotId: data.eventSlotId,
        customerId: session.id,
        providerCategory: provider.category,
      });
      const duplicate = await prisma.serviceRequest.findFirst({
        where: {
          event_slot_id: data.eventSlotId,
          provider_id: provider.id,
          status: { in: ['PENDING', 'QUOTED'] },
        },
        select: { id: true },
      });
      if (duplicate) {
        return NextResponse.json(
          { error: 'Je hebt deze provider al een aanvraag gestuurd voor dit onderdeel' },
          { status: 400 }
        );
      }
    }

    const customer = await prisma.user.findUnique({
      where: { id: session.id },
      select: { name: true, email: true, phone: true },
    });

    const serviceRequest = await prisma.$transaction(async (tx) => {
      const created = await tx.serviceRequest.create({
        data: {
          customer_id: session.id,
          provider_id: provider.id,
          event_slot_id: data.eventSlotId || null,
          category: provider.category,
          event_type: data.eventType,
          event_date: eventDate,
          event_location: data.eventLocation,
          guest_count: data.guestCount,
          budget_range: data.budgetRange ?? null,
          description: data.description,
          customer_name: data.customerName || customer?.name || session.name,
          customer_email: data.customerEmail || customer?.email || session.email,
          customer_phone: data.customerPhone || customer?.phone || '',
          preferred_contact: data.preferredContact || null,
          status: 'PENDING',
        },
        include: {
          customer: { select: { id: true, name: true, email: true } },
          provider: { select: { id: true, business_name: true } },
        },
      });

      if (created.event_slot_id) await recomputeSlotStatus(tx, created.event_slot_id);

      await postSystemMessage(
        tx,
        session.id,
        provider.user_id,
        `📩 Nieuwe offerte-aanvraag: ${eventTypeLabel(data.eventType)} op ${eventDate.toLocaleDateString('nl-BE', { timeZone: 'UTC' })} in ${data.eventLocation}, ${data.guestCount} gasten.`
      );

      return created;
    });

    return NextResponse.json({
      success: true,
      request: {
        id: serviceRequest.id,
        category: serviceRequest.category,
        eventType: serviceRequest.event_type,
        eventDate: serviceRequest.event_date,
        eventLocation: serviceRequest.event_location,
        guestCount: serviceRequest.guest_count,
        budgetRange: serviceRequest.budget_range,
        description: serviceRequest.description,
        eventSlotId: serviceRequest.event_slot_id,
        status: serviceRequest.status,
        createdAt: serviceRequest.created_at,
        customer: {
          id: serviceRequest.customer.id,
          name: serviceRequest.customer.name,
          email: serviceRequest.customer.email,
        },
        provider: serviceRequest.provider
          ? {
              id: serviceRequest.provider.id,
              businessName: serviceRequest.provider.business_name,
            }
          : null,
      },
    });
  } catch (error) {
    const known = workflowErrorResponse(error);
    if (known) return NextResponse.json(known.body, { status: known.status });
    console.error('Create service request error:', error);
    return NextResponse.json(
      { error: 'Er is iets misgegaan bij het aanmaken van de aanvraag' },
      { status: 500 }
    );
  }
}
