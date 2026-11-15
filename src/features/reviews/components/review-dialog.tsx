'use client';

import * as React from 'react';
import { Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Field, fieldProps } from '@/components/ui/field';
import { Input, Textarea } from '@/components/ui/input';
import { useAction } from '@/hooks/use-action';
import { cn } from '@/lib/utils';
import { createReviewAction } from '@/features/reviews/actions';

const LABELS = ['', 'Slecht', 'Matig', 'Oké', 'Goed', 'Uitstekend'];

function ReviewButton({ bookingId, providerName }: { bookingId: string; providerName: string }) {
  const [open, setOpen] = React.useState(false);
  const [rating, setRating] = React.useState(0);
  const [hover, setHover] = React.useState(0);
  const { run, pending, fieldErrors } = useAction(createReviewAction, { onSuccess: () => setOpen(false) });

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    run({ bookingId, rating, title: String(form.get('title') ?? ''), comment: String(form.get('comment') ?? '') });
  };

  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)}>
        <Star aria-hidden /> Beoordeling schrijven
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <form onSubmit={onSubmit} className="flex min-h-0 flex-1 flex-col" noValidate>
            <DialogHeader>
              <DialogTitle>Hoe was {providerName}?</DialogTitle>
              <DialogDescription>
                Je beoordeling verschijnt met je voornaam op het profiel van de dienstverlener en helpt andere klanten
                kiezen.
              </DialogDescription>
            </DialogHeader>
            <DialogBody className="space-y-5">
              <fieldset>
                <legend className="text-sm font-semibold text-ink-900">Je score</legend>
                <div className="mt-2 flex items-center gap-1" onMouseLeave={() => setHover(0)}>
                  {[1, 2, 3, 4, 5].map((value) => (
                    <label key={value} className="cursor-pointer rounded-md p-1 has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-brand-600">
                      <input
                        type="radio"
                        name="rating"
                        value={value}
                        checked={rating === value}
                        onChange={() => setRating(value)}
                        className="sr-only"
                      />
                      <Star
                        className={cn('size-8 transition-colors', (hover || rating) >= value ? 'text-sun-400' : 'text-ink-200')}
                        fill="currentColor"
                        strokeWidth={0}
                        onMouseEnter={() => setHover(value)}
                        aria-hidden
                      />
                      <span className="sr-only">
                        {value} van 5: {LABELS[value]}
                      </span>
                    </label>
                  ))}
                  <span className="ml-2 text-sm font-semibold text-ink-700">{LABELS[hover || rating]}</span>
                </div>
                {fieldErrors.rating && (
                  <p role="alert" className="mt-1.5 text-sm font-medium text-danger-700">
                    {fieldErrors.rating}
                  </p>
                )}
              </fieldset>
              <Field label="Titel" htmlFor="title" error={fieldErrors.title}>
                <Input {...fieldProps('title', fieldErrors.title)} maxLength={120} placeholder="Vat je ervaring samen" />
              </Field>
              <Field label="Je ervaring" htmlFor="comment" error={fieldErrors.comment}>
                <Textarea {...fieldProps('comment', fieldErrors.comment)} rows={5} maxLength={2000} placeholder="Wat ging goed? Wat kon beter?" />
              </Field>
            </DialogBody>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)} disabled={pending}>
                Annuleren
              </Button>
              <Button type="submit" loading={pending}>
                Beoordeling plaatsen
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

export { ReviewButton };
