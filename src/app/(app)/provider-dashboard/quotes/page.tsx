import type { Metadata } from 'next';
import { FileText } from 'lucide-react';
import { PageHeader } from '@/components/layout/page-header';
import { EmptyState } from '@/components/ui/empty-state';
import { QuoteCard } from '@/features/quotes/components/quote-card';
import { getProviderQuotes } from '@/features/quotes/queries';
import { requireProvider } from '@/lib/session';

export const metadata: Metadata = { title: 'Offertes' };

const GROUPS = [
  { status: 'PENDING', title: 'Openstaand' },
  { status: 'ACCEPTED', title: 'Geaccepteerd' },
  { status: 'REJECTED', title: 'Afgewezen' },
  { status: 'EXPIRED', title: 'Verlopen' },
] as const;

export default async function ProviderQuotesPage() {
  const user = await requireProvider('/provider-dashboard/quotes');
  const quotes = await getProviderQuotes(user.providerId);

  return (
    <>
      <PageHeader title="Offertes" description="Alles wat je naar klanten hebt gestuurd." />
      {quotes.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="Nog geen offertes"
          description="Beantwoord een aanvraag met een offerte, of stuur er een vanuit een gesprek."
        />
      ) : (
        <div className="space-y-10">
          {GROUPS.map((group) => {
            const items = quotes.filter((quote) => quote.status === group.status);
            if (items.length === 0) return null;
            return (
              <section key={group.status} aria-labelledby={`group-${group.status}`}>
                <h2 id={`group-${group.status}`} className="mb-4 text-lg font-bold text-ink-950">
                  {group.title} ({items.length})
                </h2>
                <div className="space-y-4">
                  {items.map((quote) => (
                    <QuoteCard key={quote.id} quote={quote} viewer="provider" />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </>
  );
}
