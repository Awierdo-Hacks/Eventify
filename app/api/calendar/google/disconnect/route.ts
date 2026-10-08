import { NextResponse } from 'next/server';
import { requireProvider } from '@/lib/middleware/auth';
import { disconnectGoogleCalendar } from '@/lib/googleCalendarSync';

export async function DELETE() {
  const { error, session } = await requireProvider();
  if (error) return error;

  try {
    await disconnectGoogleCalendar(session!.providerId!);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Google disconnect error:', err);
    return NextResponse.json({ error: 'Kon Google koppeling niet verwijderen' }, { status: 500 });
  }
}
