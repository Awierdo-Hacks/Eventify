import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ bookingId: string }> }
) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 })
    }

    const { bookingId } = await params

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        payments: {
          orderBy: { created_at: 'desc' },
          take: 1,
        },
      },
    })

    if (!booking) {
      return NextResponse.json({ error: 'Boeking niet gevonden' }, { status: 404 })
    }

    // Eigenaarschapscheck
    if (booking.customer_id !== session.id && session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Geen toegang' }, { status: 403 })
    }

    const latestPayment = booking.payments[0] ?? null

    return NextResponse.json({
      paymentStatus: booking.payment_status,
      latestPayment: latestPayment
        ? {
            id: latestPayment.id,
            status: latestPayment.status,
            method: latestPayment.method,
            paidAt: latestPayment.paid_at,
            checkoutUrl: latestPayment.checkout_url,
          }
        : null,
    })
  } catch (error) {
    console.error('[payments/status] error:', error)
    return NextResponse.json({ error: 'Er ging iets mis.' }, { status: 500 })
  }
}
