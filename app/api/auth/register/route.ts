import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { UserRole } from '@prisma/client';

export async function POST(request: Request) {
  try {
    const { name, email, password } = await request.json();

    // Validatie
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Alle velden zijn verplicht' },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Wachtwoord moet minimaal 8 karakters zijn' },
        { status: 400 }
      );
    }

    // Check of email al bestaat
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Dit email adres is al in gebruik' },
        { status: 400 }
      );
    }

    // Hash wachtwoord
    const hashedPassword = await bcrypt.hash(password, 10);

    // Maak user aan
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password_hash: hashedPassword,
        role: UserRole.CUSTOMER,
      },
    });

    return NextResponse.json(
      {
        message: 'Account succesvol aangemaakt',
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Register error:', error);
    return NextResponse.json(
      { error: 'Er is iets misgegaan bij het aanmaken van je account' },
      { status: 500 }
    );
  }
}
