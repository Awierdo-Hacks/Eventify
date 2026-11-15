import type { Metadata } from 'next';
import Link from 'next/link';
import { LoginForm } from '@/features/auth/components/login-form';
import { safeRedirectPath } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'Inloggen',
  robots: { index: false, follow: false },
};

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ redirect?: string }> }) {
  const { redirect } = await searchParams;
  const redirectTo = redirect ? safeRedirectPath(redirect, '') || undefined : undefined;

  return (
    <>
      <h1 className="text-3xl font-extrabold text-ink-950">Welkom terug</h1>
      <p className="mt-2 text-ink-600">
        {redirectTo ? 'Log in om verder te gaan.' : 'Log in om je events, offertes en berichten te bekijken.'}
      </p>
      <div className="mt-8">
        <LoginForm redirectTo={redirectTo} />
      </div>
      <p className="mt-8 text-center text-sm text-ink-600">
        Nog geen account?{' '}
        <Link href="/register" className="font-semibold text-brand-700 hover:underline">
          Maak er gratis een aan
        </Link>
      </p>
    </>
  );
}
