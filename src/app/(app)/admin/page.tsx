import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, BadgeCheck, Briefcase, CalendarCheck, Euro, Flag, Star, UserPlus, Users } from 'lucide-react';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { StatCard } from '@/components/ui/stat-card';
import { db } from '@/lib/db';
import { formatPrice, formatRelative } from '@/lib/format';
import { requireAdmin } from '@/lib/session';

export const metadata: Metadata = { title: 'Beheer' };

export default async function AdminOverviewPage() {
  await requireAdmin();
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const [users, providers, pendingProviders, bookings, total, month, openReports, waitlist, recentBookings, recentProviders, recentUsers, recentReviews] =
    await Promise.all([
      db.user.count({ where: { deleted_at: null } }),
      db.serviceProvider.count({ where: { user: { deleted_at: null } } }),
      db.serviceProvider.count({ where: { verified: false, user: { deleted_at: null } } }),
      db.booking.count(),
      db.booking.aggregate({ _sum: { final_price: true }, where: { status: { not: 'CANCELLED' } } }),
      db.booking.aggregate({ _sum: { final_price: true }, where: { status: { not: 'CANCELLED' }, created_at: { gte: monthStart } } }),
      db.contentReport.count({ where: { status: 'OPEN' } }),
      db.waitlistEntry.count(),
      db.booking.findMany({ take: 5, orderBy: { created_at: 'desc' }, select: { id: true, created_at: true, customer: { select: { name: true } }, provider: { select: { business_name: true } } } }),
      db.serviceProvider.findMany({ take: 5, orderBy: { created_at: 'desc' }, where: { user: { deleted_at: null } }, select: { id: true, business_name: true, verified: true, created_at: true } }),
      db.user.findMany({ take: 5, orderBy: { created_at: 'desc' }, where: { role: 'CUSTOMER', deleted_at: null }, select: { id: true, name: true, created_at: true } }),
      db.review.findMany({ take: 5, orderBy: { created_at: 'desc' }, select: { id: true, rating: true, created_at: true, provider: { select: { business_name: true } } } }),
    ]);

  const activity = [
    ...recentBookings.map((item) => ({ key: `b-${item.id}`, icon: CalendarCheck, text: `Boeking: ${item.customer.name} bij ${item.provider.business_name}`, at: item.created_at })),
    ...recentProviders.map((item) => ({ key: `p-${item.id}`, icon: item.verified ? BadgeCheck : Briefcase, text: `${item.verified ? 'Geverifieerd' : 'Nieuwe dienstverlener'}: ${item.business_name}`, at: item.created_at })),
    ...recentUsers.map((item) => ({ key: `u-${item.id}`, icon: UserPlus, text: `Nieuwe klant: ${item.name}`, at: item.created_at })),
    ...recentReviews.map((item) => ({ key: `r-${item.id}`, icon: Star, text: `Beoordeling (${item.rating}/5) voor ${item.provider.business_name}`, at: item.created_at })),
  ]
    .sort((a, b) => b.at.getTime() - a.at.getTime())
    .slice(0, 10);

  return (
    <>
      <PageHeader title="Beheer" description="De staat van het platform." />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Te verifiëren" value={pendingProviders} icon={BadgeCheck} href="/admin/providers?status=pending" highlight={pendingProviders > 0} hint="Nieuwe dienstverleners" />
        <StatCard label="Open meldingen" value={openReports} icon={Flag} href="/admin/reports" highlight={openReports > 0} />
        <StatCard label="Gebruikers" value={users} icon={Users} href="/admin/users" hint={`${providers} dienstverleners`} />
        <StatCard label="Boekingen" value={bookings} icon={CalendarCheck} hint={`${waitlist} op de wachtlijst`} />
      </div>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <StatCard label="Vastgelegde waarde, totaal" value={formatPrice(total._sum.final_price ?? 0)} icon={Euro} hint="Som van niet-geannuleerde boekingen" />
        <StatCard label="Vastgelegde waarde, deze maand" value={formatPrice(month._sum.final_price ?? 0)} icon={Euro} />
      </div>

      <section className="mt-10" aria-labelledby="activity-title">
        <div className="mb-4 flex items-center justify-between">
          <h2 id="activity-title" className="text-lg font-bold text-ink-950">
            Recente activiteit
          </h2>
          <Button asChild variant="link">
            <Link href="/admin/providers">
              Dienstverleners <ArrowRight aria-hidden />
            </Link>
          </Button>
        </div>
        {activity.length === 0 ? (
          <p className="rounded-xl border border-dashed border-ink-200 bg-surface px-5 py-8 text-center text-sm text-ink-600">Nog geen activiteit.</p>
        ) : (
          <ul className="divide-y divide-ink-100 rounded-xl border border-ink-200 bg-surface">
            {activity.map((item) => (
              <li key={item.key} className="flex items-center gap-3 px-4 py-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-ink-100 text-ink-600">
                  <item.icon className="size-4" aria-hidden />
                </span>
                <span className="min-w-0 flex-1 truncate text-sm font-medium text-ink-900">{item.text}</span>
                <span className="shrink-0 text-xs text-ink-500">{formatRelative(item.at)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
