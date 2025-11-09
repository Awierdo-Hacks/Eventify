import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/middleware/auth';

// PATCH - Moderate user (suspend/ban/activate)
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { error } = await requireRole('ADMIN');
    if (error) return error;

    const { id: userId } = await params;
    const body = await request.json();
    const { action } = body;

    if (!['suspend', 'ban', 'activate'].includes(action)) {
      return NextResponse.json(
        { error: 'Ongeldige actie. Moet suspend, ban of activate zijn' },
        { status: 400 }
      );
    }

    // Check if user exists and is not admin
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User niet gevonden' },
        { status: 404 }
      );
    }

    if (user.role === 'ADMIN') {
      return NextResponse.json(
        { error: 'Kan geen admin users modereren' },
        { status: 403 }
      );
    }

    // Update user status
    const newStatus = action === 'suspend' ? 'SUSPENDED' : action === 'ban' ? 'BANNED' : 'ACTIVE';
    
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { status: newStatus },
    });

    const actionMessages = {
      suspend: 'geschorst',
      ban: 'verbannen',
      activate: 'geactiveerd',
    };

    return NextResponse.json({
      success: true,
      message: `User ${actionMessages[action as keyof typeof actionMessages]}`,
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        status: updatedUser.status,
      },
    });
  } catch (error) {
    console.error('Moderate user error:', error);
    return NextResponse.json(
      { error: 'Er is iets misgegaan bij het modereren van de user' },
      { status: 500 }
    );
  }
}

// DELETE - Delete user
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { error } = await requireRole('ADMIN');
    if (error) return error;

    const { id: userId } = await params;

    // Check if user exists and is not admin
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User niet gevonden' },
        { status: 404 }
      );
    }

    if (user.role === 'ADMIN') {
      return NextResponse.json(
        { error: 'Kan geen admin users verwijderen' },
        { status: 403 }
      );
    }

    // Delete user (cascade will handle related records)
    await prisma.user.delete({
      where: { id: userId },
    });

    return NextResponse.json({
      success: true,
      message: 'User permanent verwijderd',
    });
  } catch (error) {
    console.error('Delete user error:', error);
    return NextResponse.json(
      { error: 'Er is iets misgegaan bij het verwijderen van de user' },
      { status: 500 }
    );
  }
}
