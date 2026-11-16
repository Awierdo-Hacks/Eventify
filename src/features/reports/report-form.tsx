'use client';

import * as React from 'react';
import { CheckCircle2 } from 'lucide-react';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Field, fieldProps } from '@/components/ui/field';
import { Checkbox, Input, Select, Textarea } from '@/components/ui/input';
import { useAction } from '@/hooks/use-action';
import { submitReportAction } from '@/features/reports/actions';
import { REPORT_REASONS, REPORT_TARGETS } from '@/features/reports/config';

interface ReportFormProps {
  defaultType?: string;
  defaultTargetId?: string;
  signedInEmail?: string;
}

function ReportForm({ defaultType, defaultTargetId, signedInEmail }: ReportFormProps) {
  const [done, setDone] = React.useState(false);
  const { run, pending, error, fieldErrors } = useAction(submitReportAction, {
    onSuccess: () => setDone(true),
    toastError: false,
  });

  if (done) {
    return (
      <div className="flex flex-col items-center py-6 text-center" role="status">
        <span className="flex size-14 items-center justify-center rounded-full bg-success-100 text-success-700">
          <CheckCircle2 className="size-7" aria-hidden />
        </span>
        <h2 className="mt-4 text-xl font-bold text-ink-950">Bedankt voor je melding</h2>
        <p className="mt-2 max-w-md text-ink-600">
          We bekijken ze zo snel mogelijk en laten je per e-mail weten wat we beslissen en waarom.
        </p>
      </div>
    );
  }

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    run({
      targetType: String(form.get('targetType') ?? ''),
      targetId: String(form.get('targetId') ?? ''),
      reason: String(form.get('reason') ?? ''),
      details: String(form.get('details') ?? ''),
      email: String(form.get('email') ?? signedInEmail ?? ''),
      goodFaith: (form.get('goodFaith') === 'on') as true,
    });
  };

  return (
    <form onSubmit={onSubmit} className="space-y-5" noValidate>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Wat wil je melden?" htmlFor="targetType" error={fieldErrors.targetType}>
          <Select
            {...fieldProps('targetType', fieldErrors.targetType)}
            defaultValue={defaultType && defaultType in REPORT_TARGETS ? defaultType : ''}
          >
            <option value="" disabled>
              Maak een keuze
            </option>
            {Object.entries(REPORT_TARGETS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Reden" htmlFor="reason" error={fieldErrors.reason}>
          <Select {...fieldProps('reason', fieldErrors.reason)} defaultValue="">
            <option value="" disabled>
              Maak een keuze
            </option>
            {Object.entries(REPORT_REASONS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </Field>
      </div>
      {defaultTargetId ? (
        <input type="hidden" name="targetId" value={defaultTargetId} />
      ) : (
        <Field
          label="Waar staat het?"
          htmlFor="targetId"
          optional
          hint="De link naar de pagina, of de naam van het profiel."
        >
          <Input {...fieldProps('targetId', undefined, true)} maxLength={200} />
        </Field>
      )}
      <Field
        label="Toelichting"
        htmlFor="details"
        error={fieldErrors.details}
        hint="Beschrijf zo precies mogelijk wat er mis is en waarom je denkt dat het onwettig is of tegen onze voorwaarden ingaat."
      >
        <Textarea {...fieldProps('details', fieldErrors.details, true)} rows={6} maxLength={3000} />
      </Field>
      {!signedInEmail && (
        <Field
          label="Je e-mailadres"
          htmlFor="email"
          error={fieldErrors.email}
          hint="We gebruiken het alleen om je over deze melding te informeren."
        >
          <Input
            {...fieldProps('email', fieldErrors.email, true)}
            type="email"
            autoComplete="email"
          />
        </Field>
      )}
      <div>
        <div className="flex items-start gap-3">
          <Checkbox
            id="goodFaith"
            name="goodFaith"
            className="mt-0.5"
            aria-invalid={fieldErrors.goodFaith ? true : undefined}
          />
          <label htmlFor="goodFaith" className="text-sm leading-relaxed text-ink-700">
            Ik verklaar te goeder trouw dat de informatie in deze melding juist en volledig is.
          </label>
        </div>
        {fieldErrors.goodFaith && (
          <p role="alert" className="mt-1.5 pl-8 text-sm font-medium text-danger-700">
            {fieldErrors.goodFaith}
          </p>
        )}
      </div>
      {error && !Object.keys(fieldErrors).length && <Alert tone="danger">{error}</Alert>}
      <Button type="submit" size="lg" loading={pending}>
        Melding versturen
      </Button>
    </form>
  );
}

export { ReportForm };
