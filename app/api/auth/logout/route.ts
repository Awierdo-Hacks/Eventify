import { NextResponse } from 'next/server';
import { clearSession } from '@/lib/auth';

export async function POST() {
  try {
    await clearSession();
    
    return NextResponse.json({
      success: true,
      message: 'Uitgelogd',
    });
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: 'Er is iets misgegaan bij het uitloggen' },
      { status: 500 }
    );
  }
}
