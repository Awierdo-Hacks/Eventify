'use client';

import * as React from 'react';
import Link from 'next/link';
import { CalendarDays, Check, Link2, Link2Off, MapPin, MessageSquare, Trash2, Users } from 'lucide-react';
import { StatusBadge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CategoryIcon } from '@/components/ui/category-icon';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Field } from '@/components/ui/field';
import { Select, Textarea } from '@/components/ui/input';
import { useAction } from '@/hooks/use-action';
import { QUOTE_STATUS, categoryByKey, eventTypeLabel } from '@/lib/catalog';
import { formatDate, formatDateShort, formatPrice } from '@/lib/format';
import { cn } from '@/lib/utils';
import {
  acceptQuoteAction,
  linkQuoteAction,
  rejectQuoteAction,
  unlinkQuoteAction,
  withdrawQuoteAction,
} from '@/features/quotes/actions';
import type { LinkableEvent, QuoteView } from '@/features/quotes/queries';
import { openConversationAction } from '@/features/messaging/open-conversation';

interface QuoteCardProps {
  quote: QuoteView;
  viewer: 'customer' | 'provider';
  /** Customer's open event slots, for linking. */
  linkableEvents?: LinkableEvent[];
  /** Hide the request details (when the card already sits under its request). */
  compact?: boolean;
  /** Hide the chat button (when the card is shown inside a conversation). */
  hideChat?: boolean;
  className?: string;
}

function SlotSelect({
  events,
  value,
  onChange,
  allowNone,
}: {
  events: LinkableEvent[];
  value: string;
  onChange: (value: string) => void;
  allowNone?: boolean;
}) {
  return (
    <Select id="slot" value={value} onChange={(event) => onChange(event.target.value)}>
      {allowNone && <option value="">Niet koppelen</option>}
      {!allowNone && (
        <option value="" disabled>
          Kies een onderdeel
        </option>
      )}
      {events.map((event) => (
        <optgroup key={event.id} label={event.name}>
          {event.slots.map((slot) => (
            <option key={slot.id} value={slot.id}>
              {slot.customName || categoryByKey(slot.category).label}
            </option>
          ))}
        </optgroup>
      ))}
    </Select>
  );
}

function QuoteCard({ quote, viewer, linkableEvents = [], compact, hideChat, className }: QuoteCardProps) {
  const [dialog, setDialog] = React.useState<'accept' | 'reject' | 'link' | 'withdraw' | null>(null);
  const [slotId, setSlotId] = React.useState('');
  const [reason, setReason] = React.useState('');
  const close = () => setDialog(null);

  const accept = useAction(acceptQuoteAction, { onSuccess: close });
  const reject = useAction(rejectQuoteAction, { onSuccess: close });
  const link = useAction(linkQuoteAction, { onSuccess: close });
  const unlink = useAction(unlinkQuoteAction);
  const withdraw = useAction(withdrawQuoteAction, { onSuccess: close });
  const chat = useAction(openConversationAction);

  const isCustomer = viewer === 'customer';
  const canAct = isCustomer && quote.status === 'PENDING';
  const canLink = isCustomer && (quote.status === 'PENDING' || quote.status === 'ACCEPTED');
  const chatRecipient = isCustomer ? quote.provider.userId : quote.request.customer.id;

  return (
    <article className={cn('rounded-xl border border-ink-200 bg-surface shadow-xs', className)}>
      <div className="flex items-start justify-between gap-4 p-5">
        <div className="flex min-w-0 items-start gap-3">
          <CategoryIcon category={quote.provider.category} />
          <div className="min-w-0">
            <h3 className="truncate font-bold text-ink-950">
              {isCustomer ? (
                <Link href={`/providers/${quote.provider.id}`} className="hover:text-brand-700">
                  {quote.provider.name}
                </Link>
              ) : (
                quote.request.customer.name
              )}
            </h3>
            <p className="line-clamp-2 text-sm text-ink-600">{quote.title}</p>
          </div>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-2xl font-extrabold tabular-nums text-ink-950">{formatPrice(quote.price)}</p>
          <StatusBadge status={quote.status} map={QUOTE_STATUS} className="mt-1" />
        </div>
      </div>

      <div className="space-y-4 border-t border-ink-100 px-5 py-4">
        {!compact && (
          <ul className="flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-ink-600">
            <li className="font-semibold text-ink-900">{eventTypeLabel(quote.request.eventType)}</li>
            <li className="flex items-center gap-1.5">
              <CalendarDays className="size-4 text-ink-400" aria-hidden />
              {formatDate(quote.request.eventDate)}
            </li>
            <li className="flex items-center gap-1.5">
              <MapPin className="size-4 text-ink-400" aria-hidden />
              {quote.request.eventLocation}
            </li>
            {quote.request.guestCount > 0 && (
              <li className="flex items-center gap-1.5">
                <Users className="size-4 text-ink-400" aria-hidden />
                {quote.request.guestCount} gasten
              </li>
            )}
          </ul>
        )}

        {quote.includedServices.length > 0 && (
          <ul className="grid gap-1.5 text-sm text-ink-800 sm:grid-cols-2">
            {quote.includedServices.map((service) => (
              <li key={service} className="flex items-start gap-2">
                <Check className="mt-0.5 size-4 shrink-0 text-success-600" aria-hidden />
                {service}
              </li>
            ))}
          </ul>
        )}

        {quote.terms && <p className="text-sm leading-relaxed text-ink-600">{quote.terms}</p>}

        {quote.status === 'REJECTED' && quote.rejectionReason && (
          <p className="rounded-lg bg-danger-50 px-3 py-2 text-sm text-danger-800">
            <span className="font-semibold">Reden van afwijzing:</span> {quote.rejectionReason}
          </p>
        )}

        <p className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-500">
          <span>Ontvangen op {formatDateShort(quote.createdAt)}</span>
          {quote.status === 'PENDING' && <span>Geldig tot {formatDateShort(quote.validUntil)}</span>}
          {quote.linkedEvent && isCustomer && (
            <span>
              Gekoppeld aan{' '}
              <Link href={`/dashboard/events/${quote.linkedEvent.id}`} className="font-semibold text-brand-700 hover:underline">
                {quote.linkedEvent.name}
              </Link>
            </span>
          )}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2 border-t border-ink-100 px-5 py-3">
        {canAct && (
          <>
            <Button size="sm" onClick={() => { setSlotId(quote.slotId ?? ''); setDialog('accept'); }}>
              Accepteren
            </Button>
            <Button size="sm" variant="outline" onClick={() => setDialog('reject')}>
              Afwijzen
            </Button>
          </>
        )}
        {canLink && !quote.slotId && linkableEvents.length > 0 && (
          <Button size="sm" variant="ghost" onClick={() => { setSlotId(''); setDialog('link'); }}>
            <Link2 aria-hidden /> Koppel aan event
          </Button>
        )}
        {canLink && quote.slotId && (
          <Button size="sm" variant="ghost" loading={unlink.pending} onClick={() => unlink.run({ quoteId: quote.id })}>
            <Link2Off aria-hidden /> Loskoppelen
          </Button>
        )}
        {viewer === 'provider' && quote.status === 'REJECTED' && (
          <Button size="sm" variant="danger-outline" onClick={() => setDialog('withdraw')}>
            <Trash2 aria-hidden /> Verwijderen
          </Button>
        )}
        {!hideChat && (
          <Button
            size="sm"
            variant="ghost"
            className="ml-auto"
            loading={chat.pending}
            onClick={() => chat.run({ recipientId: chatRecipient })}
          >
            <MessageSquare aria-hidden /> Bericht
          </Button>
        )}
      </div>

      {/* Accept */}
      <ConfirmDialog
        open={dialog === 'accept'}
        onOpenChange={(open) => !open && close()}
        title="Offerte accepteren?"
        description={
          <>
            Je legt hiermee een afspraak vast met <strong>{quote.provider.name}</strong> voor{' '}
            <strong>{formatPrice(quote.price)}</strong>. De overeenkomst komt rechtstreeks tussen jou en de
            dienstverlener tot stand. Er wordt via Eventiphy niets betaald.
          </>
        }
        confirmLabel="Ja, accepteren"
        pending={accept.pending}
        onConfirm={() => accept.run({ quoteId: quote.id, slotId: slotId || null })}
      >
        {!quote.slotId && linkableEvents.length > 0 && (
          <Field label="Koppelen aan een event" htmlFor="slot" optional>
            <SlotSelect events={linkableEvents} value={slotId} onChange={setSlotId} allowNone />
          </Field>
        )}
      </ConfirmDialog>

      {/* Reject */}
      <Dialog open={dialog === 'reject'} onOpenChange={(open) => !open && close()}>
        <DialogContent size="sm">
          <DialogHeader>
            <DialogTitle>Offerte afwijzen</DialogTitle>
            <DialogDescription>
              {quote.provider.name} krijgt te zien dat je de offerte hebt afgewezen. Een reden helpt hen een beter
              voorstel te doen.
            </DialogDescription>
          </DialogHeader>
          <DialogBody>
            <Field label="Reden" htmlFor="reason" optional>
              <Textarea
                id="reason"
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                maxLength={500}
                rows={3}
                placeholder="bv. Het valt buiten ons budget."
              />
            </Field>
          </DialogBody>
          <DialogFooter>
            <Button variant="outline" onClick={close} disabled={reject.pending}>
              Annuleren
            </Button>
            <Button variant="danger" loading={reject.pending} onClick={() => reject.run({ quoteId: quote.id, reason })}>
              Offerte afwijzen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Link */}
      <Dialog open={dialog === 'link'} onOpenChange={(open) => !open && close()}>
        <DialogContent size="sm">
          <DialogHeader>
            <DialogTitle>Koppel aan een event</DialogTitle>
            <DialogDescription>Kies bij welk onderdeel van je event deze offerte hoort.</DialogDescription>
          </DialogHeader>
          <DialogBody>
            <Field label="Onderdeel" htmlFor="slot">
              <SlotSelect events={linkableEvents} value={slotId} onChange={setSlotId} />
            </Field>
          </DialogBody>
          <DialogFooter>
            <Button variant="outline" onClick={close} disabled={link.pending}>
              Annuleren
            </Button>
            <Button disabled={!slotId} loading={link.pending} onClick={() => link.run({ quoteId: quote.id, slotId })}>
              Koppelen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Withdraw (provider) */}
      <ConfirmDialog
        open={dialog === 'withdraw'}
        onOpenChange={(open) => !open && close()}
        title="Afgewezen offerte verwijderen?"
        description="De offerte verdwijnt uit je overzicht. Je kunt daarna een nieuwe offerte sturen voor dezelfde aanvraag."
        confirmLabel="Verwijderen"
        tone="danger"
        pending={withdraw.pending}
        onConfirm={() => withdraw.run({ quoteId: quote.id })}
      />
    </article>
  );
}

export { QuoteCard };
