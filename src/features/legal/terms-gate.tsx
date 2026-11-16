'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useAction } from '@/hooks/use-action';
import { logoutAction } from '@/features/auth/actions';
import { acceptCurrentTermsAction } from '@/features/legal/actions';

interface TermsGateProps {
  terms: { title: string; href: string; updatedLabel: string };
}

/**
 * Shown when the signed-in user has not accepted the current version of the
 * terms (accounts created before v2, or after the terms changed). It cannot
 * be dismissed: the choices are to accept or to log out.
 */
function TermsGate({ terms }: TermsGateProps) {
  const { run, pending } = useAction(acceptCurrentTermsAction);

  return (
    <Dialog open>
      <DialogContent
        hideClose
        onEscapeKeyDown={(event) => event.preventDefault()}
        onInteractOutside={(event) => event.preventDefault()}
      >
        <DialogHeader className="pr-6">
          <DialogTitle>Onze voorwaarden zijn bijgewerkt</DialogTitle>
          <DialogDescription>
            Om Eventiphy te blijven gebruiken vragen we je akkoord met de huidige versie (van{' '}
            {terms.updatedLabel}).
          </DialogDescription>
        </DialogHeader>
        <DialogBody>
          <ul className="space-y-2 text-sm">
            <li>
              <Link
                href={terms.href}
                target="_blank"
                className="font-semibold text-brand-700 underline underline-offset-2"
              >
                {terms.title}
              </Link>
            </li>
            <li>
              <Link
                href="/privacy"
                target="_blank"
                className="font-semibold text-brand-700 underline underline-offset-2"
              >
                Privacyverklaring
              </Link>{' '}
              <span className="text-ink-500">(ter informatie)</span>
            </li>
          </ul>
          <p className="mt-4 text-sm leading-relaxed text-ink-600">
            Ga je niet akkoord? Dan kun je uitloggen. Je account verwijderen kan via{' '}
            <Link
              href="/privacy#rechten"
              target="_blank"
              className="font-semibold underline underline-offset-2"
            >
              een verzoek aan ons
            </Link>
            .
          </p>
        </DialogBody>
        <DialogFooter>
          <Button variant="outline" onClick={() => void logoutAction()} disabled={pending}>
            Uitloggen
          </Button>
          <Button onClick={() => run(undefined)} loading={pending}>
            Ik ga akkoord
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export { TermsGate };
