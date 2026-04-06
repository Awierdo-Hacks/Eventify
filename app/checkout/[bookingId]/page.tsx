import { redirect, notFound } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { CheckoutClient } from './CheckoutClient'

interface PageProps {
  params: Promise<{ bookingId: string }>
}

export default async function CheckoutPage({ params }: PageProps) {
  const session = await getSession()
  if (!session) {
    redirect('/login')
  }

  const { bookingId } = await params

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      provider: { select: { business_name: true } },
      request: { select: { included_services: false, description: true } },
    },
  })

  if (!booking || booking.customer_id !== session.id) {
    notFound()
  }

  // Al betaald? Stuur door naar resultaat
  if (booking.payment_status === 'PAID') {
    redirect(`/checkout/${bookingId}/result?status=paid`)
  }

  // Haal inbegrepen diensten op via de gerelateerde quote
  const quote = await prisma.quote.findFirst({
    where: { request_id: booking.request_id, accepted: true },
    select: { included_services: true },
  })

  const bookingData = {
    id: booking.id,
    eventDate: booking.event_date.toISOString(),
    eventLocation: booking.event_location,
    guestCount: booking.guest_count,
    finalPrice: booking.final_price,
    providerName: booking.provider.business_name,
    includedServices: quote?.included_services ?? [],
  }

  return <CheckoutClient booking={bookingData} />
}
