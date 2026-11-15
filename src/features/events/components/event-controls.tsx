'use client';

import * as React from 'react';
import { MoreHorizontal, Pencil, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Field, fieldProps } from '@/components/ui/field';
import { Input, Select } from '@/components/ui/input';
import { useAction } from '@/hooks/use-action';
import { CATEGORIES } from '@/lib/catalog';
import { addSlotAction, cancelEventAction, removeSlotAction, updateEventAction } from '@/features/events/actions';

interface EventValues {
  id: string;
  name: string;
  eventDate: string;
  location: string;
  guestCount: string;
  budgetMin: string;
  budgetMax: string;
}

/** Edit and cancel, behind one menu in the page header. */
export function EventMenu({ event }: { event: EventValues }) {
  const [dialog, setDialog] = React.useState<'edit' | 'cancel' | null>(null);
  const close = () => setDialog(null);
  const update = useAction(updateEventAction, { onSuccess: close, toastError: false });
  const cancel = useAction(cancelEventAction);

  const onSubmit = (submitEvent: React.FormEvent<HTMLFormElement>) => {
    submitEvent.preventDefault();
    const form = new FormData(submitEvent.currentTarget);
    update.run({
      eventId: event.id,
      name: String(form.get('name') ?? ''),
      eventDate: String(form.get('eventDate') ?? ''),
      location: String(form.get('location') ?? ''),
      guestCount: String(form.get('guestCount') ?? '') as '',
      budgetMin: String(form.get('budgetMin') ?? '') as '',
      budgetMax: String(form.get('budgetMax') ?? '') as '',
    });
  };
  const errors = update.fieldErrors;

  return (
    <>
      <Button variant="outline" onClick={() => setDialog('edit')}>
        <Pencil aria-hidden /> Bewerken
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon" aria-label="Meer acties">
            <MoreHorizontal aria-hidden />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem tone="danger" onSelect={() => setDialog('cancel')}>
            <Trash2 aria-hidden /> Event annuleren
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={dialog === 'edit'} onOpenChange={(open) => !open && close()}>
        <DialogContent>
          <form onSubmit={onSubmit} className="flex min-h-0 flex-1 flex-col" noValidate>
            <DialogHeader>
              <DialogTitle>Event bewerken</DialogTitle>
              <DialogDescription>Pas de gegevens van je event aan.</DialogDescription>
            </DialogHeader>
            <DialogBody className="grid gap-4 sm:grid-cols-2">
              <Field label="Naam" htmlFor="name" error={errors.name} className="sm:col-span-2">
                <Input {...fieldProps('name', errors.name)} defaultValue={event.name} required />
              </Field>
              <Field label="Datum" htmlFor="eventDate" optional error={errors.eventDate}>
                <Input {...fieldProps('eventDate', errors.eventDate)} type="date" defaultValue={event.eventDate} />
              </Field>
              <Field label="Plaats" htmlFor="location" optional error={errors.location}>
                <Input {...fieldProps('location', errors.location)} defaultValue={event.location} />
              </Field>
              <Field label="Aantal gasten" htmlFor="guestCount" optional error={errors.guestCount} className="sm:col-span-2">
                <Input {...fieldProps('guestCount', errors.guestCount)} type="number" min={1} inputMode="numeric" defaultValue={event.guestCount} />
              </Field>
              <Field label="Budget van (€)" htmlFor="budgetMin" optional error={errors.budgetMin}>
                <Input {...fieldProps('budgetMin', errors.budgetMin)} type="number" min={0} inputMode="numeric" defaultValue={event.budgetMin} />
              </Field>
              <Field label="Budget tot (€)" htmlFor="budgetMax" optional error={errors.budgetMax}>
                <Input {...fieldProps('budgetMax', errors.budgetMax)} type="number" min={0} inputMode="numeric" defaultValue={event.budgetMax} />
              </Field>
            </DialogBody>
            <DialogFooter>
              <Button variant="outline" onClick={close} disabled={update.pending}>
                Annuleren
              </Button>
              <Button type="submit" loading={update.pending}>
                Opslaan
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={dialog === 'cancel'}
        onOpenChange={(open) => !open && close()}
        title="Dit event annuleren?"
        description={
          <>
            <strong>{event.name}</strong> verdwijnt uit je overzicht. Offertes en boekingen blijven bestaan, maar zijn
            niet meer aan dit event gekoppeld. Afspraken met dienstverleners annuleer je met hen zelf.
          </>
        }
        confirmLabel="Event annuleren"
        cancelLabel="Terug"
        tone="danger"
        pending={cancel.pending}
        onConfirm={() => cancel.run({ eventId: event.id })}
      />
    </>
  );
}

export function AddSlotButton({ eventId }: { eventId: string }) {
  const [open, setOpen] = React.useState(false);
  const [category, setCategory] = React.useState('');
  const [customName, setCustomName] = React.useState('');
  const add = useAction(addSlotAction, {
    onSuccess: () => {
      setOpen(false);
      setCategory('');
      setCustomName('');
    },
  });

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <Plus aria-hidden /> Onderdeel toevoegen
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent size="sm">
          <DialogHeader>
            <DialogTitle>Onderdeel toevoegen</DialogTitle>
            <DialogDescription>Waar zoek je nog een dienstverlener voor?</DialogDescription>
          </DialogHeader>
          <DialogBody className="space-y-4">
            <Field label="Categorie" htmlFor="slot-category">
              <Select id="slot-category" value={category} onChange={(event) => setCategory(event.target.value)}>
                <option value="" disabled>
                  Kies een categorie
                </option>
                {CATEGORIES.filter((item) => item.key).map((item) => (
                  <option key={item.key} value={item.key!}>
                    {item.label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Eigen naam" htmlFor="slot-name" optional hint="bv. “Fotograaf voor de ceremonie”">
              <Input id="slot-name" value={customName} onChange={(event) => setCustomName(event.target.value)} maxLength={80} />
            </Field>
          </DialogBody>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={add.pending}>
              Annuleren
            </Button>
            <Button
              disabled={!category}
              loading={add.pending}
              onClick={() => add.run({ eventId, category: category as never, customName, isRequired: false })}
            >
              Toevoegen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function RemoveSlotButton({ eventId, slotId, label }: { eventId: string; slotId: string; label: string }) {
  const [open, setOpen] = React.useState(false);
  const remove = useAction(removeSlotAction, { onSuccess: () => setOpen(false) });
  return (
    <>
      <Button variant="ghost" size="icon-sm" onClick={() => setOpen(true)} aria-label={`${label} verwijderen`}>
        <Trash2 aria-hidden />
      </Button>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title={`${label} verwijderen?`}
        description="Het onderdeel verdwijnt uit dit event. Offertes die eraan gekoppeld zijn blijven bestaan."
        confirmLabel="Verwijderen"
        tone="danger"
        pending={remove.pending}
        onConfirm={() => remove.run({ eventId, slotId })}
      />
    </>
  );
}
