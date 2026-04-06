import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { mollieClient } from '@/lib/mollie'

// Mollie roept dit endpoint aan als een betaling van status verandert.
// Veiligheidsstrategie: we vertrouwen NOOIT de webhook body — we halen de
// betalingsstatus altijd op bij Mollie zelf om spoofing te voorkomen.
export async function POST(request: Request) {
  try {
    // Mollie stuurt application/x-www-form-urlencoded: id=tr_xxxxx
    const text = await request.text()
    const params = new URLSearchParams(text)
    const mollieId = params.get('id')

    if (!mollieId) {
      return NextResponse.json({ error: 'Missing id' }, { status: 400 })
    }

    // Haal de actuele betalingsstatus op bij Mollie (anti-spoofing)
    const molliePayment = await mollieClient.payments.get(mollieId)

    // Zoek onze Payment-record op
    const payment = await prisma.payment.findUnique({
      where: { mollie_payment_id: mollieId },
    })

    if (!payment) {
      // Onbekende payment — kan legitiem zijn als race condition bij aanmaken
      console.warn(`[webhook] Unknown payment id: ${mollieId}`)
      return new NextResponse(null, { status: 200 })
    }

    const mollieStatus = molliePayment.status
    const now = new Date()

    // State machine: Mollie status → onze PaymentStatus
    type StatusMap = Record<string, { paymentStatus: string; bookingStatus?: string; extra?: object }>
    const statusMap: StatusMap = {
      paid: {
        paymentStatus: 'PAID',
        bookingStatus: 'PAID',
        extra: { paid_at: now, webhook_received_at: now },
      },
      failed: {
        paymentStatus: 'FAILED',
        extra: { failed_at: now, webhook_received_at: now },
      },
      expired: {
        paymentStatus: 'EXPIRED',
        extra: { webhook_received_at: now },
      },
      canceled: {
        paymentStatus: 'CANCELLED',
        extra: { webhook_received_at: now },
      },
    }

    const mapped = statusMap[mollieStatus]
    if (!mapped) {
      // Tussentijdse status (open, pending) — nog geen actie nodig
      return new NextResponse(null, { status: 200 })
    }

    // Alles in één transactie bijwerken
    await prisma.$transaction(async (tx) => {
      await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: mapped.paymentStatus as any,
          ...(mapped.extra ?? {}),
        },
      })

      if (mapped.bookingStatus) {
        await tx.booking.update({
          where: { id: payment.booking_id },
          data: { payment_status: mapped.bookingStatus as any },
        })
      }

      await tx.paymentAuditLog.create({
        data: {
          booking_id: payment.booking_id,
          payment_id: payment.id,
          event: `WEBHOOK_${mapped.paymentStatus}`,
          metadata: {
            mollie_status: mollieStatus,
            mollie_payment_id: mollieId,
          },
        },
      })
    })

    // Mollie verwacht altijd een 200, anders herprobeert het
    return new NextResponse(null, { status: 200 })
  } catch (error) {
    console.error('[payments/webhook] error:', error)
    // Toch 200 teruggeven zodat Mollie niet blijft herprobeeren bij interne fouten
    return new NextResponse(null, { status: 200 })
  }
}
