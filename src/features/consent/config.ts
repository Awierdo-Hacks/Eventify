/**
 * Cookie consent configuration. Pure data, shared by server and client.
 *
 * Bump CONSENT_VERSION whenever a category gains a new purpose or a new
 * third party: every visitor is then asked again.
 */
export const CONSENT_COOKIE = 'ev_consent';
export const CONSENT_VERSION = '2026-11';
/** Consent is asked again after six months. */
export const CONSENT_MAX_AGE = 60 * 60 * 24 * 182;

export interface ConsentChoice {
  analytics: boolean;
  marketing: boolean;
}

export interface ConsentState extends ConsentChoice {
  version: string;
  /** Random id that links this browser to its stored proof of consent. */
  visitorId: string;
  decidedAt: number;
}

export const CONSENT_CATEGORIES = [
  {
    key: 'necessary',
    title: 'Noodzakelijk',
    description:
      'Nodig om de website te laten werken: ingelogd blijven, beveiliging en het onthouden van deze cookiekeuze. Deze kun je niet uitzetten.',
    locked: true,
  },
  {
    key: 'analytics',
    title: 'Statistieken',
    description:
      'Helpen ons begrijpen hoe de website wordt gebruikt, zodat we ze kunnen verbeteren. Alleen actief als je hiervoor kiest.',
    locked: false,
  },
  {
    key: 'marketing',
    title: 'Marketing',
    description:
      'Maken het mogelijk om advertenties buiten Eventiphy af te stemmen op je interesses. Alleen actief als je hiervoor kiest.',
    locked: false,
  },
] as const;

export function parseConsent(raw: string | undefined): ConsentState | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(decodeURIComponent(raw)) as Partial<ConsentState>;
    if (
      parsed.version !== CONSENT_VERSION ||
      typeof parsed.analytics !== 'boolean' ||
      typeof parsed.marketing !== 'boolean' ||
      typeof parsed.visitorId !== 'string'
    ) {
      return null;
    }
    return {
      version: parsed.version,
      analytics: parsed.analytics,
      marketing: parsed.marketing,
      visitorId: parsed.visitorId,
      decidedAt: typeof parsed.decidedAt === 'number' ? parsed.decidedAt : 0,
    };
  } catch {
    return null;
  }
}
