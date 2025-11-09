'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Container } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { loginAction } from './actions';
import { useSession } from '@/components/providers/SessionProvider';

export default function LoginPage() {
  const router = useRouter();
  const { update } = useSession();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await loginAction(email, password);

      if (!result.success) {
        setError(result.error || 'Inloggen mislukt');
        setLoading(false);
      } else {
        await update(); // Refresh session
        router.push('/dashboard');
      }
    } catch (err) {
      setError('Er is iets misgegaan. Probeer het opnieuw.');
      setLoading(false);
    }
  };

  // Quick login buttons voor demo
  const quickLogin = async (demoEmail: string, demoPassword: string) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setLoading(true);
    setError('');
    
    const result = await loginAction(demoEmail, demoPassword);

    if (result.success) {
      await update(); // Refresh session
      router.push('/dashboard');
    } else {
      setLoading(false);
      setError(result.error || 'Inloggen mislukt');
    }
  };

  return (
    <Container className="min-h-screen flex items-center justify-center py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-amber-500 bg-clip-text text-transparent">
            Eventify
          </h1>
          <p className="mt-2 text-gray-600">Login om door te gaan</p>
        </div>

        <Card className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="jouw@email.nl"
                required
                disabled={loading}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Wachtwoord
              </label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                disabled={loading}
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Bezig met inloggen...' : 'Inloggen'}
            </Button>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Demo Accounts</span>
              </div>
            </div>

            <div className="mt-4 space-y-2">
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => quickLogin('admin@eventify.nl', 'password123')}
                disabled={loading}
              >
                👑 Login als Admin
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => quickLogin('sarah.jansen@example.com', 'password123')}
                disabled={loading}
              >
                👤 Login als Customer
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => quickLogin('info@culinairecreatiesamsterdam.nl', 'password123')}
                disabled={loading}
              >
                🏢 Login als Provider
              </Button>
            </div>
          </div>

          <div className="mt-6 text-center text-sm text-gray-600">
            Nog geen account?{' '}
            <Link href="/register" className="text-purple-600 hover:text-purple-700 font-medium">
              Registreer hier
            </Link>
          </div>
        </Card>
      </div>
    </Container>
  );
}
