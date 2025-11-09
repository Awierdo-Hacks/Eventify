import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

// PATCH - Accept or reject quote
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

    const { id: quoteId } = await params;
    const body = await request.json();
    const { action } = body; // 'accept' or 'reject'

    if (!action || (action !== 'accept' && action !== 'reject')) {
      return NextResponse.json(
        { error: 'Invalid action. Use "accept" or "reject"' },
        { status: 400 }
      );
    }

    // Get quote with service request
    const quote = await prisma.quote.findUnique({
      where: { id: quoteId },
      include: {
        request: {
          select: {
            id: true,
            customer_id: true,
            event_date: true,
            event_location: true,
            event_type: true,
            guest_count: true,
          },
        },
      },
    });

    if (!quote) {
      return NextResponse.json(
        { error: 'Offerte niet gevonden' },
        { status: 404 }
      );
    }

    // Check if user is the customer who made the request
    if (quote.request.customer_id !== session.id) {
      return NextResponse.json(
        { error: 'Forbidden - alleen de klant kan deze offerte accepteren' },
        { status: 403 }
      );
    }

    // Check if quote is still pending (not accepted yet)
    if (quote.accepted && action === 'accept') {
      return NextResponse.json(
        { error: 'Offerte is al geaccepteerd' },
        { status: 400 }
      );
    }

    if (action === 'accept') {
      // Accept quote - create booking and update statuses
      const [updatedQuote, booking] = await prisma.$transaction([
        // Update quote accepted status
        prisma.quote.update({
          where: { id: quoteId },
          data: { accepted: true },
        }),
        // Create booking
        prisma.booking.create({
          data: {
            request_id: quote.request_id,
            customer_id: quote.request.customer_id,
            provider_id: quote.provider_id,
            event_date: quote.request.event_date,
            event_location: quote.request.event_location,
            guest_count: quote.request.guest_count,
            final_price: quote.total_price,
            status: 'PENDING',
          },
        }),
        // Update service request status
        prisma.serviceRequest.update({
          where: { id: quote.request_id },
          data: { status: 'ACCEPTED' },
        }),
      ]);

      return NextResponse.json({
        success: true,
        message: 'Offerte geaccepteerd en boeking aangemaakt',
        quote: {
          id: updatedQuote.id,
          accepted: updatedQuote.accepted,
        },
        booking: {
          id: booking.id,
          eventDate: booking.event_date,
          status: booking.status,
        },
      });
    } else {
      // Reject quote - just mark as not accepted
      const updatedQuote = await prisma.quote.update({
        where: { id: quoteId },
        data: { accepted: false },
      });

      return NextResponse.json({
        success: true,
        message: 'Offerte afgewezen',
        quote: {
          id: updatedQuote.id,
          accepted: updatedQuote.accepted,
        },
      });
    }
  } catch (error) {
    console.error('Quote action error:', error);
    return NextResponse.json(
      { error: 'Er is iets misgegaan bij het verwerken van de offerte' },
      { status: 500 }
    );
  }
}
