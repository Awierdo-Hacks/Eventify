import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { Briefcase, ExternalLink, Mail, MapPin, Phone } from 'lucide-react';
import { PageHeader } from '@/components/layout/page-header';
import { Badge } from '@/components/ui/badge';
import { CategoryIcon } from '@/components/ui/category-icon';
import { EmptyState } from '@/components/ui/empty-state';
import { ProviderControls } from '@/features/admin/components/admin-controls';
import { FilterTabs } from '@/features/admin/components/filter-tabs';
import { categoryLabel } from '@/lib/catalog';
import { db } from '@/lib/db';
import { formatDateShort } from '@/lib/format';
import { requireAdmin } from '@/lib/session';

export const metadata: Metadata = { title: 'Dienstverleners' };

export default async function AdminProvidersPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  await requireAdmin();
  const { status } = await searchParams;
  const filter = status === 'pending' || status === 'verified' || status === 'hidden' ? status : 'all';
  const base = { user: { deleted_at: null } };
  const where = {
    ...base,
    ...(filter === 'pending' && { verified: false }),
    ...(filter === 'verified' && { verified: true }),
    ...(filter === 'hidden' && { is_active: false }),
  };

  const [providers, all, pending, hidden] = await Promise.all([
    db.serviceProvider.findMany({
      where,
      select: {
        id: true,
        business_name: true,
        category: true,
        location: true,
        description: true,
        images: true,
        phone: true,
        btw_number: true,
        verified: true,
        is_active: true,
        rating_avg: true,
        review_count: true,
        created_at: true,
        user: { select: { name: true, email: true, status: true } },
        _count: { select: { service_requests: true, quotes: true, bookings: true, provider_services: true } },
      },
      orderBy: [{ verified: 'asc' }, { created_at: 'desc' }],
      take: 200,
    }),
    db.serviceProvider.count({ where: base }),
    db.serviceProvider.count({ where: { ...base, verified: false } }),
    db.serviceProvider.count({ where: { ...base, is_active: false } }),
  ]);

  return (
    <>
      <PageHeader title="Dienstverleners" description="Controleer nieuwe profielen en beheer de zichtbaarheid." />
      <FilterTabs
        label="Filter dienstverleners"
        tabs={[
          { href: '/admin/providers', label: 'Alle', count: all, active: filter === 'all' },
          { href: '/admin/providers?status=pending', label: 'Te verifiëren', count: pending, active: filter === 'pending' },
          { href: '/admin/providers?status=verified', label: 'Geverifieerd', count: all - pending, active: filter === 'verified' },
          { href: '/admin/providers?status=hidden', label: 'Verborgen', count: hidden, active: filter === 'hidden' },
        ]}
      />

      {providers.length === 0 ? (
        <EmptyState icon={Briefcase} title="Geen dienstverleners" description="Er zijn geen dienstverleners die aan dit filter voldoen." />
      ) : (
        <ul className="space-y-4">
          {providers.map((provider) => (
            <li key={provider.id} className="rounded-xl border border-ink-200 bg-surface shadow-xs">
              <div className="flex flex-wrap items-start gap-4 p-5">
                {provider.images[0] ? (
                  <Image src={provider.images[0]} alt="" width={72} height={72} className="size-[4.5rem] shrink-0 rounded-lg object-cover" />
                ) : (
                  <CategoryIcon category={provider.category} size="lg" className="size-[4.5rem]" />
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-bold text-ink-950">{provider.business_name}</h2>
                    <Badge tone={provider.verified ? 'success' : 'warning'}>{provider.verified ? 'Geverifieerd' : 'Te verifiëren'}</Badge>
                    {!provider.is_active && <Badge tone="neutral">Verborgen</Badge>}
                    {provider.user.status !== 'ACTIVE' && <Badge tone="danger">Account {provider.user.status === 'BANNED' ? 'geblokkeerd' : 'geschorst'}</Badge>}
                  </div>
                  <p className="mt-0.5 text-sm text-ink-600">
                    {categoryLabel(provider.category)} · aangemeld op {formatDateShort(provider.created_at)}
                  </p>
                  <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-ink-700">
                    <li className="flex items-center gap-1.5">
                      <MapPin className="size-4 text-ink-400" aria-hidden />
                      {provider.location}
                    </li>
                    <li className="flex items-center gap-1.5">
                      <Mail className="size-4 text-ink-400" aria-hidden />
                      <a href={`mailto:${provider.user.email}`} className="hover:text-brand-700">
                        {provider.user.email}
                      </a>
                    </li>
                    {provider.phone && (
                      <li className="flex items-center gap-1.5">
                        <Phone className="size-4 text-ink-400" aria-hidden />
                        {provider.phone}
                      </li>
                    )}
                  </ul>
                </div>
                <ProviderControls providerId={provider.id} name={provider.business_name} verified={provider.verified} visible={provider.is_active} />
              </div>

              <div className="space-y-3 border-t border-ink-100 px-5 py-4">
                {provider.description && <p className="line-clamp-3 text-sm leading-relaxed text-ink-700">{provider.description}</p>}
                <dl className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
                  {[
                    ['Contactpersoon', provider.user.name],
                    ['Ondernemingsnr.', provider.btw_number || 'Niet opgegeven'],
                    ['Foto’s', provider.images.length],
                    ['Diensten', provider._count.provider_services],
                    ['Aanvragen', provider._count.service_requests],
                    ['Offertes', provider._count.quotes],
                    ['Boekingen', provider._count.bookings],
                    ['Beoordeling', provider.review_count > 0 ? `${provider.rating_avg.toFixed(1)} (${provider.review_count})` : '–'],
                  ].map(([label, value]) => (
                    <div key={label}>
                      <dt className="text-xs text-ink-500">{label}</dt>
                      <dd className="font-semibold text-ink-900">{value}</dd>
                    </div>
                  ))}
                </dl>
                <Link href={`/providers/${provider.id}`} className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 hover:underline">
                  Profiel bekijken <ExternalLink className="size-3.5" aria-hidden />
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
