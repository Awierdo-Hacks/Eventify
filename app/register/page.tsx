'use client';

import Link from 'next/link';
import { Container } from '@/components/layout';
import RegistrationWizard from '@/components/auth/registration/RegistrationWizard';

export default function RegisterPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <Container className="py-8 sm:py-12">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-amber-500 bg-clip-text text-transparent">
              Eventiphy
            </h1>
          </Link>
          <p className="mt-2 text-gray-600">Maak een gratis account aan</p>
        </div>

        {/* Registration Wizard */}
        <RegistrationWizard />

        {/* Login Link */}
        <div className="text-center mt-8">
          <p className="text-sm text-gray-600">
            Heb je al een account?{' '}
            <Link href="/login" className="text-purple-600 hover:text-purple-700 font-medium">
              Log in
            </Link>
          </p>
        </div>
      </Container>
    </main>
  );
}
