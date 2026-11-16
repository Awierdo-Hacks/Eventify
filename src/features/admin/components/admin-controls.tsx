'use client';

import * as React from 'react';
import {
  BadgeCheck,
  Ban,
  Eye,
  EyeOff,
  MoreHorizontal,
  PauseCircle,
  PlayCircle,
  ShieldOff,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Field } from '@/components/ui/field';
import { Textarea } from '@/components/ui/input';
import { useAction } from '@/hooks/use-action';
import {
  eraseUserAction,
  moderateUserAction,
  resolveReportAction,
  setProviderVerifiedAction,
  setProviderVisibleAction,
} from '@/features/admin/actions';

const REASON_NOTE =
  'Laat de gebruiker per e-mail weten wat je beslist en waarom, en dat bezwaar mogelijk is. Dat is wettelijk verplicht.';

export function ProviderControls({
  providerId,
  name,
  verified,
  visible,
}: {
  providerId: string;
  name: string;
  verified: boolean;
  visible: boolean;
}) {
  const [confirm, setConfirm] = React.useState<'unverify' | 'hide' | null>(null);
  const verify = useAction(setProviderVerifiedAction, { onSuccess: () => setConfirm(null) });
  const visibility = useAction(setProviderVisibleAction, { onSuccess: () => setConfirm(null) });

  return (
    <div className="flex flex-wrap items-center gap-2">
      {!verified && (
        <Button
          size="sm"
          loading={verify.pending}
          onClick={() => verify.run({ providerId, verified: true })}
        >
          <BadgeCheck aria-hidden /> Verifiëren
        </Button>
      )}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon-sm" aria-label={`Meer acties voor ${name}`}>
            <MoreHorizontal aria-hidden />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          {visible ? (
            <DropdownMenuItem onSelect={() => setConfirm('hide')}>
              <EyeOff aria-hidden /> Profiel verbergen
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem onSelect={() => visibility.run({ providerId, visible: true })}>
              <Eye aria-hidden /> Profiel tonen
            </DropdownMenuItem>
          )}
          {verified && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem tone="danger" onSelect={() => setConfirm('unverify')}>
                <ShieldOff aria-hidden /> Verificatie intrekken
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <ConfirmDialog
        open={confirm === 'hide'}
        onOpenChange={(open) => !open && setConfirm(null)}
        title={`${name} verbergen?`}
        description={`Het profiel verdwijnt uit de zoekresultaten. ${REASON_NOTE}`}
        confirmLabel="Verbergen"
        tone="danger"
        pending={visibility.pending}
        onConfirm={() => visibility.run({ providerId, visible: false })}
      />
      <ConfirmDialog
        open={confirm === 'unverify'}
        onOpenChange={(open) => !open && setConfirm(null)}
        title={`Verificatie van ${name} intrekken?`}
        description={`Het profiel is daarna niet meer zichtbaar voor klanten. ${REASON_NOTE}`}
        confirmLabel="Intrekken"
        tone="danger"
        pending={verify.pending}
        onConfirm={() => verify.run({ providerId, verified: false })}
      />
    </div>
  );
}

type UserAction = 'suspend' | 'ban' | 'activate' | 'erase';

const USER_DIALOGS: Record<
  UserAction,
  { title: (name: string) => string; description: string; confirm: string; danger: boolean }
> = {
  suspend: {
    title: (name) => `${name} schorsen?`,
    description: `De gebruiker kan niet meer inloggen tot je het account weer activeert. ${REASON_NOTE}`,
    confirm: 'Schorsen',
    danger: true,
  },
  ban: {
    title: (name) => `${name} blokkeren?`,
    description: `De gebruiker verliest de toegang tot het platform. ${REASON_NOTE}`,
    confirm: 'Blokkeren',
    danger: true,
  },
  activate: {
    title: (name) => `${name} weer activeren?`,
    description: 'De gebruiker kan opnieuw inloggen en het platform gebruiken.',
    confirm: 'Activeren',
    danger: false,
  },
  erase: {
    title: (name) => `Account van ${name} verwijderen?`,
    description:
      'Alle persoonsgegevens worden gewist. Afgeronde boekingen en beoordelingen blijven anoniem bewaard. Dit kan niet ongedaan gemaakt worden.',
    confirm: 'Definitief verwijderen',
    danger: true,
  },
};

export function UserControls({
  userId,
  name,
  status,
}: {
  userId: string;
  name: string;
  status: string;
}) {
  const [action, setAction] = React.useState<UserAction | null>(null);
  const moderate = useAction(moderateUserAction, { onSuccess: () => setAction(null) });
  const erase = useAction(eraseUserAction, { onSuccess: () => setAction(null) });
  const dialog = action ? USER_DIALOGS[action] : null;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon-sm" aria-label={`Acties voor ${name}`}>
            <MoreHorizontal aria-hidden />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          {status !== 'ACTIVE' && (
            <DropdownMenuItem onSelect={() => setAction('activate')}>
              <PlayCircle aria-hidden /> Activeren
            </DropdownMenuItem>
          )}
          {status === 'ACTIVE' && (
            <DropdownMenuItem onSelect={() => setAction('suspend')}>
              <PauseCircle aria-hidden /> Schorsen
            </DropdownMenuItem>
          )}
          {status !== 'BANNED' && (
            <DropdownMenuItem onSelect={() => setAction('ban')}>
              <Ban aria-hidden /> Blokkeren
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem tone="danger" onSelect={() => setAction('erase')}>
            <Trash2 aria-hidden /> Account verwijderen
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {dialog && action && (
        <ConfirmDialog
          open
          onOpenChange={(open) => !open && setAction(null)}
          title={dialog.title(name)}
          description={dialog.description}
          confirmLabel={dialog.confirm}
          tone={dialog.danger ? 'danger' : 'default'}
          pending={moderate.pending || erase.pending}
          onConfirm={() =>
            action === 'erase' ? erase.run({ userId }) : moderate.run({ userId, action })
          }
        />
      )}
    </>
  );
}

export function ReportControls({ reportId }: { reportId: string }) {
  const [open, setOpen] = React.useState(false);
  const [resolution, setResolution] = React.useState('');
  const { run, pending } = useAction(resolveReportAction, { onSuccess: () => setOpen(false) });

  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)}>
        Afhandelen
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Melding afhandelen</DialogTitle>
            <DialogDescription>
              Leg vast wat je besliste en waarom. Breng de melder en, als je ingrijpt, de betrokken
              gebruiker op de hoogte van de beslissing en de reden.
            </DialogDescription>
          </DialogHeader>
          <DialogBody>
            <Field label="Beslissing en motivering" htmlFor="resolution">
              <Textarea
                id="resolution"
                value={resolution}
                onChange={(event) => setResolution(event.target.value)}
                rows={4}
                maxLength={1000}
              />
            </Field>
          </DialogBody>
          <DialogFooter>
            <Button
              variant="outline"
              loading={pending}
              onClick={() => run({ reportId, outcome: 'DISMISSED', resolution })}
            >
              Geen actie nodig
            </Button>
            <Button
              loading={pending}
              onClick={() => run({ reportId, outcome: 'ACTION_TAKEN', resolution })}
            >
              Actie ondernomen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
