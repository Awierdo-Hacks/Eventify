'use client';

import Link from 'next/link';
import { LayoutDashboard, LogOut, MessageSquare, Settings } from 'lucide-react';
import { Avatar } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { logoutAction } from '@/features/auth/actions';
import { ROLE_LABELS } from '@/lib/catalog';

interface UserMenuProps {
  user: { name: string; email: string; role: string };
  dashboardHref: string;
}

function UserMenu({ user, dashboardHref }: UserMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="rounded-full transition-shadow hover:ring-4 hover:ring-brand-100 data-[state=open]:ring-4 data-[state=open]:ring-brand-100"
        aria-label="Accountmenu openen"
      >
        <Avatar name={user.name} />
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuLabel>
          <span className="block truncate text-sm font-bold text-ink-950">{user.name}</span>
          <span className="block truncate">{user.email}</span>
          <span className="mt-1.5 inline-block rounded-full bg-brand-50 px-2 py-0.5 text-[0.6875rem] font-semibold text-brand-800">
            {ROLE_LABELS[user.role] ?? user.role}
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href={dashboardHref}>
            <LayoutDashboard aria-hidden /> Dashboard
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/messages">
            <MessageSquare aria-hidden /> Berichten
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/account">
            <Settings aria-hidden /> Account & privacy
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem tone="danger" onSelect={() => void logoutAction()}>
          <LogOut aria-hidden /> Uitloggen
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export { UserMenu };
