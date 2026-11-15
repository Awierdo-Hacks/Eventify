'use client';

import * as React from 'react';
import Link from 'next/link';
import { Cookie } from 'lucide-react';
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
import { saveConsentAction } from '@/features/consent/actions';
import { CONSENT_CATEGORIES, type ConsentChoice, type ConsentState } from '@/features/consent/config';

interface ConsentContextValue {
  /** null until the visitor has made a choice. */
  consent: ConsentState | null;
  openSettings: () => void;
}

const ConsentContext = React.createContext<ConsentContextValue>({ consent: null, openSettings: () => {} });

export const useConsent = () => React.useContext(ConsentContext);

/**
 * Holds the visitor's cookie choice and renders the banner and the settings
 * dialog. The initial value comes from the server, so the banner never
 * flashes for people who already chose.
 */
export function ConsentProvider({ initial, children }: { initial: ConsentState | null; children: React.ReactNode }) {
  const [consent, setConsent] = React.useState<ConsentState | null>(initial);
  const [settingsOpen, setSettingsOpen] = React.useState(false);
  const [draft, setDraft] = React.useState<ConsentChoice>({
    analytics: initial?.analytics ?? false,
    marketing: initial?.marketing ?? false,
  });
  const [pending, startTransition] = React.useTransition();

  const save = (choice: ConsentChoice) => {
    startTransition(async () => {
      const saved = await saveConsentAction(choice);
      if (saved) {
        setConsent(saved);
        setDraft({ analytics: saved.analytics, marketing: saved.marketing });
      }
      setSettingsOpen(false);
    });
  };

  const openSettings = React.useCallback(() => setSettingsOpen(true), []);
  const value = React.useMemo(() => ({ consent, openSettings }), [consent, openSettings]);

  return (
    <ConsentContext.Provider value={value}>
      {children}

      {!consent && !settingsOpen && (
        <section
          aria-label="Cookiekeuze"
          className="fixed inset-x-0 bottom-0 z-40 p-3 sm:p-5"
        >
          <div className="mx-auto flex max-w-4xl animate-rise flex-col gap-4 rounded-2xl border border-ink-200 bg-surface p-5 shadow-lg sm:p-6 lg:flex-row lg:items-center lg:gap-8">
            <div className="flex gap-3.5">
              <span className="mt-0.5 hidden size-10 shrink-0 items-center justify-center rounded-full bg-sun-100 text-sun-700 sm:flex">
                <Cookie className="size-5" aria-hidden />
              </span>
              <div className="space-y-1">
                <h2 className="text-base font-bold text-ink-950">Jij kiest welke cookies we gebruiken</h2>
                <p className="text-sm leading-relaxed text-ink-600">
                  Noodzakelijke cookies laten de website werken. Met jouw toestemming gebruiken we ook cookies voor
                  statistieken en marketing. Je kunt je keuze altijd aanpassen. Meer lees je in ons{' '}
                  <Link href="/cookies" className="font-semibold text-brand-700 underline underline-offset-2">
                    cookiebeleid
                  </Link>
                  .
                </p>
              </div>
            </div>
            {/* Refuse and accept are equally prominent and both on the first layer. */}
            <div className="flex shrink-0 flex-col gap-2 sm:flex-row lg:flex-col xl:flex-row">
              <Button variant="outline" onClick={() => save({ analytics: false, marketing: false })} disabled={pending}>
                Alles weigeren
              </Button>
              <Button variant="outline" onClick={() => save({ analytics: true, marketing: true })} disabled={pending}>
                Alles accepteren
              </Button>
              <Button variant="ghost" onClick={openSettings} disabled={pending}>
                Zelf kiezen
              </Button>
            </div>
          </div>
        </section>
      )}

      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cookie-instellingen</DialogTitle>
            <DialogDescription>
              Kies per categorie wat je toestaat. Je keuze geldt zes maanden en kun je op elk moment wijzigen via
              “Cookie-instellingen” onderaan elke pagina.
            </DialogDescription>
          </DialogHeader>
          <DialogBody className="space-y-3">
            {CONSENT_CATEGORIES.map((category) => {
              const checked = category.locked ? true : draft[category.key as keyof ConsentChoice];
              const id = `consent-${category.key}`;
              return (
                <div key={category.key} className="flex items-start gap-4 rounded-xl border border-ink-200 p-4">
                  <div className="min-w-0 flex-1">
                    <label htmlFor={id} className="text-sm font-bold text-ink-950">
                      {category.title}
                    </label>
                    <p className="mt-1 text-sm leading-relaxed text-ink-600">{category.description}</p>
                  </div>
                  <button
                    id={id}
                    type="button"
                    role="switch"
                    aria-checked={checked}
                    disabled={category.locked}
                    onClick={() =>
                      !category.locked &&
                      setDraft((current) => ({
                        ...current,
                        [category.key]: !current[category.key as keyof ConsentChoice],
                      }))
                    }
                    className={`relative mt-0.5 h-6 w-11 shrink-0 rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
                      checked ? 'bg-brand-600' : 'bg-ink-300'
                    }`}
                  >
                    <span
                      className={`absolute left-0.5 top-0.5 size-5 rounded-full bg-white shadow-sm transition-transform ${
                        checked ? 'translate-x-5' : ''
                      }`}
                    />
                    <span className="sr-only">{category.locked ? 'Altijd actief' : checked ? 'Aan' : 'Uit'}</span>
                  </button>
                </div>
              );
            })}
          </DialogBody>
          <DialogFooter className="sm:justify-between">
            <div className="flex flex-col-reverse gap-2 sm:flex-row">
              <Button variant="outline" onClick={() => save({ analytics: false, marketing: false })} disabled={pending}>
                Alles weigeren
              </Button>
              <Button variant="outline" onClick={() => save({ analytics: true, marketing: true })} disabled={pending}>
                Alles accepteren
              </Button>
            </div>
            <Button onClick={() => save(draft)} loading={pending}>
              Keuze opslaan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ConsentContext.Provider>
  );
}

/** Footer link that reopens the cookie settings. */
export function CookieSettingsButton({ className }: { className?: string }) {
  const { openSettings } = useConsent();
  return (
    <button type="button" onClick={openSettings} className={className}>
      Cookie-instellingen
    </button>
  );
}
