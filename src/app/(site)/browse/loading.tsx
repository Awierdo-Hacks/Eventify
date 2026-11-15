import { Skeleton } from '@/components/ui/skeleton';

export default function BrowseLoading() {
  return (
    <div className="container-page py-8 sm:py-12" aria-busy="true" aria-label="Dienstverleners laden">
      <Skeleton className="h-10 w-80 max-w-full" />
      <Skeleton className="mt-3 h-6 w-96 max-w-full" />
      <Skeleton className="mt-6 h-[4.25rem] w-full rounded-2xl" />
      <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, index) => (
          <Skeleton key={index} className="aspect-[4/5] w-full rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
