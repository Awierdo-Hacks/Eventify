import BrowseClient from './BrowseClient';
import { DEFAULT_BROWSE_PAGE_SIZE, getBrowseProviders } from '@/lib/page-data';

type BrowsePageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function BrowsePage({ searchParams }: BrowsePageProps) {
  const params = (await searchParams) ?? {};
  const filters = {
    category: firstParam(params.category) || 'all',
    location: firstParam(params.location) || 'all',
    priceRange: firstParam(params.priceRange) || 'all',
    search: firstParam(params.q) || firstParam(params.search) || '',
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
    />
  );
}
