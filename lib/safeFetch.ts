import { lookup } from "dns/promises";
import { isIP } from "net";

const MAX_REDIRECTS = 3;
const DEFAULT_TIMEOUT_MS = 10_000;
const DEFAULT_MAX_BYTES = 5 * 1024 * 1024;

function isPrivateIPv4(ip: string): boolean {
  const [a, b] = ip.split(".").map(Number);
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 100 && b >= 64 && b <= 127) || // carrier-grade NAT
    (a === 169 && b === 254) || // link-local / cloud metadata
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 192 && b === 0) ||
    (a === 198 && (b === 18 || b === 19)) ||
    a >= 224 // multicast & reserved
  );
}

function isPrivateIP(ip: string): boolean {
  if (isIP(ip) === 4) return isPrivateIPv4(ip);
  const lower = ip.toLowerCase();
  if (lower.startsWith("::ffff:")) return isPrivateIPv4(lower.slice(7));
  return (
    lower === "::" ||
    lower === "::1" ||
    lower.startsWith("fc") ||
    lower.startsWith("fd") ||
    lower.startsWith("fe80") ||
    lower.startsWith("ff")
  );
}

/** Normalises user input (webcal:// → https://) and rejects non-http(s) URLs. */
export function normalizeExternalUrl(raw: string): URL {
  const url = new URL(raw.trim().replace(/^webcals?:\/\//i, "https://"));
  if (url.protocol !== "https:" && url.protocol !== "http:") {
    throw new Error("Alleen http(s) of webcal adressen zijn toegestaan");
  }
  if (url.username || url.password) {
    throw new Error("URL mag geen inloggegevens bevatten");
  }
  return url;
}

async function assertPublicHost(url: URL): Promise<void> {
  const host = url.hostname.replace(/^\[|\]$/g, "");
  if (host === "localhost" || host.endsWith(".localhost") || host.endsWith(".internal")) {
    throw new Error("Dit adres is niet toegestaan");
  }
  const addresses = isIP(host) ? [{ address: host }] : await lookup(host, { all: true });
  if (addresses.length === 0 || addresses.some((a) => isPrivateIP(a.address))) {
    throw new Error("Dit adres is niet toegestaan");
  }
}

/**
 * fetch() for user-supplied URLs (e.g. iCal feeds): blocks private/internal
 * addresses (also after redirects), enforces a timeout and caps the body size.
 */
export async function safeFetch(
  rawUrl: string,
  init: { method?: "GET" | "HEAD"; headers?: Record<string, string>; timeoutMs?: number; maxBytes?: number } = {}
): Promise<{ status: number; ok: boolean; headers: Headers; text: () => Promise<string> }> {
  const { method = "GET", headers, timeoutMs = DEFAULT_TIMEOUT_MS, maxBytes = DEFAULT_MAX_BYTES } = init;
  let url = normalizeExternalUrl(rawUrl);

  for (let redirects = 0; ; redirects++) {
    await assertPublicHost(url);

    const res = await fetch(url, {
      method,
      headers,
      redirect: "manual",
      signal: AbortSignal.timeout(timeoutMs),
    });

    const location = res.headers.get("location");
    if (res.status >= 300 && res.status < 400 && res.status !== 304 && location) {
      if (redirects >= MAX_REDIRECTS) throw new Error("Te veel doorverwijzingen");
      url = normalizeExternalUrl(new URL(location, url).toString());
      continue;
    }

    return {
      status: res.status,
      ok: res.ok,
      headers: res.headers,
      text: async () => {
        const declared = Number(res.headers.get("content-length") ?? 0);
        if (declared > maxBytes) throw new Error("Bestand is te groot");
        if (!res.body) return "";

        const reader = res.body.getReader();
        const chunks: Uint8Array[] = [];
        let received = 0;
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          received += value.byteLength;
          if (received > maxBytes) {
            await reader.cancel();
            throw new Error("Bestand is te groot");
          }
          chunks.push(value);
        }
        return Buffer.concat(chunks).toString("utf8");
      },
    };
  }
}
