import type { Metadata } from 'next';
import { Bell, Gift, Rocket } from 'lucide-react';
import { WaitlistForm } from '@/features/waitlist/waitlist-form';

export const metadata: Metadata = {
  title: 'Wachtlijst',
  description:
    'Schrijf je in op de wachtlijst van Eventiphy en hoor als eerste wanneer er nieuwe functies en dienstverleners bijkomen.',
  alternates: { canonical: '/waitlist' },
};

const PERKS = [
  { icon: Bell, title: 'Als eerste op de hoogte', text: 'Je hoort het meteen wanneer we nieuwe regio’s en functies openen.' },
  { icon: Gift, title: 'Vroege toegang', text: 'Wachtlijstleden mogen nieuwe mogelijkheden eerder uitproberen.' },
  { icon: Rocket, title: 'Denk mee', text: 'Laat weten wat jij nodig hebt; we bouwen het platform samen.' },
];

export default function WaitlistPage() {
  return (
    <div className="bg-hero-wash">
      <div className="container-page grid gap-12 py-12 sm:py-16 lg:grid-cols-2 lg:gap-16">
        <div>
          <p className="text-sm font-bold uppercase tracking-wider text-brand-700">Wachtlijst</p>
          <h1 className="mt-2 text-4xl font-extrabold text-ink-950 sm:text-5xl">
            Hoor het als{' '}
            <span className="text-brand-gradient pr-1 font-serif font-normal italic tracking-normal">eerste</span>
          </h1>
          <p className="mt-4 max-w-lg text-lg leading-relaxed text-ink-600">
            Eventiphy groeit stap voor stap. Laat je gegevens achter en we houden je op de hoogte.
          </p>
          <ul className="mt-8 space-y-5">
            {PERKS.map((perk) => (
              <li key={perk.title} className="flex gap-4">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-surface text-brand-700 shadow-xs ring-1 ring-ink-200">
                  <perk.icon className="size-5" aria-hidden />
                </span>
                <div>
                  <p className="font-bold text-ink-950">{perk.title}</p>
                  <p className="text-ink-600">{perk.text}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-2xl border border-ink-200 bg-surface p-5 shadow-md sm:p-8">
          <WaitlistForm />
        </div>
      </div>
    </div>
  );
}
