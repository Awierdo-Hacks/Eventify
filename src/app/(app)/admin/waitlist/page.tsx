import type { Metadata } from 'next';
import { Download, ListChecks } from 'lucide-react';
import { PageHeader } from '@/components/layout/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { StatCard } from '@/components/ui/stat-card';
import { categoryLabel } from '@/lib/catalog';
import { db } from '@/lib/db';
import { formatDateShort } from '@/lib/format';
import { requireAdmin } from '@/lib/session';
import { Briefcase, PartyPopper, Users } from 'lucide-react';

export const metadata: Metadata = { title: 'Wachtlijst' };

export default async function AdminWaitlistPage() {
  await requireAdmin();
  const entries = await db.waitlistEntry.findMany({ orderBy: { created_at: 'desc' }, take: 1000 });

  const customers = entries.filter((entry) => entry.type === 'CUSTOMER').length;
  const providers = entries.length - customers;
  const perCategory = new Map<string, number>();
  for (const entry of entries)
    for (const category of entry.categories)
      perCategory.set(category, (perCategory.get(category) ?? 0) + 1);
  const breakdown = [...perCategory.entries()].sort((a, b) => b[1] - a[1]);
  const max = breakdown[0]?.[1] ?? 1;

  return (
    <>
      <PageHeader
        title="Wachtlijst"
        description="Mensen die op de hoogte willen blijven."
        actions={
          entries.length > 0 && (
            <Button asChild variant="outline">
              <a href="/api/admin/waitlist/export" download>
                <Download aria-hidden /> Exporteer voor Excel (CSV)
              </a>
            </Button>
          )
        }
      />

      {entries.length === 0 ? (
        <EmptyState
          icon={ListChecks}
          title="Nog geen aanmeldingen"
          description="Aanmeldingen via de wachtlijstpagina verschijnen hier."
        />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard label="Totaal" value={entries.length} icon={Users} />
            <StatCard label="Klanten" value={customers} icon={PartyPopper} />
            <StatCard label="Dienstverleners" value={providers} icon={Briefcase} />
          </div>

          {breakdown.length > 0 && (
            <section
              className="mt-8 rounded-xl border border-ink-200 bg-surface p-5 shadow-xs sm:p-6"
              aria-labelledby="breakdown-title"
            >
              <h2 id="breakdown-title" className="font-bold text-ink-950">
                Diensten van aangemelde dienstverleners
              </h2>
              <ul className="mt-4 space-y-2.5">
                {breakdown.map(([category, count]) => (
                  <li
                    key={category}
                    className="grid grid-cols-[9rem_1fr_2rem] items-center gap-3 text-sm sm:grid-cols-[12rem_1fr_2rem]"
                  >
                    <span className="truncate font-medium text-ink-800">
                      {categoryLabel(category)}
                    </span>
                    <span className="h-2.5 overflow-hidden rounded-full bg-ink-100" aria-hidden>
                      <span
                        className="block h-full rounded-full bg-brand-500"
                        style={{ width: `${(count / max) * 100}%` }}
                      />
                    </span>
                    <span className="text-right font-bold tabular-nums text-ink-950">{count}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className="mt-8" aria-labelledby="entries-title">
            <h2 id="entries-title" className="mb-4 text-lg font-bold text-ink-950">
              Alle aanmeldingen
            </h2>
            <div className="overflow-x-auto rounded-xl border border-ink-200 bg-surface shadow-xs">
              <table className="w-full min-w-[44rem] text-left text-sm">
                <thead className="border-b border-ink-200 bg-ink-50 text-xs uppercase tracking-wider text-ink-500">
                  <tr>
                    <th scope="col" className="px-4 py-3 font-semibold">
                      Naam
                    </th>
                    <th scope="col" className="px-4 py-3 font-semibold">
                      Type
                    </th>
                    <th scope="col" className="px-4 py-3 font-semibold">
                      Contact
                    </th>
                    <th scope="col" className="px-4 py-3 font-semibold">
                      Diensten / bericht
                    </th>
                    <th scope="col" className="px-4 py-3 font-semibold">
                      Datum
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-100">
                  {entries.map((entry) => (
                    <tr key={entry.id} className="align-top">
                      <th scope="row" className="px-4 py-3 font-semibold text-ink-950">
                        {entry.name}
                      </th>
                      <td className="px-4 py-3">
                        <Badge tone={entry.type === 'PROVIDER' ? 'warning' : 'neutral'}>
                          {entry.type === 'PROVIDER' ? 'Dienstverlener' : 'Klant'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-ink-700">
                        <a href={`mailto:${entry.email}`} className="hover:text-brand-700">
                          {entry.email}
                        </a>
                        {entry.phone && <span className="block text-ink-500">{entry.phone}</span>}
                      </td>
                      <td className="max-w-xs px-4 py-3 text-ink-700">
                        {entry.categories.length > 0 && (
                          <span className="block">
                            {entry.categories.map((category) => categoryLabel(category)).join(', ')}
                          </span>
                        )}
                        {entry.message && (
                          <span className="block text-ink-500">{entry.message}</span>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-ink-500">
                        {formatDateShort(entry.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </>
  );
}
