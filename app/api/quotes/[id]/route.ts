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
    const { action, reason } = body; // 'accept' or 'reject', optional rejection reason

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
      // Check if there's already a booking for this request
      const existingBooking = await prisma.booking.findUnique({
        where: { request_id: quote.request_id },
      });

      if (existingBooking) {
        return NextResponse.json(
          { error: 'Er is al een boeking voor deze aanvraag. Je kunt maar één offerte per aanvraag accepteren.' },
          { status: 400 }
        );
      }

      // Check if another quote for this request is already accepted
      const acceptedQuote = await prisma.quote.findFirst({
        where: {
          request_id: quote.request_id,
          accepted: true,
          id: { not: quoteId },
        },
      });

      if (acceptedQuote) {
        return NextResponse.json(
          { error: 'Er is al een andere offerte geaccepteerd voor deze aanvraag.' },
          { status: 400 }
        );
      }

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
            status: 'CONFIRMED',
            payment_status: 'UNPAID',
          },
        }),
      ]);

      // Update service request status separately
      await prisma.serviceRequest.update({
        where: { id: quote.request_id },
        data: { status: 'ACCEPTED' },
      });

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
      // Reject quote - mark as rejected with timestamp and optional reason
      const updatedQuote = await prisma.quote.update({
        where: { id: quoteId },
        data: {
          rejected_at: new Date(),
          rejection_reason: reason || null,
        },
      });
      
      return NextResponse.json({
        success: true,
        message: 'Offerte afgewezen',
        quote: {
          id: updatedQuote.id,
          accepted: false,
          rejectedAt: updatedQuote.rejected_at,
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

// DELETE - Cancel/delete a quote (Provider only, for rejected quotes)
export async function DELETE(
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

    if (session.role !== 'PROVIDER' || !session.providerId) {
      return NextResponse.json(
        { error: 'Forbidden - only providers can delete quotes' },
        { status: 403 }
      );
    }

    const { id: quoteId } = await params;

    // Get quote
    const quote = await prisma.quote.findUnique({
      where: { id: quoteId },
    });

    if (!quote) {
      return NextResponse.json(
        { error: 'Offerte niet gevonden' },
        { status: 404 }
      );
    }

    // Check if this is the provider's quote
    if (quote.provider_id !== session.providerId) {
      return NextResponse.json(
        { error: 'Je kunt alleen je eigen offertes annuleren' },
        { status: 403 }
      );
    }

    // Only allow deleting rejected quotes
    if (!quote.rejected_at) {
      return NextResponse.json(
        { error: 'Je kunt alleen afgewezen offertes annuleren' },
        { status: 400 }
      );
    }

    // Delete the quote
    await prisma.quote.delete({
      where: { id: quoteId },
    });

    return NextResponse.json({
      success: true,
      message: 'Offerte succesvol geannuleerd',
    });
  } catch (error) {
    console.error('Delete quote error:', error);
    return NextResponse.json(
      { error: 'Er is iets misgegaan bij het annuleren van de offerte' },
      { status: 500 }
    );
  }
}
