import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { parseBody } from '@/lib/validation';
import { cancelBooking, completeBooking, workflowErrorResponse } from '@/lib/workflow';

const actionSchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('complete') }),
  z.object({ action: z.literal('cancel'), reason: z.string().min(3).max(500) }),
  z.object({ action: z.literal('update'), specialRequests: z.string().max(2000).nullable() }),
  // Admin correction of the payment status (normally set by the payment webhook)
  z.object({
    action: z.literal('setPaymentStatus'),
    paymentStatus: z.enum(['UNPAID', 'PENDING', 'PAID', 'FAILED', 'CANCELLED', 'EXPIRED', 'REFUNDED']),
  }),
]);

// PATCH - Complete, cancel or update a booking
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized - login required' },
        { status: 401 }
      );
    }

    const { id: bookingId } = await params;
    const { data, error } = await parseBody(request, actionSchema);
    if (error) return error;

    if (data.action === 'complete') {
      const booking = await completeBooking({ bookingId, actor: session });
      return NextResponse.json({ success: true, booking: { id: booking.id, status: booking.status } });
    }

    if (data.action === 'cancel') {
      const booking = await cancelBooking({ bookingId, actor: session, reason: data.reason });
      return NextResponse.json({ success: true, booking: { id: booking.id, status: booking.status } });
    }

    const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
    if (!booking) {
      return NextResponse.json({ error: 'Boeking niet gevonden' }, { status: 404 });
    }

    const isCustomer = booking.customer_id === session.id;
    const isProvider = !!session.providerId && booking.provider_id === session.providerId;
    const isAdmin = session.role === 'ADMIN';

    if (data.action === 'setPaymentStatus') {
      if (!isAdmin) {
        return NextResponse.json(
          { error: 'Alleen admins kunnen de betaalstatus aanpassen' },
          { status: 403 }
        );
      }
      const updated = await prisma.booking.update({
        where: { id: bookingId },
        data: { payment_status: data.paymentStatus },
      });
      return NextResponse.json({ success: true, booking: { id: updated.id, paymentStatus: updated.payment_status } });
    }

    // update: special requests by the customer or provider
    if (!isCustomer && !isProvider && !isAdmin) {
      return NextResponse.json({ error: 'Boeking niet gevonden' }, { status: 404 });
    }
    const updated = await prisma.booking.update({
      where: { id: bookingId },
      data: { special_requests: data.specialRequests },
    });
    return NextResponse.json({ success: true, booking: { id: updated.id, specialRequests: updated.special_requests } });
  } catch (error) {
    const known = workflowErrorResponse(error);
    if (known) return NextResponse.json(known.body, { status: known.status });
    console.error('Update booking error:', error);
    return NextResponse.json(
      { error: 'Er is iets misgegaan bij het updaten van de boeking' },
      { status: 500 }
    );
  }
}
