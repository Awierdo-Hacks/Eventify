import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

// PATCH - Update booking status
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
    const body = await request.json();
    const { status, paymentStatus, specialRequests } = body;

    // Get booking
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
    });

    if (!booking) {
      return NextResponse.json(
        { error: 'Boeking niet gevonden' },
        { status: 404 }
      );
    }

    // Check authorization
    const isCustomer = booking.customer_id === session.id;
    const isProvider = booking.provider_id === session.providerId;
    const isAdmin = session.role === 'ADMIN';

    if (!isCustomer && !isProvider && !isAdmin) {
      return NextResponse.json(
        { error: 'Forbidden - geen toegang tot deze boeking' },
        { status: 403 }
      );
    }

    // Build update data
    const updateData: any = {};

    if (status) {
      // Only provider and admin can update status
      if (!isProvider && !isAdmin) {
        return NextResponse.json(
          { error: 'Alleen providers en admins kunnen de status updaten' },
          { status: 403 }
        );
      }
      if (!['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED'].includes(status)) {
        return NextResponse.json(
          { error: 'Ongeldige status' },
          { status: 400 }
        );
      }
      updateData.status = status;
    }

    // Payment status is set by the payment webhook; only admins may correct it by hand
    if (paymentStatus !== undefined) {
      if (!isAdmin) {
        return NextResponse.json(
          { error: 'Alleen admins kunnen de betaalstatus aanpassen' },
          { status: 403 }
        );
      }
      if (!['UNPAID', 'PENDING', 'PAID', 'FAILED', 'CANCELLED', 'EXPIRED', 'REFUNDED'].includes(paymentStatus)) {
        return NextResponse.json(
          { error: 'Ongeldige betaalstatus' },
          { status: 400 }
        );
      }
      updateData.payment_status = paymentStatus;
    }

    if (specialRequests !== undefined) {
      if (specialRequests !== null && typeof specialRequests !== 'string') {
        return NextResponse.json(
          { error: 'Ongeldige speciale wensen' },
          { status: 400 }
        );
      }
      updateData.special_requests = specialRequests?.slice(0, 2000) ?? null;
    }

    // Update booking
    const updatedBooking = await prisma.booking.update({
      where: { id: bookingId },
      data: updateData,
      include: {
        customer: {
          select: {
            id: true,
            name: true,
          },
        },
        provider: {
          select: {
            id: true,
            business_name: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      booking: {
        id: updatedBooking.id,
        status: updatedBooking.status,
        paymentStatus: updatedBooking.payment_status,
        specialRequests: updatedBooking.special_requests,
        customer: {
          id: updatedBooking.customer.id,
          name: updatedBooking.customer.name,
        },
        provider: {
          id: updatedBooking.provider.id,
          businessName: updatedBooking.provider.business_name,
        },
      },
    });
  } catch (error) {
    console.error('Update booking error:', error);
    return NextResponse.json(
      { error: 'Er is iets misgegaan bij het updaten van de boeking' },
      { status: 500 }
    );
  }
}
