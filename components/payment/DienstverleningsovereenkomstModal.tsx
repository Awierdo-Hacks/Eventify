'use client'

import { useState } from 'react'
import Link from 'next/link'
import { FileText, MapPin, Calendar, Users, ShieldCheck } from 'lucide-react'
import {
  ConfirmationDialog,
  DialogActions,
  DialogButton,
} from '@/components/ui/confirmation-dialog'
import { format } from 'date-fns'
import { nl } from 'date-fns/locale'

export interface BookingForModal {
  id: string
  eventDate: string | Date
  eventLocation: string
  guestCount: number
  finalPrice: number
  providerName: string
  includedServices: string[]
}

interface Props {
  booking: BookingForModal
  open: boolean
  onClose: () => void
  onAccept: (bookingId: string) => void
}

export function DienstverleningsovereenkomstModal({ booking, open, onClose, onAccept }: Props) {
  const [agreed, setAgreed] = useState(false)

  const eventDate =
    typeof booking.eventDate === 'string'
      ? new Date(booking.eventDate)
      : booking.eventDate

  function handleAccept() {
    if (!agreed) return
    onAccept(booking.id)
    onClose()
  }

  return (
    <ConfirmationDialog
      open={open}
      onOpenChange={(v) => { if (!v) onClose() }}
      title="Dienstverleningsovereenkomst"
      description="Lees en bevestig onderstaande overeenkomst voor uw boeking"
      maxWidth="2xl"
    >
      <div className="space-y-5">

        {/* Dienst samenvatting */}
        <div className="bg-gray-50 rounded-2xl p-5 space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <FileText className="w-4 h-4 text-purple-600" />
            <span className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
              Boekingsdetails
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-gray-700">
            <div>
              <p className="text-xs text-gray-500 mb-0.5">Dienstverlener</p>
              <p className="font-semibold">{booking.providerName}</p>
            </div>
            <div className="flex items-start gap-2">
              <Calendar className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-gray-500 mb-0.5">Evenementdatum</p>
                <p className="font-semibold">
                  {format(eventDate, 'd MMMM yyyy', { locale: nl })}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-gray-500 mb-0.5">Locatie</p>
                <p className="font-semibold">{booking.eventLocation}</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Users className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-gray-500 mb-0.5">Aantal gasten</p>
                <p className="font-semibold">{booking.guestCount}</p>
              </div>
            </div>
          </div>

          {booking.includedServices.length > 0 && (
            <div>
              <p className="text-xs text-gray-500 mb-1.5">Inbegrepen diensten</p>
              <div className="flex flex-wrap gap-1.5">
                {booking.includedServices.map((s, i) => (
                  <span
                    key={i}
                    className="bg-purple-100 text-purple-700 text-xs font-medium px-2.5 py-1 rounded-full"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Totaalbedrag */}
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-5 border border-purple-100">
          <div className="flex items-center justify-between">
            <span className="text-gray-700 font-medium">Totaalbedrag</span>
            <span className="text-3xl font-bold text-gray-900">
              €{booking.finalPrice.toFixed(2).replace('.', ',')}
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">Inclusief BTW indien van toepassing</p>
        </div>

        {/* Juridische tekst */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-gray-700 space-y-2">
          <div className="flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-amber-800 mb-1">Juridische kennisgeving</p>
              <p className="text-xs text-amber-700 leading-relaxed">
                Door verder te gaan sluit u een bindende <strong>Dienstverleningsovereenkomst</strong>{' '}
                af met bovenstaande dienstverlener conform het Belgisch contractenrecht.{' '}
                <strong>Eventiphy</strong> treedt uitsluitend op als bemiddelend platform (Artikel 4
                Algemene Voorwaarden) en is geen contractpartij. De dienstverlener is verantwoordelijk
                voor de correcte uitvoering van de dienst.
              </p>
            </div>
          </div>
        </div>

        {/* Checkbox akkoord */}
        <label className="flex items-start gap-3 cursor-pointer select-none p-3 rounded-xl hover:bg-gray-50 transition-colors">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="mt-0.5 h-5 w-5 rounded border-gray-300 text-purple-600 focus:ring-purple-500 cursor-pointer flex-shrink-0"
          />
          <span className="text-sm text-gray-700 leading-relaxed">
            Ik heb de{' '}
            <Link
              href="/voorwaarden"
              target="_blank"
              rel="noopener noreferrer"
              className="text-purple-600 underline hover:text-purple-800 font-medium"
              onClick={(e) => e.stopPropagation()}
            >
              Algemene Voorwaarden en Privacyverklaring
            </Link>{' '}
            gelezen en ga ermee akkoord. Ik bevestig dat deze Dienstverleningsovereenkomst
            rechtsgeldig bindend is.
          </span>
        </label>

        {/* Actieknoppen */}
        <DialogActions>
          <DialogButton variant="outline" onClick={onClose}>
            Annuleren
          </DialogButton>
          <DialogButton
            variant="primary"
            onClick={handleAccept}
            disabled={!agreed}
          >
            Akkoord — doorgaan naar betaling →
          </DialogButton>
        </DialogActions>
      </div>
    </ConfirmationDialog>
  )
}
