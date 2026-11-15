'use client';

import * as React from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useAction } from '@/hooks/use-action';
import { updateBookingStatusAction } from '@/features/bookings/actions';

interface BookingActionsProps {
  bookingId: string;
  status: string;
  customerName: string;
  /** The event date has passed, so the booking can be completed. */
  eventPassed: boolean;
}

function BookingActions({ bookingId, status, customerName, eventPassed }: BookingActionsProps) {
  const [dialog, setDialog] = React.useState<'COMPLETED' | 'CANCELLED' | null>(null);
  const { run, pending } = useAction(updateBookingStatusAction, { onSuccess: () => setDialog(null) });

  if (status !== 'CONFIRMED' && status !== 'PENDING') return null;

  return (
    <>
      {status === 'CONFIRMED' && eventPassed && (
        <Button size="sm" onClick={() => setDialog('COMPLETED')}>
          <CheckCircle2 aria-hidden /> Afronden
        </Button>
      )}
      <Button size="sm" variant="danger-outline" onClick={() => setDialog('CANCELLED')}>
        <XCircle aria-hidden /> Annuleren
      </Button>

      <ConfirmDialog
        open={dialog === 'COMPLETED'}
        onOpenChange={(open) => !open && setDialog(null)}
        title="Boeking afronden?"
        description={`Bevestig dat het event van ${customerName} heeft plaatsgevonden. De klant kan daarna een beoordeling schrijven.`}
        confirmLabel="Afronden"
        pending={pending}
        onConfirm={() => run({ bookingId, status: 'COMPLETED' })}
      />
      <ConfirmDialog
        open={dialog === 'CANCELLED'}
        onOpenChange={(open) => !open && setDialog(null)}
        title="Boeking annuleren?"
        description={`De afspraak met ${customerName} vervalt en de datum komt weer vrij in je agenda. Breng de klant zelf op de hoogte; annuleren kan gevolgen hebben volgens jullie afspraken.`}
        confirmLabel="Boeking annuleren"
        cancelLabel="Terug"
        tone="danger"
        pending={pending}
        onConfirm={() => run({ bookingId, status: 'CANCELLED' })}
      />
    </>
  );
}

export { BookingActions };
