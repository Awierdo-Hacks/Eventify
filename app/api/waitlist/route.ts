import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const ANALYSE_KEY = 'Equarqoune2005';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, name, email, phone, categories, message } = body;

    if (!type || !['CUSTOMER', 'PROVIDER'].includes(type)) {
      return NextResponse.json({ error: 'Ongeldig type. Kies klant of dienstverlener.' }, { status: 400 });
    }
    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return NextResponse.json({ error: 'Naam is verplicht.' }, { status: 400 });
    }
    if (!email || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Geldig e-mailadres is verplicht.' }, { status: 400 });
    }
    if (type === 'PROVIDER' && (!categories || !Array.isArray(categories) || categories.length === 0)) {
      return NextResponse.json({ error: 'Selecteer minstens één dienst.' }, { status: 400 });
    }

    const entry = await prisma.waitlistEntry.create({
      data: {
        type,
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone?.trim() || null,
        categories: type === 'PROVIDER' ? categories : [],
        message: message?.trim() || null,
      },
    });

    return NextResponse.json({ success: true, id: entry.id }, { status: 201 });
  } catch (error) {
    console.error('Waitlist POST error:', error);
    return NextResponse.json({ error: 'Er is iets misgegaan. Probeer opnieuw.' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const key = request.headers.get('x-analyse-key');
  if (key !== ANALYSE_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const entries = await prisma.waitlistEntry.findMany({
      orderBy: { created_at: 'desc' },
    });
    return NextResponse.json({ entries });
  } catch (error) {
    console.error('Waitlist GET error:', error);
    return NextResponse.json({ error: 'Er is iets misgegaan.' }, { status: 500 });
  }
}
