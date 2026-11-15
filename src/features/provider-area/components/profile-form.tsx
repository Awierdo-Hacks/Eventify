'use client';

import * as React from 'react';
import Image from 'next/image';
import { ImagePlus, Loader2, Plus, Star, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Field, fieldProps } from '@/components/ui/field';
import { Input, Select, Textarea } from '@/components/ui/input';
import { useAction } from '@/hooks/use-action';
import { CATEGORIES, PRICE_RANGES, PRICE_RANGE_LABELS } from '@/lib/catalog';
import { updateProfileAction, type ProfileInput } from '@/features/provider-area/profile-actions';
import { uploadFileAction } from '@/features/uploads/actions';

interface ServiceDraft {
  name: string;
  description: string;
  priceFrom: string;
  priceTo: string;
}

export interface ProfileValues {
  businessName: string;
  category: string;
  location: string;
  priceRange: string;
  description: string;
  phone: string;
  website: string;
  availability: string;
  responseTime: string;
  minGuests: string;
  maxGuests: string;
  tags: string[];
  images: string[];
  services: ServiceDraft[];
}

const MAX_IMAGES = 12;

function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-ink-200 bg-surface p-5 shadow-xs sm:p-6">
      <h2 className="text-lg font-bold text-ink-950">{title}</h2>
      {description && <p className="mt-1 text-sm text-ink-600">{description}</p>}
      <div className="mt-5">{children}</div>
    </section>
  );
}

function ProfileForm({ initial }: { initial: ProfileValues }) {
  const [values, setValues] = React.useState(initial);
  const [tagInput, setTagInput] = React.useState('');
  const [uploading, setUploading] = React.useState(false);
  const fileInput = React.useRef<HTMLInputElement>(null);
  const { run, pending, error, fieldErrors } = useAction(updateProfileAction, { toastError: false });

  const set = <K extends keyof ProfileValues>(key: K, value: ProfileValues[K]) => setValues((current) => ({ ...current, [key]: value }));
  const bind = (key: 'businessName' | 'location' | 'description' | 'phone' | 'website' | 'availability' | 'responseTime' | 'minGuests' | 'maxGuests') => ({
    ...fieldProps(key, fieldErrors[key]),
    value: values[key],
    onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => set(key, event.target.value),
  });

  const onFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    const room = MAX_IMAGES - values.images.length;
    const picked = [...files].slice(0, room);
    if (files.length > room) toast.error(`Je kunt maximaal ${MAX_IMAGES} foto’s toevoegen.`);
    setUploading(true);
    for (const file of picked) {
      const formData = new FormData();
      formData.set('file', file);
      formData.set('folder', 'providers');
      const result = await uploadFileAction(formData).catch(() => null);
      if (result?.ok) setValues((current) => ({ ...current, images: [...current.images, result.data.url] }));
      else toast.error(result?.error ?? `Uploaden van ${file.name} is mislukt.`);
    }
    setUploading(false);
    if (fileInput.current) fileInput.current.value = '';
  };

  const addTag = () => {
    const tag = tagInput.trim().replace(/,$/, '');
    if (tag && !values.tags.includes(tag) && values.tags.length < 20) set('tags', [...values.tags, tag]);
    setTagInput('');
  };

  const setService = (index: number, patch: Partial<ServiceDraft>) =>
    set('services', values.services.map((service, serviceIndex) => (serviceIndex === index ? { ...service, ...patch } : service)));

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    run({
      ...values,
      priceRange: values.priceRange as ProfileInput['priceRange'],
      minGuests: values.minGuests as '',
      maxGuests: values.maxGuests as '',
      services: values.services
        .filter((service) => service.name.trim() || service.priceFrom)
        .map((service) => ({ ...service, priceTo: service.priceTo as '' })),
    });
  };

  const errorCount = Object.keys(fieldErrors).length;

  return (
    <form onSubmit={onSubmit} className="space-y-6" noValidate>
      <Section title="Foto’s" description="De eerste foto is je omslagfoto in de zoekresultaten. JPG, PNG of WebP, maximaal 5 MB per foto.">
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {values.images.map((image, index) => (
            <li key={image} className="group relative aspect-[4/3] overflow-hidden rounded-lg bg-ink-100">
              <Image src={image} alt={`Foto ${index + 1}`} fill sizes="(min-width: 1024px) 16rem, 50vw" className="object-cover" />
              {index === 0 && (
                <span className="absolute left-2 top-2 rounded-full bg-ink-950/80 px-2 py-0.5 text-[0.6875rem] font-semibold text-white">Omslag</span>
              )}
              <div className="absolute inset-x-0 bottom-0 flex justify-end gap-1 bg-gradient-to-t from-ink-950/70 to-transparent p-2">
                {index > 0 && (
                  <button
                    type="button"
                    onClick={() => set('images', [image, ...values.images.filter((item) => item !== image)])}
                    className="flex size-8 items-center justify-center rounded-md bg-surface/95 text-ink-800 hover:bg-surface"
                    aria-label={`Foto ${index + 1} als omslagfoto instellen`}
                    title="Maak omslagfoto"
                  >
                    <Star className="size-4" aria-hidden />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => set('images', values.images.filter((item) => item !== image))}
                  className="flex size-8 items-center justify-center rounded-md bg-surface/95 text-danger-700 hover:bg-surface"
                  aria-label={`Foto ${index + 1} verwijderen`}
                >
                  <Trash2 className="size-4" aria-hidden />
                </button>
              </div>
            </li>
          ))}
          {values.images.length < MAX_IMAGES && (
            <li>
              <button
                type="button"
                onClick={() => fileInput.current?.click()}
                disabled={uploading}
                className="flex aspect-[4/3] w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-ink-300 text-sm font-semibold text-ink-600 transition-colors hover:border-brand-500 hover:bg-brand-50 hover:text-brand-800 disabled:opacity-60"
              >
                {uploading ? <Loader2 className="size-6 animate-spin" aria-hidden /> : <ImagePlus className="size-6" aria-hidden />}
                {uploading ? 'Uploaden…' : 'Foto’s toevoegen'}
              </button>
            </li>
          )}
        </ul>
        <input
          ref={fileInput}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          multiple
          className="sr-only"
          tabIndex={-1}
          onChange={(event) => void onFiles(event.target.files)}
          aria-label="Foto’s kiezen"
        />
        {fieldErrors.images && <p role="alert" className="mt-2 text-sm font-medium text-danger-700">{fieldErrors.images}</p>}
      </Section>

      <Section title="Over je bedrijf">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Bedrijfsnaam" htmlFor="businessName" error={fieldErrors.businessName}>
            <Input {...bind('businessName')} required />
          </Field>
          <Field label="Stad of regio" htmlFor="location" error={fieldErrors.location}>
            <Input {...bind('location')} required />
          </Field>
          <Field label="Categorie" htmlFor="category" error={fieldErrors.category}>
            <Select {...fieldProps('category', fieldErrors.category)} value={values.category} onChange={(event) => set('category', event.target.value)}>
              {CATEGORIES.map((category) => (
                <option key={category.slug} value={category.slug}>
                  {category.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Prijsklasse" htmlFor="priceRange" error={fieldErrors.priceRange}>
            <Select {...fieldProps('priceRange', fieldErrors.priceRange)} value={values.priceRange} onChange={(event) => set('priceRange', event.target.value)}>
              {PRICE_RANGES.map((range) => (
                <option key={range} value={range}>
                  {PRICE_RANGE_LABELS[range].symbol} · {PRICE_RANGE_LABELS[range].label}
                </option>
              ))}
            </Select>
          </Field>
          <Field
            label="Beschrijving"
            htmlFor="description"
            error={fieldErrors.description}
            hint={`${values.description.trim().length} tekens (minstens 50)`}
            className="sm:col-span-2"
          >
            <Textarea {...bind('description')} aria-describedby="description-hint" rows={6} maxLength={2000} required />
          </Field>
        </div>
      </Section>

      <Section title="Diensten en richtprijzen" description="Geef klanten een idee van wat je aanbiedt en wat het ongeveer kost.">
        <ul className="space-y-4">
          {values.services.map((service, index) => (
            <li key={index} className="rounded-lg border border-ink-200 p-4">
              <div className="grid gap-4 sm:grid-cols-[1fr_8rem_8rem_auto] sm:items-end">
                <Field label="Naam" htmlFor={`service-name-${index}`} error={fieldErrors[`services.${index}.name`]}>
                  <Input id={`service-name-${index}`} value={service.name} onChange={(event) => setService(index, { name: event.target.value })} maxLength={120} placeholder="bv. Walking dinner" />
                </Field>
                <Field label="Vanaf (€)" htmlFor={`service-from-${index}`} error={fieldErrors[`services.${index}.priceFrom`]}>
                  <Input id={`service-from-${index}`} type="number" min={0} inputMode="decimal" value={service.priceFrom} onChange={(event) => setService(index, { priceFrom: event.target.value })} />
                </Field>
                <Field label="Tot (€)" htmlFor={`service-to-${index}`} error={fieldErrors[`services.${index}.priceTo`]}>
                  <Input id={`service-to-${index}`} type="number" min={0} inputMode="decimal" value={service.priceTo} onChange={(event) => setService(index, { priceTo: event.target.value })} placeholder="Optioneel" />
                </Field>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-11"
                  onClick={() => set('services', values.services.filter((_, serviceIndex) => serviceIndex !== index))}
                  aria-label={`Dienst ${index + 1} verwijderen`}
                >
                  <Trash2 aria-hidden />
                </Button>
              </div>
              <Input
                className="mt-3"
                value={service.description}
                onChange={(event) => setService(index, { description: event.target.value })}
                maxLength={500}
                placeholder="Korte omschrijving (optioneel)"
                aria-label={`Omschrijving van dienst ${index + 1}`}
              />
            </li>
          ))}
        </ul>
        {values.services.length < 30 && (
          <Button variant="outline" size="sm" className="mt-4" onClick={() => set('services', [...values.services, { name: '', description: '', priceFrom: '', priceTo: '' }])}>
            <Plus aria-hidden /> Dienst toevoegen
          </Button>
        )}
      </Section>

      <Section title="Praktische informatie">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Telefoonnummer" htmlFor="phone" optional error={fieldErrors.phone}>
            <Input {...bind('phone')} type="tel" />
          </Field>
          <Field label="Website" htmlFor="website" optional error={fieldErrors.website}>
            <Input {...bind('website')} placeholder="www.jouwbedrijf.be" />
          </Field>
          <Field label="Beschikbaarheid" htmlFor="availability" optional error={fieldErrors.availability}>
            <Input {...bind('availability')} placeholder="bv. Weekends en feestdagen" />
          </Field>
          <Field label="Reactietijd" htmlFor="responseTime" optional error={fieldErrors.responseTime}>
            <Input {...bind('responseTime')} placeholder="bv. Binnen 24 uur" />
          </Field>
          <Field label="Minimum aantal gasten" htmlFor="minGuests" optional error={fieldErrors.minGuests}>
            <Input {...bind('minGuests')} type="number" min={0} inputMode="numeric" />
          </Field>
          <Field label="Maximum aantal gasten" htmlFor="maxGuests" optional error={fieldErrors.maxGuests}>
            <Input {...bind('maxGuests')} type="number" min={0} inputMode="numeric" />
          </Field>
          <div className="sm:col-span-2">
            <label htmlFor="tag-input" className="block text-sm font-semibold text-ink-900">
              Trefwoorden
            </label>
            <p className="mt-0.5 text-sm text-ink-500">Korte labels die je aanbod typeren, bv. “Buffet” of “Vegetarisch”.</p>
            {values.tags.length > 0 && (
              <ul className="mt-3 flex flex-wrap gap-2">
                {values.tags.map((tag) => (
                  <li key={tag} className="inline-flex items-center gap-1 rounded-full bg-ink-100 py-1 pl-3 pr-1.5 text-sm font-medium text-ink-800">
                    {tag}
                    <button
                      type="button"
                      onClick={() => set('tags', values.tags.filter((item) => item !== tag))}
                      className="flex size-5 items-center justify-center rounded-full hover:bg-ink-200"
                      aria-label={`${tag} verwijderen`}
                    >
                      <X className="size-3.5" aria-hidden />
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-3 flex gap-2 sm:max-w-sm">
              <Input
                id="tag-input"
                value={tagInput}
                onChange={(event) => setTagInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ',') {
                    event.preventDefault();
                    addTag();
                  }
                }}
                maxLength={40}
                placeholder="Typ en druk op Enter"
              />
              <Button variant="outline" className="h-11" onClick={addTag} disabled={!tagInput.trim()}>
                Toevoegen
              </Button>
            </div>
          </div>
        </div>
      </Section>

      {(error || errorCount > 0) && (
        <Alert tone="danger">{errorCount > 0 ? 'Niet alles is correct ingevuld. Kijk de gemarkeerde velden na.' : error}</Alert>
      )}

      <div className="sticky bottom-16 z-10 flex justify-end rounded-xl border border-ink-200 bg-surface/95 p-3 shadow-md backdrop-blur lg:bottom-4">
        <Button type="submit" size="lg" loading={pending} disabled={uploading}>
          Profiel opslaan
        </Button>
      </div>
    </form>
  );
}

export { ProfileForm };
