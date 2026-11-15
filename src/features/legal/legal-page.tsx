import * as React from 'react';
import Link from 'next/link';
import { companyAddressLine, companyDisplayName, site } from '@/config/site';

interface LegalPageProps {
  title: string;
  intro: React.ReactNode;
  updated: string;
  version?: string;
  /** Section anchors for the table of contents. */
  sections: Array<{ id: string; title: string }>;
  children: React.ReactNode;
}

/** Shared frame for legal documents: title, version, contents and readable text. */
function LegalPage({ title, intro, updated, version, sections, children }: LegalPageProps) {
  return (
    <div className="container-page py-10 sm:py-14">
      <header className="max-w-3xl">
        <p className="text-sm font-bold uppercase tracking-wider text-brand-700">Juridisch</p>
        <h1 className="mt-2 text-4xl font-extrabold text-ink-950 sm:text-5xl">{title}</h1>
        <p className="mt-4 text-lg leading-relaxed text-ink-600">{intro}</p>
        <p className="mt-4 text-sm text-ink-500">
          Laatst bijgewerkt op {updated}
          {version && ` · versie ${version}`}
        </p>
      </header>

      <div className="mt-10 grid gap-10 lg:grid-cols-[16rem_1fr] lg:gap-16">
        <nav aria-label="Inhoud" className="lg:sticky lg:top-24 lg:self-start">
          <details className="group rounded-xl border border-ink-200 bg-surface p-4 lg:hidden">
            <summary className="list-none font-bold text-ink-950 [&::-webkit-details-marker]:hidden">Inhoud</summary>
            <ol className="mt-3 space-y-2 text-sm">
              {sections.map((section) => (
                <li key={section.id}>
                  <a href={`#${section.id}`} className="text-ink-700 hover:text-brand-700">
                    {section.title}
                  </a>
                </li>
              ))}
            </ol>
          </details>
          <div className="hidden lg:block">
            <p className="text-xs font-bold uppercase tracking-wider text-ink-500">Inhoud</p>
            <ol className="mt-3 space-y-2 border-l border-ink-200 text-sm">
              {sections.map((section) => (
                <li key={section.id}>
                  <a href={`#${section.id}`} className="-ml-px block border-l border-transparent pl-4 text-ink-600 hover:border-brand-600 hover:text-ink-950">
                    {section.title}
                  </a>
                </li>
              ))}
            </ol>
          </div>
        </nav>

        <article className="prose-legal min-w-0 max-w-3xl">{children}</article>
      </div>
    </div>
  );
}

/** A numbered section with an anchor. */
function LegalSection({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section aria-labelledby={id}>
      <h2 id={id}>{title}</h2>
      {children}
    </section>
  );
}

/** "Who we are" block reused by every document. */
function CompanyIdentity() {
  const address = companyAddressLine();
  const { enterpriseNumber, vatNumber } = site.company;
  return (
    <ul>
      <li>
        <strong>{companyDisplayName()}</strong>
        {address && `, ${address}`}
      </li>
      {enterpriseNumber && <li>Ondernemingsnummer (KBO): {enterpriseNumber}</li>}
      {vatNumber && <li>Btw-nummer: {vatNumber}</li>}
      <li>
        E-mail: <a href={`mailto:${site.contact.email}`}>{site.contact.email}</a>
      </li>
      <li>
        Telefoon: <a href={site.contact.phoneHref}>{site.contact.phone}</a>
      </li>
    </ul>
  );
}

const Mail = ({ to }: { to: string }) => <a href={`mailto:${to}`}>{to}</a>;

export { LegalPage, LegalSection, CompanyIdentity, Mail, Link as LegalLink };
