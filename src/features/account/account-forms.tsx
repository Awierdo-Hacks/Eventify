'use client';

import * as React from 'react';
import { Download, Trash2 } from 'lucide-react';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Field, fieldProps } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { useAction } from '@/hooks/use-action';
import { changePasswordAction, deleteAccountAction, updateAccountAction } from '@/features/account/actions';
import { PasswordInput } from '@/features/auth/components/password-input';
import { CookieSettingsButton } from '@/features/consent/consent-provider';

export function DetailsForm({ name, phone, email }: { name: string; phone: string; email: string }) {
  const { run, pending, fieldErrors } = useAction(updateAccountAction);
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        run({ name: String(form.get('name') ?? ''), phone: String(form.get('phone') ?? '') });
      }}
      className="space-y-5"
      noValidate
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Naam" htmlFor="name" error={fieldErrors.name}>
          <Input {...fieldProps('name', fieldErrors.name)} defaultValue={name} autoComplete="name" required />
        </Field>
        <Field label="Telefoonnummer" htmlFor="phone" optional error={fieldErrors.phone}>
          <Input {...fieldProps('phone', fieldErrors.phone)} type="tel" defaultValue={phone} autoComplete="tel" />
        </Field>
      </div>
      <Field label="E-mailadres" htmlFor="email" hint="Je logt in met dit adres. Wil je het wijzigen? Neem dan contact met ons op.">
        <Input id="email" value={email} readOnly disabled aria-describedby="email-hint" />
      </Field>
      <Button type="submit" loading={pending}>
        Opslaan
      </Button>
    </form>
  );
}

export function PasswordForm() {
  const formRef = React.useRef<HTMLFormElement>(null);
  const { run, pending, fieldErrors } = useAction(changePasswordAction, { onSuccess: () => formRef.current?.reset() });
  return (
    <form
      ref={formRef}
      onSubmit={(event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        run({ currentPassword: String(form.get('currentPassword') ?? ''), newPassword: String(form.get('newPassword') ?? '') });
      }}
      className="space-y-5"
      noValidate
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Huidig wachtwoord" htmlFor="currentPassword" error={fieldErrors.currentPassword}>
          <PasswordInput {...fieldProps('currentPassword', fieldErrors.currentPassword)} autoComplete="current-password" required />
        </Field>
        <Field label="Nieuw wachtwoord" htmlFor="newPassword" error={fieldErrors.newPassword} hint="Minstens 8 tekens.">
          <PasswordInput {...fieldProps('newPassword', fieldErrors.newPassword, true)} autoComplete="new-password" required />
        </Field>
      </div>
      <Button type="submit" variant="outline" loading={pending}>
        Wachtwoord wijzigen
      </Button>
    </form>
  );
}

export function DataControls() {
  return (
    <div className="flex flex-wrap gap-2">
      <Button asChild variant="outline">
        {/* Plain link: the browser downloads the file. */}
        <a href="/api/account/export" download>
          <Download aria-hidden /> Mijn gegevens downloaden
        </a>
      </Button>
      <CookieSettingsButton className="inline-flex h-10 items-center rounded-lg border border-ink-200 bg-surface px-4 text-sm font-semibold text-ink-900 shadow-xs hover:border-ink-300 hover:bg-ink-50" />
    </div>
  );
}

export function DeleteAccount({ isProvider }: { isProvider: boolean }) {
  const [open, setOpen] = React.useState(false);
  const [password, setPassword] = React.useState('');
  const { run, pending, error, fieldErrors } = useAction(deleteAccountAction, { toastError: false });

  return (
    <>
      <Button variant="danger-outline" onClick={() => setOpen(true)}>
        <Trash2 aria-hidden /> Account verwijderen
      </Button>
      <Dialog open={open} onOpenChange={(next) => !pending && setOpen(next)}>
        <DialogContent size="sm">
          <DialogHeader>
            <DialogTitle>Account definitief verwijderen?</DialogTitle>
            <DialogDescription>Dit kan niet ongedaan gemaakt worden.</DialogDescription>
          </DialogHeader>
          <DialogBody className="space-y-4">
            <ul className="list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-ink-700">
              <li>Je naam, e-mailadres, telefoonnummer en je berichten worden gewist.</li>
              {isProvider ? <li>Je profiel, foto’s, diensten en agenda verdwijnen van Eventiphy.</li> : <li>Je events en openstaande aanvragen worden verwijderd.</li>}
              <li>Afgeronde boekingen en beoordelingen blijven anoniem bewaard voor de andere partij.</li>
            </ul>
            <Field label="Bevestig met je wachtwoord" htmlFor="delete-password" error={fieldErrors.password}>
              <PasswordInput
                id="delete-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
                aria-invalid={fieldErrors.password ? true : undefined}
              />
            </Field>
            {error && !fieldErrors.password && <Alert tone="danger">{error}</Alert>}
          </DialogBody>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={pending}>
              Annuleren
            </Button>
            <Button variant="danger" loading={pending} disabled={!password} onClick={() => run({ password })}>
              Definitief verwijderen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
