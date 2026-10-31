import BrowseClient from './BrowseClient';
import { DEFAULT_BROWSE_PAGE_SIZE, getBrowseEventContext, getBrowseProviders } from '@/lib/page-data';
import { getSession } from '@/lib/auth';
import { parseCategory } from '@/lib/categories';

type BrowsePageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function BrowsePage({ searchParams }: BrowsePageProps) {
  const params = (await searchParams) ?? {};

  // Searching for a specific part of the customer's event: filter on its category, date and guests
  const session = await getSession();
  const eventContext = await getBrowseEventContext(session, firstParam(params.eventId), firstParam(params.slotId));

  const filters = {
    category: eventContext?.slotCategory || parseCategory(firstParam(params.category)) || 'all',
    location: firstParam(params.location) || 'all',
    priceRange: firstParam(params.priceRange) || 'all',
    search: firstParam(params.q) || firstParam(params.search) || '',
    availableOn: eventContext?.eventDate ? eventContext.eventDate.split('T')[0] : null,
    guests: eventContext?.guestCount ?? null,
    page: 1,
    pageSize: DEFAULT_BROWSE_PAGE_SIZE,
  };
  const initialResult = await getBrowseProviders(filters);

  return (
    <BrowseClient
      initialFilters={filters}
      initialProviders={initialResult.items}
      initialTotal={initialResult.total}
      initialPage={initialResult.page}
      initialPageSize={initialResult.pageSize}
      initialHasMore={initialResult.hasMore}
      eventContext={eventContext}
    />
  );
}
