'use client';

import * as React from 'react';
import { FlaskConical, Loader2 } from 'lucide-react';
import { Avatar } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAction } from '@/hooks/use-action';
import { cn } from '@/lib/utils';
import { demoLoginAction } from '@/features/demo/actions';
import { DEMO_ACCOUNTS, type DemoAccountKey } from '@/features/demo/config';

interface DemoSwitcherProps {
  /** `floating`: round button in the corner of the screen. `inline`: sits in a toolbar. */
  variant?: 'floating' | 'inline';
  /** E-mail of the signed-in account, to mark the current one. */
  currentEmail?: string;
  className?: string;
}

/**
 * One-click login as a demo account. Rendered only when demo mode is enabled
 * for the deployment (the server decides; see features/demo/config.ts).
 */
function DemoSwitcher({ variant = 'floating', currentEmail, className }: DemoSwitcherProps) {
  const [chosen, setChosen] = React.useState<DemoAccountKey | null>(null);
  const { run, pending } = useAction(demoLoginAction);

  const choose = (key: DemoAccountKey) => {
    setChosen(key);
    run({ account: key });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Demo-accounts"
        title="Demo-accounts"
        className={cn(
          'flex items-center justify-center transition-[background-color,box-shadow,transform]',
          variant === 'floating'
            ? 'fixed bottom-5 right-5 z-40 size-12 rounded-full bg-brand-600 text-white shadow-lg ring-4 ring-white/25 hover:scale-105 hover:bg-brand-700 data-[state=open]:bg-brand-700'
            : 'size-9 rounded-lg text-ink-500 hover:bg-ink-100 hover:text-ink-900 data-[state=open]:bg-brand-50 data-[state=open]:text-brand-700',
          className
        )}
      >
        {pending ? (
          <Loader2 className="size-5 animate-spin" aria-hidden />
        ) : (
          <FlaskConical
            className={variant === 'floating' ? 'size-5' : 'size-[1.125rem]'}
            aria-hidden
          />
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent side="top" align="end" className="w-80">
        <DropdownMenuLabel>
          <span className="block text-sm font-bold text-ink-950">Demo-accounts</span>
          <span className="block">
            Log met één klik in om rond te kijken. Alleen zichtbaar in de testomgeving.
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {DEMO_ACCOUNTS.map((account) => {
          const current = account.email === currentEmail;
          return (
            <DropdownMenuItem
              key={account.key}
              disabled={pending || current}
              // Keep the menu open while logging in, so the spinner is visible.
              onSelect={(event) => {
                event.preventDefault();
                choose(account.key);
              }}
              className="items-start gap-3 py-2.5"
            >
              <Avatar name={account.name} size="sm" className="mt-0.5" />
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2 text-sm font-bold text-ink-950">
                  {account.name}
                  {current && (
                    <span className="rounded-full bg-success-100 px-1.5 py-0.5 text-[0.625rem] font-semibold text-success-800">
                      Nu ingelogd
                    </span>
                  )}
                </span>
                <span className="block text-xs font-semibold text-brand-700">{account.role}</span>
                <span className="block text-xs font-normal text-ink-600">
                  {account.description}
                </span>
              </span>
              {pending && chosen === account.key && (
                <Loader2 className="mt-1 !size-4 animate-spin !text-brand-600" aria-hidden />
              )}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export { DemoSwitcher };
