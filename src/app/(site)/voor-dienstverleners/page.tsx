import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, CalendarSync, FileText, Inbox, MessageSquare, Star, UserRoundCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = {
  title: 'Voor dienstverleners',
  description:
    'Ontvang gerichte aanvragen voor evenementen in jouw regio. Maak gratis een profiel aan, stuur offertes en beheer je agenda op Eventiphy.',
  alternates: { canonical: '/voor-dienstverleners' },
};

const FEATURES = [
  { icon: Inbox, title: 'Gerichte aanvragen', text: 'Klanten vertellen meteen wat, waar en wanneer. Geen vage mailtjes meer.' },
  { icon: FileText, title: 'Offertes in een paar klikken', text: 'Stuur een duidelijke offerte vanuit je dashboard of rechtstreeks in de chat.' },
  { icon: CalendarSync, title: 'Agenda altijd actueel', text: 'Koppel Google Calendar of iCal en blokkeer dagen waarop je niet kunt.' },
  { icon: MessageSquare, title: 'Eén inbox', text: 'Alle gesprekken met klanten bij elkaar, inclusief foto’s en documenten.' },
  { icon: Star, title: 'Bouw aan je reputatie', text: 'Beoordelingen van echte klanten maken je profiel sterker.' },
  { icon: UserRoundCheck, title: 'Geverifieerd profiel', text: 'Na onze controle krijg je het geverifieerd-label dat klanten vertrouwen geeft.' },
];

const STEPS = [
  { title: 'Maak je account aan', text: 'Vul je bedrijfsgegevens in. Dat duurt een paar minuten.' },
  { title: 'Vul je profiel aan', text: 'Voeg foto’s, diensten en richtprijzen toe en stel je agenda in.' },
  { title: 'Wij kijken het na', text: 'Na een korte controle wordt je profiel zichtbaar voor klanten.' },
  { title: 'Ontvang aanvragen', text: 'Reageer met een offerte en leg de afspraak vast.' },
];

export default function ForProvidersPage() {
  return (
    <>
      <section className="bg-hero-wash">
        <div className="container-page py-14 sm:py-20">
          <p className="text-sm font-bold uppercase tracking-wider text-brand-700">Voor dienstverleners</p>
          <h1 className="mt-2 max-w-3xl text-4xl font-extrabold text-ink-950 sm:text-6xl">
            Laat klanten{' '}
            <span className="text-brand-gradient pr-1 font-serif font-normal italic tracking-normal">jou</span> vinden
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-ink-600 sm:text-xl">
            Eventiphy brengt je in contact met mensen die een event plannen in jouw regio. Jij bepaalt je aanbod, je
            prijzen en je beschikbaarheid.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg" variant="gradient">
              <Link href="/register?type=provider">
                Gratis profiel aanmaken <ArrowRight aria-hidden />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/voorwaarden/dienstverleners">Bekijk de voorwaarden</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="container-page py-14 sm:py-20" aria-labelledby="features-title">
        <h2 id="features-title" className="text-3xl font-extrabold text-ink-950 sm:text-4xl">
          Alles om je boekingen te beheren
        </h2>
        <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature) => (
            <li key={feature.title} className="rounded-2xl border border-ink-200 bg-surface p-6 shadow-xs">
              <span className="flex size-11 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                <feature.icon className="size-5" aria-hidden />
              </span>
              <h3 className="mt-4 text-lg font-bold text-ink-950">{feature.title}</h3>
              <p className="mt-1 leading-relaxed text-ink-600">{feature.text}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="border-y border-ink-200/70 bg-surface" aria-labelledby="steps-title">
        <div className="container-page py-14 sm:py-20">
          <h2 id="steps-title" className="text-3xl font-extrabold text-ink-950 sm:text-4xl">
            Zo ga je van start
          </h2>
          <ol className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((step, index) => (
              <li key={step.title}>
                <span className="font-serif text-5xl italic text-brand-300" aria-hidden>
                  {index + 1}
                </span>
                <h3 className="mt-2 text-lg font-bold text-ink-950">{step.title}</h3>
                <p className="mt-1 leading-relaxed text-ink-600">{step.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="container-page pt-14 sm:pt-20" aria-labelledby="fair-title">
        <div className="rounded-3xl bg-ink-950 px-6 py-12 text-white sm:px-12">
          <h2 id="fair-title" className="text-3xl font-extrabold">
            Eerlijke spelregels
          </h2>
          <ul className="mt-6 grid gap-4 text-ink-200 md:grid-cols-3">
            <li className="rounded-xl border border-white/10 bg-white/5 p-5">
              <p className="font-bold text-white">Geen betaalde posities</p>
              <p className="mt-1 text-sm leading-relaxed">
                De volgorde in de zoekresultaten hangt af van beoordelingen, niet van wie het meest betaalt.
              </p>
            </li>
            <li className="rounded-xl border border-white/10 bg-white/5 p-5">
              <p className="font-bold text-white">Altijd een reden</p>
              <p className="mt-1 text-sm leading-relaxed">
                Als we een profiel beperken of verwijderen, leggen we uit waarom en kun je bezwaar maken.
              </p>
            </li>
            <li className="rounded-xl border border-white/10 bg-white/5 p-5">
              <p className="font-bold text-white">Wijzigingen op voorhand</p>
              <p className="mt-1 text-sm leading-relaxed">
                Veranderen de voorwaarden, dan hoor je dat minstens 15 dagen vooraf.
              </p>
            </li>
          </ul>
          <Button asChild size="lg" variant="gradient" className="mt-8">
            <Link href="/register?type=provider">Word dienstverlener</Link>
          </Button>
        </div>
      </section>
    </>
  );
}
