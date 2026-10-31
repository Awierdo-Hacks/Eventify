import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getSession, clearSession } from '@/lib/auth';

export async function GET() {
  try {
    // getSession() already verifies the user status in the database
    const session = await getSession();

    if (!session) {
      // Stale, suspended or banned session: remove the cookie
      const cookieStore = await cookies();
      if (cookieStore.get('session')) {
        await clearSession();
      }
      return NextResponse.json({ user: null });
    }

    return NextResponse.json({ user: session });
  } catch (error) {
    console.error('Session error:', error);
    return NextResponse.json({ user: null });
  }
}
