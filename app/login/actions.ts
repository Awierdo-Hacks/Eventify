'use server';

import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { headers } from 'next/headers';
import { setSession } from '@/lib/auth';
import { checkRateLimit } from '@/lib/rate-limit';

interface LoginResult {
  success: boolean;
  error?: string;
  message?: string;
  role?: string;
}

export async function loginAction(email: string, password: string): Promise<LoginResult> {
  try {
    // Validatie
    if (!email || !password || typeof email !== 'string' || typeof password !== 'string') {
      return { success: false, error: 'Email en wachtwoord zijn verplicht' };
    }

    const normalizedEmail = email.trim().toLowerCase();
    const headerList = await headers();
    const ip = headerList.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const allowed =
      (await checkRateLimit(`login:ip:${ip}`, 20, 15 * 60_000)) &&
      (await checkRateLimit(`login:email:${normalizedEmail}`, 8, 15 * 60_000));
    if (!allowed) {
      return { success: false, error: 'Te veel inlogpogingen. Probeer het over 15 minuten opnieuw.' };
    }

    // Zoek user
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
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

    // Verify wachtwoord
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      return { success: false, error: 'Ongeldige inloggegevens' };
    }

    // Check account status (only after a correct password, so blocked accounts can't be probed)
    if (user.status === 'SUSPENDED') {
      return { 
        success: false, 
        error: 'Account Geschorst',
        message: 'Je account is tijdelijk geschorst. Dit kan zijn vanwege een lopend onderzoek of verificatieproces. Neem contact op met support@eventiphy.nl voor meer informatie.'
      };
    }

    if (user.status === 'BANNED') {
      return { 
        success: false, 
        error: 'Account Verbannen',
        message: 'Je account is permanent verbannen van het platform vanwege schending van de gebruiksvoorwaarden. Deze beslissing is definitief.'
      };
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

    return { success: true, role: user.role };
  } catch (error) {
    console.error('Login action error:', error);
    return { success: false, error: 'Er is iets misgegaan. Probeer het opnieuw.' };
  }
}
