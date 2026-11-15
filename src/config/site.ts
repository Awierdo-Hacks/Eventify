/**
 * Brand and company details. This is the single place to edit them: the
 * footer, legal pages, metadata and structured data all read from here.
 *
 * Values marked TODO must be completed before launch (see README).
 */
export const site = {
  name: 'Eventiphy',
  tagline: 'Jouw droomfeest begint hier',
  description:
    'Vind en boek geverifieerde fotografen, dj’s, cateraars, locaties en meer voor jouw evenement. Vergelijk offertes en regel alles op één plek.',
  url: (process.env.NEXT_PUBLIC_APP_URL ?? 'https://eventiphy.be').replace(/\/$/, ''),
  locale: 'nl_BE',
  language: 'nl-BE',

  company: {
    /** Legal entity name as registered in the KBO. TODO */
    legalName: 'Eventiphy',
    /** Legal form, e.g. "BV". TODO */
    legalForm: '',
    /** KBO / enterprise number, e.g. "0123.456.789". TODO */
    enterpriseNumber: '',
    /** VAT number, e.g. "BE 0123.456.789". TODO */
    vatNumber: '',
    /** Registered office. TODO: full street address */
    address: {
      street: '',
      postalCode: '',
      city: 'Antwerpen',
      country: 'België',
    },
    /** Competent court district for disputes. */
    courtDistrict: 'Antwerpen',
  },

  contact: {
    email: 'info@eventiphy.be',
    /** Mailbox for privacy requests (access, erasure, …). */
    privacyEmail: 'privacy@eventiphy.be',
    /** Mailbox for reports of illegal content (DSA contact point). */
    legalEmail: 'legal@eventiphy.be',
    supportEmail: 'support@eventiphy.be',
    phone: '+32 486 71 47 88',
    phoneHref: 'tel:+32486714788',
  },

  social: {
    instagram: 'https://www.instagram.com/eventiphy.be',
  },
} as const;

/** One-line postal address, skipping parts that are not filled in yet. */
export function companyAddressLine(): string {
  const { street, postalCode, city, country } = site.company.address;
  return [street, [postalCode, city].filter(Boolean).join(' '), country].filter(Boolean).join(', ');
}

export function companyDisplayName(): string {
  const { legalName, legalForm } = site.company;
  return [legalName, legalForm].filter(Boolean).join(' ');
}
