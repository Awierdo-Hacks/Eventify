import type { Metadata } from 'next';
import Link from 'next/link';
import { PageHeader } from '@/components/layout/page-header';
import { site } from '@/config/site';
import { DataControls, DeleteAccount, DetailsForm, PasswordForm } from '@/features/account/account-forms';
import { LEGAL_DOCUMENTS, termsFor } from '@/features/legal/documents';
import { db } from '@/lib/db';
import { formatDate } from '@/lib/format';
import { requireUser } from '@/lib/session';

export const metadata: Metadata = { title: 'Account & privacy' };

function Section({ title, description, children }: { title: string; description?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-ink-200 bg-surface p-5 shadow-xs sm:p-6">
      <h2 className="text-lg font-bold text-ink-950">{title}</h2>
      {description && <p className="mt-1 text-sm leading-relaxed text-ink-600">{description}</p>}
      <div className="mt-5">{children}</div>
    </section>
  );
}

export default async function AccountPage() {
  const user = await requireUser('/account');
  const [account, acceptances] = await Promise.all([
    db.user.findUnique({ where: { id: user.id }, select: { phone: true, created_at: true } }),
    db.legalAcceptance.findMany({
      where: { user_id: user.id },
      select: { document: true, version: true, accepted_at: true },
      orderBy: { accepted_at: 'desc' },
    }),
  ]);
  const terms = termsFor(user.role);
  const termsAcceptance = terms ? acceptances.find((entry) => entry.document === terms.key && entry.version === terms.version) : null;

  return (
    <div className="max-w-3xl">
      <PageHeader
        title="Account & privacy"
        description={account ? `Lid sinds ${formatDate(account.created_at)}` : undefined}
      />
      <div className="space-y-6">
        <Section title="Je gegevens">
          <DetailsForm name={user.name} phone={account?.phone ?? ''} email={user.email} />
        </Section>

        <Section title="Wachtwoord">
          <PasswordForm />
        </Section>

        <Section
          title="Privacy"
          description={
            <>
              Je hebt het recht om je gegevens in te zien, te verbeteren, mee te nemen en te laten wissen. Hoe we met je
              gegevens omgaan lees je in de{' '}
              <Link href={LEGAL_DOCUMENTS.privacy.href} className="font-semibold text-brand-700 underline underline-offset-2">
                privacyverklaring
              </Link>
              . Voor andere verzoeken mail je naar{' '}
              <a href={`mailto:${site.contact.privacyEmail}`} className="font-semibold text-brand-700 underline underline-offset-2">
                {site.contact.privacyEmail}
              </a>
              .
            </>
          }
        >
          <DataControls />
          {terms && (
            <p className="mt-5 border-t border-ink-100 pt-4 text-sm text-ink-600">
              Je ging akkoord met de{' '}
              <Link href={terms.href} className="font-semibold text-brand-700 underline underline-offset-2">
                {terms.title.toLowerCase()}
              </Link>
              {termsAcceptance ? ` op ${formatDate(termsAcceptance.accepted_at)} (versie ${terms.version}).` : '.'}
            </p>
          )}
        </Section>

        {user.role !== 'ADMIN' && (
          <Section
            title="Account verwijderen"
            description="Je account en je persoonsgegevens worden gewist. Afgeronde boekingen en beoordelingen blijven zonder je naam bewaard."
          >
            <DeleteAccount isProvider={user.role === 'PROVIDER'} />
          </Section>
        )}
      </div>
    </div>
  );
}
