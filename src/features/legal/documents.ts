/**
 * Legal documents and their current versions.
 *
 * When the substance of a document changes, bump its `version` (use the date
 * it takes effect). Signed-in users are then asked to accept the new version
 * the next time they use the platform, and that acceptance is stored.
 */
export type LegalDocumentKey = 'terms-customer' | 'terms-provider' | 'privacy';

export interface LegalDocument {
  key: LegalDocumentKey;
  title: string;
  href: string;
  version: string;
  /** Shown as "Laatst bijgewerkt". */
  updatedLabel: string;
}

export const LEGAL_DOCUMENTS: Record<LegalDocumentKey, LegalDocument> = {
  'terms-customer': {
    key: 'terms-customer',
    title: 'Gebruiksvoorwaarden voor klanten',
    href: '/voorwaarden/klanten',
    version: '2026-11-15',
    updatedLabel: '15 november 2026',
  },
  'terms-provider': {
    key: 'terms-provider',
    title: 'Voorwaarden voor dienstverleners',
    href: '/voorwaarden/dienstverleners',
    version: '2026-11-15',
    updatedLabel: '15 november 2026',
  },
  privacy: {
    key: 'privacy',
    title: 'Privacyverklaring',
    href: '/privacy',
    version: '2026-11-15',
    updatedLabel: '15 november 2026',
  },
};

export const COOKIE_POLICY = {
  title: 'Cookiebeleid',
  href: '/cookies',
  updatedLabel: '15 november 2026',
};

/** The terms a role must accept. Admins are staff and accept none. */
export function termsFor(role: string): LegalDocument | null {
  if (role === 'CUSTOMER') return LEGAL_DOCUMENTS['terms-customer'];
  if (role === 'PROVIDER') return LEGAL_DOCUMENTS['terms-provider'];
  return null;
}
