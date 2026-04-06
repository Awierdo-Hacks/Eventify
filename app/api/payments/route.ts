import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { mollieClient } from '@/lib/mollie'
import { checkRateLimit } from '@/lib/rate-limit'

const VALID_METHODS = ['bancontact', 'payconiq', 'creditcard'] as const
type PaymentMethod = (typeof VALID_METHODS)[number]

const MOLLIE_METHOD_MAP: Record<PaymentMethod, string> = {
  bancontact: 'bancontact',
  payconiq: 'payconiq',
  creditcard: 'creditcard',
}

export async function POST(request: Request) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 })
    }

    // Rate limiting: 5 payment initiaties per user per minuut
    if (!checkRateLimit(`payment:${session.id}`, 5, 60_000)) {
      return NextResponse.json(
        { error: 'Te veel verzoeken. Probeer het later opnieuw.' },
        { status: 429 }
      )
    }

    const body = await request.json()
    const { bookingId, method } = body as { bookingId?: string; method?: string }

    if (!bookingId || !method) {
      return NextResponse.json({ error: 'bookingId en method zijn verplicht' }, { status: 400 })
    }

    if (!VALID_METHODS.includes(method as PaymentMethod)) {
      return NextResponse.json(
        { error: `Ongeldige betaalmethode. Kies uit: ${VALID_METHODS.join(', ')}` },
        { status: 400 }
      )
    }

    // Booking ophalen — bedrag ALTIJD uit DB, nooit van client
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        provider: { select: { business_name: true } },
        customer: { select: { name: true, email: true } },
      },
    })

    if (!booking) {
      return NextResponse.json({ error: 'Boeking niet gevonden' }, { status: 404 })
    }

    // Eigenaarschapscheck
    if (booking.customer_id !== session.id) {
      return NextResponse.json({ error: 'Geen toegang tot deze boeking' }, { status: 403 })
    }

    // Dubbele betaling blokkeren
    if (booking.payment_status === 'PAID') {
      return NextResponse.json({ error: 'Boeking is al betaald' }, { status: 409 })
    }

    // Idempotentie: bestaat al een PENDING payment voor deze boeking van de laatste 15 min?
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000)
    const existingPayment = await prisma.payment.findFirst({
      where: {
        booking_id: bookingId,
        status: 'PENDING',
        created_at: { gte: fifteenMinutesAgo },
      },
    })

    if (existingPayment?.checkout_url) {
      return NextResponse.json({ checkoutUrl: existingPayment.checkout_url })
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
    const amount = booking.final_price

    // Mollie payment aanmaken
    const molliePayment = await mollieClient.payments.create({
      amount: {
        currency: 'EUR',
        value: amount.toFixed(2),
      },
      description: `Eventiphy boeking #${booking.id.slice(-8)} — ${booking.provider.business_name}`,
      method: MOLLIE_METHOD_MAP[method as PaymentMethod] as any,
      redirectUrl: `${baseUrl}/checkout/${bookingId}/result`,
      webhookUrl: `${baseUrl}/api/payments/webhook`,
      metadata: {
        bookingId,
        customerId: session.id,
      },
    })

    const idempotencyKey = crypto.randomUUID()
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'

    // Payment record + audit log in één transaction
    await prisma.$transaction([
      prisma.payment.create({
        data: {
          booking_id: bookingId,
          mollie_payment_id: molliePayment.id,
          amount,
          currency: 'EUR',
          method,
          status: 'PENDING',
          idempotency_key: idempotencyKey,
          checkout_url: molliePayment.getCheckoutUrl() ?? undefined,
        },
      }),
      prisma.paymentAuditLog.create({
        data: {
          booking_id: bookingId,
          user_id: session.id,
          event: 'PAYMENT_INITIATED',
          ip_address: ip,
          metadata: {
            mollie_payment_id: molliePayment.id,
            amount,
            method,
          },
        },
      }),
    ])

    return NextResponse.json({ checkoutUrl: molliePayment.getCheckoutUrl() })
  } catch (error) {
    console.error('[payments/create] error:', error)
    return NextResponse.json(
      { error: 'Er ging iets mis bij het aanmaken van de betaling.' },
      { status: 500 }
    )
  }
}
