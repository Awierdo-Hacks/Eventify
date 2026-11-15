import Link from 'next/link';
import { BadgeCheck } from 'lucide-react';
import { Logo } from '@/components/ui/logo';

const POINTS = [
  'Gecontroleerde dienstverleners in heel België',
  'Offertes overzichtelijk naast elkaar',
  'Je hele event in één overzicht',
];

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[1fr_30rem] xl:grid-cols-[1fr_36rem]">
      <div className="flex flex-col">
        <header className="container-page flex h-16 items-center justify-between">
          <Link href="/" aria-label="Eventiphy, naar de startpagina" className="rounded-lg">
            <Logo />
          </Link>
          <Link href="/browse" className="text-sm font-semibold text-ink-600 hover:text-ink-950">
            Dienstverleners bekijken
          </Link>
        </header>
        <main id="inhoud" className="flex flex-1 items-start justify-center px-4 py-8 sm:items-center sm:px-6 sm:py-12">
          <div className="w-full max-w-md">{children}</div>
        </main>
      </div>

      <aside className="relative hidden overflow-hidden bg-ink-950 p-12 text-white lg:flex lg:flex-col lg:justify-end" aria-hidden>
        <div className="pointer-events-none absolute -right-24 -top-24 size-[28rem] rounded-full bg-brand-600/50 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -left-20 size-96 rounded-full bg-sun-500/30 blur-3xl" />
        <div className="relative">
          <p className="text-4xl font-extrabold leading-tight xl:text-5xl">
            Van idee tot{' '}
            <span className="font-serif font-normal italic text-sun-300">onvergetelijk</span> feest.
          </p>
          <ul className="mt-8 space-y-3 text-ink-200">
            {POINTS.map((point) => (
              <li key={point} className="flex items-center gap-3">
                <BadgeCheck className="size-5 shrink-0 text-sun-300" />
                {point}
              </li>
            ))}
          </ul>
        </div>
      </aside>
    </div>
  );
}
