import type { Metadata } from 'next';
import Link from 'next/link';
import { ExternalLink, Flag } from 'lucide-react';
import { PageHeader } from '@/components/layout/page-header';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { ReportControls } from '@/features/admin/components/admin-controls';
import { FilterTabs } from '@/features/admin/components/filter-tabs';
import { REPORT_REASONS, REPORT_TARGETS } from '@/features/reports/config';
import { db } from '@/lib/db';
import { formatDate, formatRelative } from '@/lib/format';
import { requireAdmin } from '@/lib/session';

export const metadata: Metadata = { title: 'Meldingen' };

function targetHref(type: string, id: string): string | null {
  if (type === 'PROVIDER') return `/providers/${id}`;
  if (type === 'MESSAGE') return null; // Private conversations are not opened from here.
  return null;
}

export default async function AdminReportsPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  await requireAdmin();
  const { status } = await searchParams;
  const showHandled = status === 'handled';

  const [reports, open, handled] = await Promise.all([
    db.contentReport.findMany({
      where: showHandled ? { status: { not: 'OPEN' } } : { status: 'OPEN' },
      orderBy: { created_at: showHandled ? 'desc' : 'asc' },
      take: 200,
      select: {
        id: true,
        target_type: true,
        target_id: true,
        reason: true,
        details: true,
        status: true,
        resolution: true,
        reporter_email: true,
        created_at: true,
        resolved_at: true,
        reporter: { select: { name: true, email: true } },
      },
    }),
    db.contentReport.count({ where: { status: 'OPEN' } }),
    db.contentReport.count({ where: { status: { not: 'OPEN' } } }),
  ]);

  return (
    <>
      <PageHeader title="Meldingen" description="Meldingen van inhoud die mogelijk onwettig is of tegen de voorwaarden ingaat." />
      <FilterTabs
        label="Filter meldingen"
        tabs={[
          { href: '/admin/reports', label: 'Open', count: open, active: !showHandled },
          { href: '/admin/reports?status=handled', label: 'Afgehandeld', count: handled, active: showHandled },
        ]}
      />

      {reports.length === 0 ? (
        <EmptyState icon={Flag} title={showHandled ? 'Nog niets afgehandeld' : 'Geen open meldingen'} description={showHandled ? undefined : 'Alles is bijgewerkt.'} />
      ) : (
        <ul className="space-y-4">
          {reports.map((report) => {
            const href = targetHref(report.target_type, report.target_id);
            const reporter = report.reporter ? `${report.reporter.name} (${report.reporter.email})` : (report.reporter_email ?? 'Anoniem');
            return (
              <li key={report.id} className="rounded-xl border border-ink-200 bg-surface p-5 shadow-xs">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone="brand">{REPORT_TARGETS[report.target_type] ?? report.target_type}</Badge>
                      <span className="font-bold text-ink-950">{REPORT_REASONS[report.reason] ?? report.reason}</span>
                    </div>
                    <p className="mt-1 text-sm text-ink-500">
                      Gemeld {formatRelative(report.created_at)} door {reporter}
                    </p>
                  </div>
                  {report.status === 'OPEN' ? (
                    <ReportControls reportId={report.id} />
                  ) : (
                    <Badge tone={report.status === 'ACTION_TAKEN' ? 'success' : 'neutral'}>
                      {report.status === 'ACTION_TAKEN' ? 'Actie ondernomen' : 'Geen actie nodig'}
                    </Badge>
                  )}
                </div>
                {report.details && <p className="mt-3 whitespace-pre-line rounded-lg bg-ink-50 px-4 py-3 text-sm leading-relaxed text-ink-700">{report.details}</p>}
                <p className="mt-3 text-sm text-ink-600">
                  {href ? (
                    <Link href={href} className="inline-flex items-center gap-1.5 font-semibold text-brand-700 hover:underline">
                      Gemelde inhoud bekijken <ExternalLink className="size-3.5" aria-hidden />
                    </Link>
                  ) : (
                    <span>
                      Referentie: <code className="rounded bg-ink-100 px-1.5 py-0.5 text-xs">{report.target_id}</code>
                    </span>
                  )}
                </p>
                {report.resolution && (
                  <p className="mt-3 border-t border-ink-100 pt-3 text-sm text-ink-700">
                    <span className="font-semibold">Beslissing{report.resolved_at ? ` (${formatDate(report.resolved_at)})` : ''}:</span> {report.resolution}
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
