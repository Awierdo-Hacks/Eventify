import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/middleware/auth';

// PATCH - Verify/unverify provider (admin only)
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { error } = await requireRole('ADMIN');
    if (error) return error;

    const { id: providerId } = await params;
    const body = await request.json();
    const { verified } = body;

    if (typeof verified !== 'boolean') {
      return NextResponse.json(
        { error: 'Verified moet een boolean zijn' },
        { status: 400 }
      );
    }

    const provider = await prisma.serviceProvider.update({
      where: { id: providerId },
      data: { verified },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: verified ? 'Provider geverifieerd' : 'Verificatie ingetrokken',
      provider: {
        id: provider.id,
        businessName: provider.business_name,
        verified: provider.verified,
        user: {
          id: provider.user.id,
          name: provider.user.name,
          email: provider.user.email,
        },
      },
    });
  } catch (error) {
    console.error('Verify provider error:', error);
    return NextResponse.json(
      { error: 'Er is iets misgegaan bij het verifiëren van de provider' },
      { status: 500 }
    );
  }
}

// DELETE - Delete provider (admin only)
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { error } = await requireRole('ADMIN');
    if (error) return error;

    const { id: providerId } = await params;

    await prisma.serviceProvider.delete({
      where: { id: providerId },
    });

    return NextResponse.json({
      success: true,
      message: 'Provider verwijderd',
    });
  } catch (error) {
    console.error('Delete provider error:', error);
    return NextResponse.json(
      { error: 'Er is iets misgegaan bij het verwijderen van de provider' },
      { status: 500 }
    );
  }
}
