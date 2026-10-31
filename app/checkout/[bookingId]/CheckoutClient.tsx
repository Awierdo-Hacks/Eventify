'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, CreditCard, Smartphone, Banknote, Lock, ChevronRight } from 'lucide-react'
import { DienstverleningsovereenkomstModal, BookingForModal } from '@/components/payment/DienstverleningsovereenkomstModal'
import { format } from 'date-fns'
import { nl } from 'date-fns/locale'

type PaymentMethod = 'bancontact' | 'payconiq' | 'creditcard'

const METHODS: { id: PaymentMethod; label: string; sublabel: string; icon: React.ReactNode }[] = [
  {
    id: 'bancontact',
    label: 'Bancontact',
    sublabel: 'Betaal met uw Belgische bankkaart',
    icon: (
      <div className="w-10 h-10 bg-[#005498] rounded-lg flex items-center justify-center flex-shrink-0">
        <Banknote className="w-5 h-5 text-white" />
      </div>
    ),
  },
  {
    id: 'payconiq',
    label: 'Payconiq by Bancontact',
    sublabel: 'Scan QR-code met uw bankapp',
    icon: (
      <div className="w-10 h-10 bg-[#FF4785] rounded-lg flex items-center justify-center flex-shrink-0">
        <Smartphone className="w-5 h-5 text-white" />
      </div>
    ),
  },
  {
    id: 'creditcard',
    label: 'Kredietkaart',
    sublabel: 'Visa of Mastercard',
    icon: (
      <div className="w-10 h-10 bg-gradient-to-br from-gray-700 to-gray-900 rounded-lg flex items-center justify-center flex-shrink-0">
        <CreditCard className="w-5 h-5 text-white" />
      </div>
    ),
  },
]

interface Props {
  booking: BookingForModal
}

export function CheckoutClient({ booking }: Props) {
  const router = useRouter()
  const [showModal, setShowModal] = useState(true)
  const [tosAccepted, setTosAccepted] = useState(false)
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const eventDate = new Date(booking.eventDate)

  function handleModalAccept(bookingId: string) {
    setTosAccepted(true)
    setShowModal(false)
  }

  async function handlePay() {
    if (!selectedMethod || !tosAccepted) return
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId: booking.id, method: selectedMethod }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? 'Er ging iets mis. Probeer opnieuw.')
        return
      }

      // Redirect naar Mollie hosted checkout
      window.location.href = data.checkoutUrl
    } catch {
      setError('Netwerkfout. Controleer uw verbinding en probeer opnieuw.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-xl mx-auto px-4 py-10">

        {/* Terug knop */}
        <button
          onClick={() => router.push('/dashboard?tab=bookings')}
          className="flex items-center gap-2 text-gray-500 hover:text-gray-800 text-sm mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Terug naar dashboard
        </button>

        <h1 className="text-3xl font-bold text-gray-900 mb-2">Afrekenen</h1>
        <p className="text-gray-500 mb-8">Kies een betaalmethode om uw boeking te voltooien</p>

        {/* Bestelling samenvatting */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
            Uw boeking
          </h2>
          <div className="space-y-2">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-semibold text-gray-900">{booking.providerName}</p>
                <p className="text-sm text-gray-500">
                  {format(eventDate, 'd MMMM yyyy', { locale: nl })} · {booking.eventLocation}
                </p>
                {booking.includedServices.length > 0 && (
                  <p className="text-xs text-gray-400 mt-1">
                    {booking.includedServices.slice(0, 3).join(' · ')}
                    {booking.includedServices.length > 3 && ` +${booking.includedServices.length - 3}`}
                  </p>
                )}
              </div>
              <span className="text-xl font-bold text-gray-900 ml-4 flex-shrink-0">
                €{booking.finalPrice.toFixed(2).replace('.', ',')}
              </span>
            </div>
          </div>
        </div>

        {/* Betaalmethode keuze */}
        {tosAccepted ? (
          <>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
                Betaalmethode
              </h2>
              <div className="space-y-3">
                {METHODS.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setSelectedMethod(m.id)}
                    className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left ${
                      selectedMethod === m.id
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    {m.icon}
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900 text-sm">{m.label}</p>
                      <p className="text-xs text-gray-500">{m.sublabel}</p>
                    </div>
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                        selectedMethod === m.id ? 'border-purple-500 bg-purple-500' : 'border-gray-300'
                      }`}
                    >
                      {selectedMethod === m.id && (
                        <div className="w-2 h-2 rounded-full bg-white" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 mb-4">
                {error}
              </div>
            )}

            <button
              onClick={handlePay}
              disabled={!selectedMethod || loading}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-2xl py-4 text-lg flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all"
            >
              {loading ? (
                <>
                  <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Doorsturen naar betaling...
                </>
              ) : (
                <>
                  Betaal €{booking.finalPrice.toFixed(2).replace('.', ',')}
                  <ChevronRight className="w-5 h-5" />
                </>
              )}
            </button>

            <p className="flex items-center justify-center gap-1.5 text-xs text-gray-400 mt-4">
              <Lock className="w-3.5 h-3.5" />
              Beveiligde betaling via Mollie
            </p>
          </>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 text-center text-gray-500">
            <p className="text-sm">Accepteer de Dienstverleningsovereenkomst om verder te gaan.</p>
            <button
              onClick={() => setShowModal(true)}
              className="mt-3 text-purple-600 hover:text-purple-800 font-semibold text-sm underline"
            >
              Overeenkomst bekijken →
            </button>
          </div>
        )}

        {/* Dienstverleningsovereenkomst modal */}
        <DienstverleningsovereenkomstModal
          booking={booking}
          open={showModal}
          onClose={() => {
            setShowModal(false)
            // Als modal gesloten zonder akkoord, terug naar dashboard
            if (!tosAccepted) {
              router.push('/dashboard?tab=bookings')
            }
          }}
          onAccept={handleModalAccept}
        />
      </div>
    </div>
  )
}
