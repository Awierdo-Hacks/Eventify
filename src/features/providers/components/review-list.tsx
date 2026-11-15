import { Stars } from '@/components/ui/stars';
import { eventTypeLabel } from '@/lib/catalog';
import { formatDateShort } from '@/lib/format';
import type { ProviderProfile } from '@/features/providers/queries';

function ReviewItem({ review }: { review: ProviderProfile['reviews'][number] }) {
  return (
    <li className="py-5 first:pt-0 last:pb-0">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <Stars rating={review.rating} />
          <span className="text-sm font-bold text-ink-950">{review.author}</span>
        </div>
        <span className="text-xs text-ink-500">
          {eventTypeLabel(review.eventType)} · {formatDateShort(review.createdAt)}
        </span>
      </div>
      <p className="mt-2 font-semibold text-ink-900">{review.title}</p>
      <p className="mt-1 whitespace-pre-line leading-relaxed text-ink-600">{review.comment}</p>
    </li>
  );
}

const INITIAL_COUNT = 3;

/**
 * The first few reviews are always visible; the rest sit behind a native
 * disclosure, so a long list never pushes the rest of the page away.
 */
function ReviewList({ reviews }: { reviews: ProviderProfile['reviews'] }) {
  const visible = reviews.slice(0, INITIAL_COUNT);
  const rest = reviews.slice(INITIAL_COUNT);
  return (
    <>
      <ul className="divide-y divide-ink-100">
        {visible.map((review) => (
          <ReviewItem key={review.id} review={review} />
        ))}
      </ul>
      {rest.length > 0 && (
        <details className="group mt-5 border-t border-ink-100 pt-5">
          <summary className="inline-flex list-none items-center rounded-lg border border-ink-200 px-4 py-2 text-sm font-semibold text-ink-900 hover:bg-ink-50 group-open:hidden [&::-webkit-details-marker]:hidden">
            Toon nog {rest.length} {rest.length === 1 ? 'beoordeling' : 'beoordelingen'}
          </summary>
          <ul className="divide-y divide-ink-100">
            {rest.map((review) => (
              <ReviewItem key={review.id} review={review} />
            ))}
          </ul>
        </details>
      )}
    </>
  );
}

export { ReviewList };
