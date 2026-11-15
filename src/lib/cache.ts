import 'server-only';
import { revalidateTag, updateTag } from 'next/cache';

/** Cache tags for public, shared data. */
export const TAGS = {
  /** Provider listings, profiles and category counts. */
  providers: 'providers',
} as const;

/**
 * Invalidate public provider data after a change. Inside a server action the
 * next read is fresh immediately; elsewhere (route handlers) it refreshes in
 * the background.
 */
export function invalidateProviders(context: 'action' | 'route' = 'action') {
  if (context === 'action') updateTag(TAGS.providers);
  else revalidateTag(TAGS.providers, 'max');
}
