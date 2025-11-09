'use server';

import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { setSession } from '@/lib/auth';

interface LoginResult {
  success: boolean;
  error?: string;
  message?: string;
}

export async function loginAction(email: string, password: string): Promise<LoginResult> {
  try {
    // Validatie
    if (!email || !password) {
      return { success: false, error: 'Email en wachtwoord zijn verplicht' };
    }

    // Zoek user
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        provider: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!user || !user.password_hash) {
      return { success: false, error: 'Ongeldige inloggegevens' };
    }

    // Check account status
    if (user.status === 'SUSPENDED') {
      return { 
        success: false, 
        error: 'Account Geschorst',
        message: 'Je account is tijdelijk geschorst. Dit kan zijn vanwege een lopend onderzoek of verificatieproces. Neem contact op met support@eventify.nl voor meer informatie.'
      };
    }

    if (user.status === 'BANNED') {
      return { 
        success: false, 
        error: 'Account Verbannen',
        message: 'Je account is permanent verbannen van het platform vanwege schending van de gebruiksvoorwaarden. Deze beslissing is definitief.'
      };
    }

    // Verify wachtwoord
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      return { success: false, error: 'Ongeldige inloggegevens' };
    }

    // Maak session
    await setSession({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      status: user.status,
      providerId: user.provider?.id || null,
    });

    return { success: true };
  } catch (error) {
    console.error('Login action error:', error);
    return { success: false, error: 'Er is iets misgegaan. Probeer het opnieuw.' };
  }
}
