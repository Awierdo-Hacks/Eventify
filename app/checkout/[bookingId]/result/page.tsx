'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { CheckCircle, XCircle, Clock, ArrowRight, RefreshCw } from 'lucide-react'

type Status = 'polling' | 'paid' | 'failed' | 'cancelled' | 'expired'

export default function PaymentResultPage() {
  const params = useParams()
  const router = useRouter()
  const bookingId = params.bookingId as string

  const [status, setStatus] = useState<Status>('polling')
  const [attempts, setAttempts] = useState(0)
  const MAX_ATTEMPTS = 15

  useEffect(() => {
    if (status !== 'polling') return

    const poll = async () => {
      try {
        const res = await fetch(`/api/payments/${bookingId}/status`)
        if (!res.ok) {
          setStatus('failed')
          return
        }
        const data = await res.json()
        const ps: string = data.paymentStatus ?? data.latestPayment?.status ?? ''

        if (ps === 'PAID') {
          setStatus('paid')
          return
        }
        if (ps === 'FAILED') {
          setStatus('failed')
          return
        }
        if (ps === 'CANCELLED') {
          setStatus('cancelled')
          return
        }
        if (ps === 'EXPIRED') {
          setStatus('expired')
          return
        }
      } catch {
        // Netwerk fout — blijf proberen
      }

      setAttempts((a) => {
        const next = a + 1
        if (next >= MAX_ATTEMPTS) {
          setStatus('failed')
        }
        return next
      })
    }

    const timer = setTimeout(poll, 2000)
    return () => clearTimeout(timer)
  }, [status, attempts, bookingId])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-lg p-10 text-center">

        {status === 'polling' && (
          <>
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Clock className="w-8 h-8 text-purple-600 animate-pulse" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Betaling wordt verwerkt</h1>
            <p className="text-gray-500 text-sm mb-6">
              Even geduld — we controleren de status van uw betaling.
            </p>
            <div className="flex justify-center gap-1.5">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"
                  style={{ animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </div>
          </>
        )}

        {status === 'paid' && (
          <>
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Betaling geslaagd!</h1>
            <p className="text-gray-600 text-sm mb-8">
              Uw boeking is bevestigd. U ontvangt een bevestigingsmail met alle details.
            </p>
            <button
              onClick={() => router.push('/dashboard?tab=bookings')}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold rounded-xl py-3.5 flex items-center justify-center gap-2 transition-all shadow-md"
            >
              Naar mijn boekingen
              <ArrowRight className="w-4 h-4" />
            </button>
          </>
        )}

        {(status === 'failed' || status === 'expired') && (
          <>
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <XCircle className="w-10 h-10 text-red-500" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {status === 'expired' ? 'Betaling verlopen' : 'Betaling mislukt'}
            </h1>
            <p className="text-gray-600 text-sm mb-8">
              {status === 'expired'
                ? 'De betaalsessie is verlopen. Start een nieuwe betaling om uw boeking te voltooien.'
                : 'Er is iets misgegaan bij de verwerking van uw betaling. Probeer het opnieuw.'}
            </p>
            <div className="space-y-3">
              <button
                onClick={() => router.push(`/checkout/${bookingId}`)}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold rounded-xl py-3.5 flex items-center justify-center gap-2 transition-all shadow-md"
              >
                <RefreshCw className="w-4 h-4" />
                Opnieuw proberen
              </button>
              <button
                onClick={() => router.push('/dashboard?tab=bookings')}
                className="w-full text-gray-500 hover:text-gray-800 text-sm underline py-2 transition-colors"
              >
                Terug naar dashboard
              </button>
            </div>
          </>
        )}

        {status === 'cancelled' && (
          <>
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <XCircle className="w-10 h-10 text-gray-500" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Betaling geannuleerd</h1>
            <p className="text-gray-600 text-sm mb-8">
              U heeft de betaling geannuleerd. Uw boeking blijft bewaard — u kunt later opnieuw betalen.
            </p>
            <div className="space-y-3">
              <button
                onClick={() => router.push(`/checkout/${bookingId}`)}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-xl py-3.5 flex items-center justify-center gap-2 shadow-md"
              >
                Toch betalen
              </button>
              <button
                onClick={() => router.push('/dashboard?tab=bookings')}
                className="w-full text-gray-500 hover:text-gray-800 text-sm underline py-2 transition-colors"
              >
                Terug naar dashboard
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
