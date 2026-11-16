'use client';

import * as React from 'react';
import { FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useAction } from '@/hooks/use-action';
import { createQuoteAction } from '@/features/quotes/actions';
import { emptyQuoteDraft, QuoteFormFields } from '@/features/quotes/components/quote-form-fields';

function CreateQuoteButton({
  requestId,
  customerName,
  resend,
}: {
  requestId: string;
  customerName: string;
  resend?: boolean;
}) {
  const [open, setOpen] = React.useState(false);
  const [draft, setDraft] = React.useState(emptyQuoteDraft);
  const { run, pending, fieldErrors } = useAction(createQuoteAction, {
    onSuccess: () => {
      setOpen(false);
      setDraft(emptyQuoteDraft());
    },
  });

  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)}>
        <FileText aria-hidden /> {resend ? 'Nieuwe offerte sturen' : 'Offerte maken'}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent size="lg">
          <DialogHeader>
            <DialogTitle>Offerte voor {customerName}</DialogTitle>
            <DialogDescription>
              De klant ziet je offerte meteen en kan ze accepteren of afwijzen. Een geaccepteerde
              offerte is een bindende afspraak.
            </DialogDescription>
          </DialogHeader>
          <DialogBody>
            <QuoteFormFields draft={draft} onChange={setDraft} errors={fieldErrors} />
          </DialogBody>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={pending}>
              Annuleren
            </Button>
            <Button loading={pending} onClick={() => run({ requestId, ...draft })}>
              Offerte versturen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export { CreateQuoteButton };
