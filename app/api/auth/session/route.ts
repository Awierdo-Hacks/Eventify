import { NextResponse } from 'next/server';
import { getSession, clearSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getSession();
    
    if (!session) {
      return NextResponse.json({ user: null });
    }
    
    // Verify user status in database
    const user = await prisma.user.findUnique({
      where: { id: session.id },
      select: { status: true },
    });
    
    // If user is suspended or banned, clear session
    if (!user || user.status !== 'ACTIVE') {
      await clearSession();
      return NextResponse.json({ user: null });
    }
    
    return NextResponse.json({ user: session });
  } catch (error) {
    console.error('Session error:', error);
    return NextResponse.json({ user: null });
  }
}
