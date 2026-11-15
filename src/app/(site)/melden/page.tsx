import type { Metadata } from 'next';
import { site } from '@/config/site';
import { ReportForm } from '@/features/reports/report-form';
import { getCurrentUser } from '@/lib/session';

export const metadata: Metadata = {
  title: 'Inhoud melden',
  description: 'Meld inhoud op Eventiphy die onwettig is of tegen onze voorwaarden ingaat. Ook ons contactpunt voor autoriteiten.',
  alternates: { canonical: '/melden' },
};

export default async function ReportPage({ searchParams }: { searchParams: Promise<{ type?: string; id?: string }> }) {
  const [{ type, id }, user] = await Promise.all([searchParams, getCurrentUser()]);

  return (
    <div className="container-page grid gap-10 py-10 sm:py-14 lg:grid-cols-[1fr_24rem] lg:gap-16">
      <div className="min-w-0 max-w-2xl">
        <p className="text-sm font-bold uppercase tracking-wider text-brand-700">Juridisch</p>
        <h1 className="mt-2 text-4xl font-extrabold text-ink-950 sm:text-5xl">Inhoud melden</h1>
        <p className="mt-4 text-lg leading-relaxed text-ink-600">
          Zie je een profiel, beoordeling of bericht dat volgens jou onwettig is of tegen onze voorwaarden ingaat? Laat
          het ons weten. Iedereen kan een melding doen, ook zonder account.
        </p>
        <div className="mt-8 rounded-2xl border border-ink-200 bg-surface p-5 shadow-xs sm:p-8">
          <ReportForm defaultType={type} defaultTargetId={id?.slice(0, 200)} signedInEmail={user?.email} />
        </div>
      </div>

      <aside className="space-y-5 text-sm leading-relaxed text-ink-700 lg:pt-28">
        <div className="rounded-2xl border border-ink-200 bg-surface p-5">
          <h2 className="font-bold text-ink-950">Wat gebeurt er met je melding?</h2>
          <ol className="mt-3 list-decimal space-y-2 pl-5">
            <li>We bevestigen de ontvangst.</li>
            <li>Een medewerker beoordeelt de melding zorgvuldig en objectief. Dat gebeurt niet automatisch.</li>
            <li>Je krijgt bericht over onze beslissing, met de reden.</li>
            <li>Ben je het er niet mee eens? Dan kun je bezwaar maken via hetzelfde adres.</li>
          </ol>
          <p className="mt-3 text-ink-600">
            Ook de gebruiker over wie de melding gaat hoort wat we beslissen en waarom, en kan bezwaar maken. Wie
            herhaaldelijk kennelijk ongegronde meldingen doet, kunnen we tijdelijk uitsluiten van deze procedure.
          </p>
        </div>
        <div className="rounded-2xl border border-ink-200 bg-surface p-5">
          <h2 className="font-bold text-ink-950">Contactpunt</h2>
          <p className="mt-2">
            Voor autoriteiten van de lidstaten, de Europese Commissie en voor gebruikers (artikelen 11 en 12 van de
            Digitaledienstenverordening):
          </p>
          <p className="mt-2">
            <a href={`mailto:${site.contact.legalEmail}`} className="font-semibold text-brand-700 underline underline-offset-2">
              {site.contact.legalEmail}
            </a>
            <br />
            Talen: Nederlands en Engels
          </p>
        </div>
        <p className="px-1 text-ink-600">
          Is er direct gevaar? Bel dan de hulpdiensten op 112. Een melding hier vervangt geen aangifte bij de politie.
        </p>
      </aside>
    </div>
  );
}
