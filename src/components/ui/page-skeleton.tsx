import { Skeleton } from '@/components/ui/skeleton';

/** Generic loading state for signed-in pages: header plus a few cards. */
function PageSkeleton({ cards = 3 }: { cards?: number }) {
  return (
    <div aria-busy="true" aria-label="Laden">
      <Skeleton className="h-9 w-64 max-w-full" />
      <Skeleton className="mt-3 h-5 w-80 max-w-full" />
      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton key={index} className="h-28 rounded-xl" />
        ))}
      </div>
      <div className="mt-6 space-y-4">
        {Array.from({ length: cards }, (_, index) => (
          <Skeleton key={index} className="h-40 rounded-xl" />
        ))}
      </div>
    </div>
  );
}

export { PageSkeleton };
