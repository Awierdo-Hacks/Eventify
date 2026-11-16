'use client';

import * as React from 'react';
import Link from 'next/link';
import { Dialog as DialogPrimitive } from 'radix-ui';
import { Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/ui/logo';
import { logoutAction } from '@/features/auth/actions';

interface MobileNavProps {
  links: Array<{ href: string; label: string }>;
  signedIn: boolean;
  dashboardHref: string;
}

/** Full-height slide-over menu for small screens. */
function MobileNav({ links, signedIn, dashboardHref }: MobileNavProps) {
  const [open, setOpen] = React.useState(false);
  const close = () => setOpen(false);

  return (
    <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
      <DialogPrimitive.Trigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden" aria-label="Menu openen">
          <Menu aria-hidden />
        </Button>
      </DialogPrimitive.Trigger>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-ink-950/45 data-[state=open]:animate-overlay-in data-[state=closed]:animate-overlay-out" />
        <DialogPrimitive.Content className="fixed inset-y-0 right-0 z-50 flex w-[min(22rem,100vw)] flex-col bg-surface shadow-lg focus:outline-none data-[state=open]:animate-fade-in">
          <div className="flex h-16 items-center justify-between border-b border-ink-100 px-4">
            <DialogPrimitive.Title asChild>
              <Link href="/" onClick={close} aria-label="Eventiphy, naar de startpagina">
                <Logo />
              </Link>
            </DialogPrimitive.Title>
            <DialogPrimitive.Close asChild>
              <Button variant="ghost" size="icon" aria-label="Menu sluiten">
                <X aria-hidden />
              </Button>
            </DialogPrimitive.Close>
          </div>
          <nav aria-label="Hoofdmenu" className="flex-1 overflow-y-auto p-4">
            <ul className="space-y-1">
              {links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    onClick={close}
                    className="block rounded-lg px-3 py-3 text-base font-semibold text-ink-900 hover:bg-ink-100"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <div className="space-y-2 border-t border-ink-100 p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
            {signedIn ? (
              <>
                <Button asChild size="lg" className="w-full">
                  <Link href={dashboardHref} onClick={close}>
                    Naar mijn dashboard
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full"
                  onClick={() => void logoutAction()}
                >
                  Uitloggen
                </Button>
              </>
            ) : (
              <>
                <Button asChild size="lg" className="w-full">
                  <Link href="/register" onClick={close}>
                    Gratis account aanmaken
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="w-full">
                  <Link href="/login" onClick={close}>
                    Inloggen
                  </Link>
                </Button>
              </>
            )}
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

export { MobileNav };
