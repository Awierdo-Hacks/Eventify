import type { Metadata } from 'next';
import Form from 'next/form';
import { Search, Users } from 'lucide-react';
import { PageHeader } from '@/components/layout/page-header';
import { Badge, StatusBadge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';
import { UserControls } from '@/features/admin/components/admin-controls';
import { FilterTabs } from '@/features/admin/components/filter-tabs';
import { ROLE_LABELS, USER_STATUS } from '@/lib/catalog';
import { db } from '@/lib/db';
import { formatDateShort } from '@/lib/format';
import { requireAdmin } from '@/lib/session';
import type { Prisma } from '@/generated/prisma/client';

export const metadata: Metadata = { title: 'Gebruikers' };

const ROLES = ['CUSTOMER', 'PROVIDER', 'ADMIN'] as const;

export default async function AdminUsersPage({ searchParams }: { searchParams: Promise<{ role?: string; q?: string }> }) {
  await requireAdmin();
  const params = await searchParams;
  const role = ROLES.find((value) => value === params.role);
  const q = params.q?.trim().slice(0, 80) || '';

  const where: Prisma.UserWhereInput = {
    deleted_at: null,
    ...(role && { role }),
    ...(q && { OR: [{ name: { contains: q, mode: 'insensitive' } }, { email: { contains: q, mode: 'insensitive' } }] }),
  };

  const users = await db.user.findMany({
    where,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      created_at: true,
      provider: { select: { business_name: true } },
      _count: { select: { service_requests: true, bookings: true, reviews: true } },
    },
    orderBy: { created_at: 'desc' },
    take: 200,
  });

  const hrefFor = (value?: string) => {
    const query = new URLSearchParams();
    if (value) query.set('role', value);
    if (q) query.set('q', q);
    const text = query.toString();
    return text ? `/admin/users?${text}` : '/admin/users';
  };

  return (
    <>
      <PageHeader title="Gebruikers" description="Zoek accounts en grijp in waar nodig." />
      <FilterTabs
        label="Filter op rol"
        tabs={[
          { href: hrefFor(), label: 'Alle', active: !role },
          { href: hrefFor('CUSTOMER'), label: 'Klanten', active: role === 'CUSTOMER' },
          { href: hrefFor('PROVIDER'), label: 'Dienstverleners', active: role === 'PROVIDER' },
          { href: hrefFor('ADMIN'), label: 'Beheerders', active: role === 'ADMIN' },
        ]}
      />

      <Form action="/admin/users" role="search" className="mb-6 flex gap-2 sm:max-w-md">
        {role && <input type="hidden" name="role" value={role} />}
        <div className="relative flex-1">
          <label htmlFor="q" className="sr-only">
            Zoek op naam of e-mailadres
          </label>
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-ink-400" aria-hidden />
          <Input id="q" name="q" type="search" defaultValue={q} placeholder="Naam of e-mailadres" className="pl-10" />
        </div>
        <Button type="submit" variant="outline" className="h-11">
          Zoeken
        </Button>
      </Form>

      {users.length === 0 ? (
        <EmptyState icon={Users} title="Geen gebruikers gevonden" description="Pas je zoekopdracht of filter aan." />
      ) : (
        <div className="overflow-hidden rounded-xl border border-ink-200 bg-surface shadow-xs">
          <ul className="divide-y divide-ink-100">
            {users.map((user) => (
              <li key={user.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3.5 sm:px-5">
                <div className="min-w-0 flex-1 basis-56">
                  <p className="truncate font-semibold text-ink-950">
                    {user.name}
                    {user.provider && <span className="font-normal text-ink-500"> · {user.provider.business_name}</span>}
                  </p>
                  <p className="truncate text-sm text-ink-600">{user.email}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone={user.role === 'ADMIN' ? 'brand' : user.role === 'PROVIDER' ? 'warning' : 'neutral'}>{ROLE_LABELS[user.role]}</Badge>
                  <StatusBadge status={user.status} map={USER_STATUS} />
                </div>
                <p className="w-full text-xs text-ink-500 sm:w-44">
                  Sinds {formatDateShort(user.created_at)}
                  <span className="block">
                    {user._count.service_requests} aanvragen · {user._count.bookings} boekingen
                  </span>
                </p>
                {user.role !== 'ADMIN' ? <UserControls userId={user.id} name={user.name} status={user.status} /> : <span className="w-8" />}
              </li>
            ))}
          </ul>
        </div>
      )}
      {users.length === 200 && <p className="mt-3 text-sm text-ink-500">De eerste 200 resultaten worden getoond. Verfijn je zoekopdracht.</p>}
    </>
  );
}
