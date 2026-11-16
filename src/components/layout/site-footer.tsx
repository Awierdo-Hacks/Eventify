import Link from 'next/link';
import { Mail, Phone } from 'lucide-react';
import { Logo } from '@/components/ui/logo';
import { companyAddressLine, companyDisplayName, site } from '@/config/site';
import { CookieSettingsButton } from '@/features/consent/consent-provider';
import { CATEGORIES, FEATURED_CATEGORY_SLUGS } from '@/lib/catalog';

const linkClass = 'text-sm text-ink-300 transition-colors hover:text-white';

const COLUMNS = [
  {
    title: 'Ontdekken',
    links: [
      { href: '/browse', label: 'Alle dienstverleners' },
      ...FEATURED_CATEGORY_SLUGS.slice(0, 5).map((slug) => ({
        href: `/browse?category=${slug}`,
        label: CATEGORIES.find((category) => category.slug === slug)?.label ?? slug,
      })),
    ],
  },
  {
    title: 'Eventiphy',
    links: [
      { href: '/about', label: 'Over ons' },
      { href: '/#hoe-het-werkt', label: 'Hoe het werkt' },
      { href: '/voor-dienstverleners', label: 'Voor dienstverleners' },
      { href: '/waitlist', label: 'Wachtlijst' },
      { href: '/about#contact', label: 'Contact' },
    ],
  },
  {
    title: 'Juridisch',
    links: [
      { href: '/voorwaarden', label: 'Voorwaarden' },
      { href: '/privacy', label: 'Privacyverklaring' },
      { href: '/cookies', label: 'Cookiebeleid' },
      { href: '/melden', label: 'Inhoud melden' },
    ],
  },
];

function SiteFooter() {
  const address = companyAddressLine();
  const { enterpriseNumber, vatNumber } = site.company;

  return (
    <footer className="mt-24 bg-ink-950 text-white">
      <div className="container-page grid gap-12 py-14 lg:grid-cols-[1.4fr_repeat(3,1fr)]">
        <div className="space-y-5">
          <Logo inverted />
          <p className="max-w-xs text-sm leading-relaxed text-ink-300">
            Eén plek om de juiste mensen voor je evenement te vinden, offertes te vergelijken en
            alles vast te leggen.
          </p>
          <ul className="space-y-2">
            <li>
              <a
                href={`mailto:${site.contact.email}`}
                className={`${linkClass} inline-flex items-center gap-2`}
              >
                <Mail className="size-4" aria-hidden /> {site.contact.email}
              </a>
            </li>
            <li>
              <a
                href={site.contact.phoneHref}
                className={`${linkClass} inline-flex items-center gap-2`}
              >
                <Phone className="size-4" aria-hidden /> {site.contact.phone}
              </a>
            </li>
          </ul>
        </div>

        {COLUMNS.map((column) => (
          <nav key={column.title} aria-label={column.title}>
            <h2 className="text-sm font-bold text-white">{column.title}</h2>
            <ul className="mt-4 space-y-2.5">
              {column.links.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className={linkClass}>
                    {link.label}
                  </Link>
                </li>
              ))}
              {column.title === 'Juridisch' && (
                <li>
                  <CookieSettingsButton className={linkClass} />
                </li>
              )}
            </ul>
          </nav>
        ))}
      </div>

      <div className="border-t border-white/10">
        <div className="container-page flex flex-col gap-2 py-6 text-xs text-ink-400 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} {companyDisplayName()}
            {address && ` · ${address}`}
            {enterpriseNumber && ` · KBO ${enterpriseNumber}`}
            {vatNumber && ` · Btw ${vatNumber}`}
          </p>
          <p>Gemaakt in Antwerpen</p>
        </div>
      </div>
    </footer>
  );
}

export { SiteFooter };
