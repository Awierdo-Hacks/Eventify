import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/ui/logo';
import { MobileNav } from '@/components/layout/mobile-nav';
import { UserMenu } from '@/components/layout/user-menu';
import { getCurrentUser } from '@/lib/session';
import { dashboardPathFor } from '@/lib/session-token';

const NAV_LINKS = [
  { href: '/browse', label: 'Ontdekken' },
  { href: '/#hoe-het-werkt', label: 'Hoe het werkt' },
  { href: '/voor-dienstverleners', label: 'Voor dienstverleners' },
  { href: '/about', label: 'Over ons' },
];

/** Public site header. Rendered on the server: no flash of signed-out state. */
async function SiteHeader() {
  const user = await getCurrentUser();
  const dashboardHref = user ? dashboardPathFor(user.role) : '/dashboard';

  return (
    <header className="sticky top-0 z-40 border-b border-ink-200/70 bg-canvas/85 backdrop-blur-md">
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <div className="flex items-center gap-8">
          <Link href="/" aria-label="Eventiphy, naar de startpagina" className="rounded-lg">
            <Logo />
          </Link>
          <nav aria-label="Hoofdmenu" className="hidden md:block">
            <ul className="flex items-center gap-1">
              {NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="rounded-lg px-3 py-2 text-sm font-semibold text-ink-700 transition-colors hover:bg-ink-100 hover:text-ink-950"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="flex items-center gap-2">
          {user ? (
            <>
              <Button asChild variant="outline" size="sm" className="hidden sm:inline-flex">
                <Link href={dashboardHref}>Dashboard</Link>
              </Button>
              <UserMenu user={user} dashboardHref={dashboardHref} />
            </>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
                <Link href="/login">Inloggen</Link>
              </Button>
              <Button asChild size="sm">
                <Link href="/register">Aan de slag</Link>
              </Button>
            </>
          )}
          <MobileNav links={NAV_LINKS} signedIn={Boolean(user)} dashboardHref={dashboardHref} />
        </div>
      </div>
    </header>
  );
}

export { SiteHeader };
