import 'server-only';
import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';

/**
 * Fetch a user-supplied URL without letting it reach internal services
 * (SSRF). Only https, only public IP addresses, redirects re-checked hop by
 * hop, with a time and size limit.
 */
export class UnsafeUrlError extends Error {}

function isPrivateAddress(address: string): boolean {
  if (isIP(address) === 4) {
    const [a = 0, b = 0] = address.split('.').map(Number);
    return (
      a === 0 || a === 10 || a === 127 || (a === 100 && b >= 64 && b <= 127) || (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 192 && b === 0) || (a === 198 && (b === 18 || b === 19)) || a >= 224
    );
  }
  const lower = address.toLowerCase();
  if (lower === '::1' || lower === '::') return true;
  if (lower.startsWith('fc') || lower.startsWith('fd') || lower.startsWith('fe80')) return true;
  if (lower.startsWith('::ffff:')) return isPrivateAddress(lower.slice(7));
  return false;
}

export function normalizeCalendarUrl(input: string): URL {
  let url: URL;
  try {
    url = new URL(input.trim().replace(/^webcal:\/\//i, 'https://'));
  } catch {
    throw new UnsafeUrlError('Dit is geen geldige URL.');
  }
  if (url.protocol !== 'https:') throw new UnsafeUrlError('Gebruik een beveiligde link die begint met https://.');
  if (url.username || url.password) throw new UnsafeUrlError('Links met een gebruikersnaam of wachtwoord worden niet ondersteund.');
  return url;
}

async function assertPublicHost(url: URL) {
  const host = url.hostname.replace(/^\[|\]$/g, '');
  const addresses = isIP(host) ? [{ address: host }] : await lookup(host, { all: true }).catch(() => []);
  if (addresses.length === 0) throw new UnsafeUrlError('Dit adres is niet bereikbaar.');
  if (addresses.some(({ address }) => isPrivateAddress(address))) {
    throw new UnsafeUrlError('Dit adres is niet toegestaan.');
  }
}

const MAX_BYTES = 5 * 1024 * 1024;

export async function safeFetchText(
  input: string,
  headers: Record<string, string> = {},
): Promise<{ status: number; text: string; etag: string | null }> {
  let url = normalizeCalendarUrl(input);

  for (let hop = 0; hop < 4; hop++) {
    await assertPublicHost(url);
    const response = await fetch(url, {
      headers: { Accept: 'text/calendar, text/plain;q=0.8', ...headers },
      redirect: 'manual',
      signal: AbortSignal.timeout(10_000),
      cache: 'no-store',
    });

    if (response.status >= 300 && response.status < 400 && response.status !== 304) {
      const location = response.headers.get('location');
      if (!location) throw new UnsafeUrlError('De link verwijst door zonder doel.');
      url = normalizeCalendarUrl(new URL(location, url).toString());
      continue;
    }

    if (response.status === 304 || !response.ok) return { status: response.status, text: '', etag: null };

    const length = Number(response.headers.get('content-length') ?? 0);
    if (length > MAX_BYTES) throw new UnsafeUrlError('Deze kalender is te groot.');
    const buffer = await response.arrayBuffer();
    if (buffer.byteLength > MAX_BYTES) throw new UnsafeUrlError('Deze kalender is te groot.');
    return { status: response.status, text: new TextDecoder().decode(buffer), etag: response.headers.get('etag') };
  }
  throw new UnsafeUrlError('De link verwijst te vaak door.');
}
