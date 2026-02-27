import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

// DELETE - Remove a slot from an event
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; slotId: string }> }
) {
  try {
    const session = await getSession();
    const { id: eventId, slotId } = await params;

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized - login required' },
        { status: 401 }
      );
    }

    // Check event ownership
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { customer_id: true },
    });

    if (!event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    if (event.customer_id !== session.id) {
      return NextResponse.json(
        { error: 'Not authorized to modify this event' },
        { status: 403 }
      );
    }

    // Check if slot exists and belongs to this event
    const slot = await prisma.eventSlot.findFirst({
      where: {
        id: slotId,
        event_id: eventId,
      },
      select: {
        id: true,
        booked_quote_id: true,
      },
    });

    if (!slot) {
      return NextResponse.json(
        { error: 'Slot not found' },
        { status: 404 }
      );
    }

    // Don't allow deleting slots with booked quotes
    if (slot.booked_quote_id) {
      return NextResponse.json(
        { error: 'Cannot delete a slot with a booked provider. Cancel the booking first.' },
        { status: 400 }
      );
    }

    // Unlink all quotes from this slot
    await prisma.quote.updateMany({
      where: {
        event_slot_id: slotId,
      },
      data: {
        event_slot_id: null,
      },
    });

    // Delete the slot
    await prisma.eventSlot.delete({
      where: { id: slotId },
    });

    return NextResponse.json({ success: true, message: 'Slot removed' });
  } catch (error) {
    console.error('Error deleting slot:', error);
    return NextResponse.json(
      { error: 'Failed to delete slot' },
      { status: 500 }
    );
  }
}

// PATCH - Update slot status or details
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; slotId: string }> }
) {
  try {
    const session = await getSession();
    const { id: eventId, slotId } = await params;

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized - login required' },
        { status: 401 }
      );
    }

    // Check event ownership
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { customer_id: true },
    });

    if (!event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    if (event.customer_id !== session.id) {
      return NextResponse.json(
        { error: 'Not authorized to modify this event' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { status, customName, isRequired } = body;

    // Build update data
    const updateData: any = {};
    
    if (status !== undefined) {
      const validStatuses = ['EMPTY', 'SEARCHING', 'QUOTES_REQUESTED', 'QUOTES_RECEIVED', 'BOOKED'];
      if (!validStatuses.includes(status)) {
        return NextResponse.json(
          { error: 'Invalid status' },
          { status: 400 }
        );
      }
      updateData.status = status;
    }
    
    if (customName !== undefined) {
      updateData.custom_name = customName?.trim() || null;
    }
    
    if (isRequired !== undefined) {
      updateData.is_required = isRequired;
    }

    const updatedSlot = await prisma.eventSlot.update({
      where: { id: slotId },
      data: updateData,
    });

    return NextResponse.json({
      id: updatedSlot.id,
      category: updatedSlot.category,
      customName: updatedSlot.custom_name,
      isRequired: updatedSlot.is_required,
      displayOrder: updatedSlot.display_order,
      status: updatedSlot.status,
    });
  } catch (error) {
    console.error('Error updating slot:', error);
    return NextResponse.json(
      { error: 'Failed to update slot' },
      { status: 500 }
    );
  }
}
