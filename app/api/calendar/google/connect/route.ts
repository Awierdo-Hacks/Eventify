import { NextResponse } from 'next/server';
import { requireProvider } from '@/lib/middleware/auth';
import { getGoogleAuthUrl } from '@/lib/googleCalendarSync';

export async function GET() {
  const { error, session } = await requireProvider();
  if (error) return error;

  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_REDIRECT_URI) {
    return NextResponse.json(
      { error: 'Google Calendar integratie is nog niet geconfigureerd' },
      { status: 503 }
    );
  }

  const state = session!.providerId!;
  const url = getGoogleAuthUrl(state);
  return NextResponse.redirect(url);
}
