'use server';

import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { setSession } from '@/lib/auth';

export async function loginAction(email: string, password: string) {
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
      providerId: user.provider?.id || null,
    });

    return { success: true };
  } catch (error) {
    console.error('Login action error:', error);
    return { success: false, error: 'Er is iets misgegaan. Probeer het opnieuw.' };
  }
}
