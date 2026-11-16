import { NextResponse } from 'next/server';
import { rateLimit } from '@/lib/rate-limit';
import { getCurrentUser } from '@/lib/session';
import { exportAccountData } from '@/features/account/export';

/** Download a copy of your own data as JSON. */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Niet ingelogd.' }, { status: 401 });
  if (!rateLimit(`export:${user.id}`, 5, 60 * 60_000).allowed) {
    return NextResponse.json(
      { error: 'Te veel verzoeken. Probeer het later opnieuw.' },
      { status: 429 }
    );
  }

  const data = await exportAccountData(user.id);
  const date = new Date().toISOString().slice(0, 10);
  return new NextResponse(JSON.stringify(data, null, 2), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Disposition': `attachment; filename="eventiphy-gegevens-${date}.json"`,
      'Cache-Control': 'private, no-store',
    },
  });
}
