import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { setSession } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    // Validatie
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email en wachtwoord zijn verplicht' },
        { status: 400 }
      );
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
      return NextResponse.json(
        { error: 'Ongeldige inloggegevens' },
        { status: 401 }
      );
    }

    // Verify wachtwoord
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Ongeldige inloggegevens' },
        { status: 401 }
      );
    }

    // Maak session
    await setSession({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      providerId: user.provider?.id || null,
    });

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        providerId: user.provider?.id || null,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Er is iets misgegaan bij het inloggen' },
      { status: 500 }
    );
  }
}
