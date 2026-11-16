import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Eye } from 'lucide-react';
import { PageHeader } from '@/components/layout/page-header';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { ProfileForm } from '@/features/provider-area/components/profile-form';
import { findCategory } from '@/lib/catalog';
import { db } from '@/lib/db';
import { requireProvider } from '@/lib/session';

export const metadata: Metadata = { title: 'Profiel' };

export default async function ProviderProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ welkom?: string }>;
}) {
  const user = await requireProvider('/provider-dashboard/profile');
  const [{ welkom }, provider] = await Promise.all([
    searchParams,
    db.serviceProvider.findUnique({
      where: { id: user.providerId },
      select: {
        business_name: true,
        category: true,
        location: true,
        price_range: true,
        description: true,
        phone: true,
        website: true,
        availability: true,
        response_time: true,
        min_guests: true,
        max_guests: true,
        services: true,
        images: true,
        portfolio_images: true,
        verified: true,
        provider_services: {
          select: { name: true, description: true, price_from: true, price_to: true },
          orderBy: { created_at: 'asc' },
        },
      },
    }),
  ]);
  if (!provider) notFound();

  return (
    <div className="max-w-4xl">
      <PageHeader
        title="Profiel"
        description="Zo zien klanten je op Eventiphy."
        actions={
          <Button asChild variant="outline">
            <Link href={`/providers/${user.providerId}`}>
              <Eye aria-hidden /> Voorbeeld
            </Link>
          </Button>
        }
      />

      {welkom && (
        <Alert tone="success" title="Welkom bij Eventiphy!" className="mb-6">
          Je account is aangemaakt. Voeg foto’s en diensten toe: een volledig profiel wordt sneller
          goedgekeurd en krijgt meer aanvragen.
        </Alert>
      )}
      {!provider.verified && !welkom && (
        <Alert tone="warning" title="Je profiel wacht op controle" className="mb-6">
          Zodra ons team je profiel heeft nagekeken, wordt het zichtbaar voor klanten.
        </Alert>
      )}

      <ProfileForm
        initial={{
          businessName: provider.business_name,
          category: findCategory(provider.category)?.slug ?? 'other',
          location: provider.location,
          priceRange: provider.price_range,
          description: provider.description ?? '',
          phone: provider.phone ?? '',
          website: provider.website ?? '',
          availability: provider.availability ?? '',
          responseTime: provider.response_time ?? '',
          minGuests: provider.min_guests?.toString() ?? '',
          maxGuests: provider.max_guests?.toString() ?? '',
          tags: provider.services,
          images: [...new Set([...provider.images, ...provider.portfolio_images])],
          services: provider.provider_services.map((service) => ({
            name: service.name,
            description: service.description ?? '',
            priceFrom: service.price_from.toString(),
            priceTo: service.price_to?.toString() ?? '',
          })),
        }}
      />
    </div>
  );
}
