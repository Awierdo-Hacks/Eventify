import Image, { type ImageProps } from 'next/image';

/** Hosts whose images go through the built-in optimiser (see next.config.ts). */
const OPTIMISED_HOST = /\.public\.blob\.vercel-storage\.com$/;

function isOptimisable(src: ImageProps['src']): boolean {
  if (typeof src !== 'string') return true;
  if (src.startsWith('/')) return true;
  try {
    return OPTIMISED_HOST.test(new URL(src).hostname);
  } catch {
    return false;
  }
}

/**
 * `next/image` for user-supplied pictures. Images on our own storage are
 * resized and converted; any other address (older profiles may point
 * elsewhere) is shown as-is, so the optimiser can never be used as an open
 * proxy for arbitrary URLs.
 */
function SmartImage({ alt, ...props }: ImageProps) {
  return (
    <Image alt={alt} {...props} unoptimized={props.unoptimized ?? !isOptimisable(props.src)} />
  );
}

export { SmartImage };
