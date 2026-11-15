'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main id="inhoud" className="flex min-h-[70dvh] flex-col items-center justify-center px-6 text-center">
      <h1 className="text-3xl font-extrabold text-ink-950">Er ging iets mis</h1>
      <p className="mt-2 max-w-md text-ink-600">
        Dat ligt aan ons, niet aan jou. Probeer het opnieuw; lukt het nog steeds niet, kom dan later even terug.
      </p>
      {error.digest && <p className="mt-2 text-xs text-ink-400">Referentie: {error.digest}</p>}
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button size="lg" onClick={reset}>
          Opnieuw proberen
        </Button>
        <Button asChild size="lg" variant="outline">
          <a href="/">Naar de startpagina</a>
        </Button>
      </div>
    </main>
  );
}
