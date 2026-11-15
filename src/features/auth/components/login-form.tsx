'use client';

import * as React from 'react';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Field, fieldProps } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { useAction } from '@/hooks/use-action';
import { loginAction } from '@/features/auth/actions';
import { PasswordInput } from '@/features/auth/components/password-input';

function LoginForm({ redirectTo }: { redirectTo?: string }) {
  const { run, pending, error, fieldErrors } = useAction(loginAction, { toastError: false });

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    run({
      email: String(form.get('email') ?? ''),
      password: String(form.get('password') ?? ''),
      redirect: redirectTo,
    });
  };

  return (
    <form onSubmit={onSubmit} className="space-y-5" noValidate>
      {error && !Object.keys(fieldErrors).length && <Alert tone="danger">{error}</Alert>}
      <Field label="E-mailadres" htmlFor="email" error={fieldErrors.email}>
        <Input {...fieldProps('email', fieldErrors.email)} type="email" autoComplete="email" autoFocus required />
      </Field>
      <Field label="Wachtwoord" htmlFor="password" error={fieldErrors.password}>
        <PasswordInput {...fieldProps('password', fieldErrors.password)} autoComplete="current-password" required />
      </Field>
      <Button type="submit" size="lg" className="w-full" loading={pending}>
        Inloggen
      </Button>
    </form>
  );
}

export { LoginForm };
