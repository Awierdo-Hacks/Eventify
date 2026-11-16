import type { Metadata } from 'next';
import Link from 'next/link';
import { Briefcase, PartyPopper } from 'lucide-react';
import {
  CustomerRegisterForm,
  ProviderRegisterForm,
} from '@/features/auth/components/register-forms';
import { cn } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'Account aanmaken',
  description: 'Maak gratis een Eventiphy-account aan als klant of als dienstverlener.',
  alternates: { canonical: '/register' },
};

const TYPES = [
  {
    key: 'customer',
    href: '/register',
    icon: PartyPopper,
    label: 'Ik plan een event',
    hint: 'Klant',
  },
  {
    key: 'provider',
    href: '/register?type=provider',
    icon: Briefcase,
    label: 'Ik bied diensten aan',
    hint: 'Dienstverlener',
  },
] as const;

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const { type } = await searchParams;
  const active = type === 'provider' ? 'provider' : 'customer';

  return (
    <>
      <h1 className="text-3xl font-extrabold text-ink-950">Maak je account aan</h1>
      <p className="mt-2 text-ink-600">Gratis en in een paar minuten geregeld.</p>

      <nav aria-label="Soort account" className="mt-6 grid grid-cols-2 gap-2">
        {TYPES.map((option) => (
          <Link
            key={option.key}
            href={option.href}
            replace
            scroll={false}
            aria-current={active === option.key ? 'page' : undefined}
            className={cn(
              'flex flex-col gap-2 rounded-xl border p-4 transition-colors',
              active === option.key
                ? 'border-brand-600 bg-brand-50 ring-1 ring-brand-600'
                : 'border-ink-200 bg-surface hover:border-ink-300'
            )}
          >
            <option.icon
              className={cn('size-5', active === option.key ? 'text-brand-700' : 'text-ink-500')}
              aria-hidden
            />
            <span>
              <span className="block text-xs font-medium text-ink-500">{option.hint}</span>
              <span className="block text-sm font-bold text-ink-950">{option.label}</span>
            </span>
          </Link>
        ))}
      </nav>

      <div className="mt-8">
        {active === 'provider' ? <ProviderRegisterForm /> : <CustomerRegisterForm />}
      </div>

      <p className="mt-8 text-center text-sm text-ink-600">
        Heb je al een account?{' '}
        <Link href="/login" className="font-semibold text-brand-700 hover:underline">
          Log in
        </Link>
      </p>
    </>
  );
}
