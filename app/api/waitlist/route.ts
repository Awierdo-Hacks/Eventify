import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/middleware/auth';
import { checkRateLimit, getClientIp, rateLimitResponse } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  try {
    if (!(await checkRateLimit(`waitlist:${getClientIp(request)}`, 5, 60 * 60_000))) {
      return rateLimitResponse();
    }

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
    if (
      name.length > 200 ||
      email.length > 254 ||
      (phone !== undefined && phone !== null && (typeof phone !== 'string' || phone.length > 40)) ||
      (message !== undefined && message !== null && (typeof message !== 'string' || message.length > 2000)) ||
      (categories !== undefined && (!Array.isArray(categories) || categories.length > 20 || categories.some((c: unknown) => typeof c !== 'string')))
    ) {
      return NextResponse.json({ error: 'Ongeldige invoer.' }, { status: 400 });
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

// Waitlist contains personal data: admins only
export async function GET() {
  const { error } = await requireRole('ADMIN');
  if (error) return error;

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
