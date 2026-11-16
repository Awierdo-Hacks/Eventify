import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/ui/logo';

export default function NotFound() {
  return (
    <main
      id="inhoud"
      className="bg-hero-wash flex min-h-dvh flex-col items-center justify-center px-6 text-center"
    >
      <Link href="/" aria-label="Eventiphy, naar de startpagina">
        <Logo />
      </Link>
      <p className="mt-10 font-serif text-7xl italic text-brand-300">404</p>
      <h1 className="mt-2 text-3xl font-extrabold text-ink-950">Deze pagina bestaat niet</h1>
      <p className="mt-2 max-w-md text-ink-600">
        De link klopt niet of de pagina is verplaatst. Vanaf de startpagina vind je alles terug.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button asChild size="lg">
          <Link href="/">Naar de startpagina</Link>
        </Button>
        <Button asChild size="lg" variant="outline">
          <Link href="/browse">Dienstverleners zoeken</Link>
        </Button>
      </div>
    </main>
  );
}
