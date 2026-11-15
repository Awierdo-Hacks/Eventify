import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Briefcase, Cookie, Flag, Lock, PartyPopper } from 'lucide-react';
import { COOKIE_POLICY, LEGAL_DOCUMENTS } from '@/features/legal/documents';

export const metadata: Metadata = {
  title: 'Voorwaarden',
  description: 'De voorwaarden, de privacyverklaring en het cookiebeleid van Eventiphy op één plek.',
  alternates: { canonical: '/voorwaarden' },
};

const DOCUMENTS = [
  {
    icon: PartyPopper,
    href: LEGAL_DOCUMENTS['terms-customer'].href,
    title: LEGAL_DOCUMENTS['terms-customer'].title,
    text: 'Voor wie een event plant en dienstverleners zoekt. Dit accepteer je wanneer je een klantaccount aanmaakt.',
    updated: LEGAL_DOCUMENTS['terms-customer'].updatedLabel,
  },
  {
    icon: Briefcase,
    href: LEGAL_DOCUMENTS['terms-provider'].href,
    title: LEGAL_DOCUMENTS['terms-provider'].title,
    text: 'Voor ondernemingen die hun diensten aanbieden. Dit accepteer je wanneer je een profiel als dienstverlener aanmaakt.',
    updated: LEGAL_DOCUMENTS['terms-provider'].updatedLabel,
  },
  {
    icon: Lock,
    href: LEGAL_DOCUMENTS.privacy.href,
    title: LEGAL_DOCUMENTS.privacy.title,
    text: 'Welke persoonsgegevens we verwerken, waarom, hoe lang, en welke rechten je hebt.',
    updated: LEGAL_DOCUMENTS.privacy.updatedLabel,
  },
  {
    icon: Cookie,
    href: COOKIE_POLICY.href,
    title: COOKIE_POLICY.title,
    text: 'Welke cookies we plaatsen en hoe je je keuze aanpast.',
    updated: COOKIE_POLICY.updatedLabel,
  },
  {
    icon: Flag,
    href: '/melden',
    title: 'Inhoud melden',
    text: 'Zie je iets dat onwettig is of tegen onze regels ingaat? Meld het hier. Ook ons contactpunt voor autoriteiten.',
    updated: null,
  },
];

export default function TermsHubPage() {
  return (
    <div className="container-page py-10 sm:py-14">
      <header className="max-w-3xl">
        <p className="text-sm font-bold uppercase tracking-wider text-brand-700">Juridisch</p>
        <h1 className="mt-2 text-4xl font-extrabold text-ink-950 sm:text-5xl">Voorwaarden en privacy</h1>
        <p className="mt-4 text-lg leading-relaxed text-ink-600">
          Duidelijke afspraken horen bij een betrouwbaar platform. Hier vind je alles wat geldt wanneer je Eventiphy
          gebruikt, in gewone taal.
        </p>
      </header>

      <ul className="mt-10 grid gap-4 md:grid-cols-2">
        {DOCUMENTS.map((document) => (
          <li key={document.href}>
            <Link
              href={document.href}
              className="group flex h-full gap-4 rounded-2xl border border-ink-200 bg-surface p-5 shadow-xs transition-[box-shadow,border-color] hover:border-brand-300 hover:shadow-md sm:p-6"
            >
              <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                <document.icon className="size-5" aria-hidden />
              </span>
              <span className="min-w-0">
                <span className="flex items-center gap-1.5 text-lg font-bold text-ink-950">
                  {document.title}
                  <ArrowRight className="size-4 text-brand-600 transition-transform group-hover:translate-x-0.5" aria-hidden />
                </span>
                <span className="mt-1 block leading-relaxed text-ink-600">{document.text}</span>
                {document.updated && <span className="mt-2 block text-xs text-ink-500">Bijgewerkt op {document.updated}</span>}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
