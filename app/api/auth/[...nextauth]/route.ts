// Legacy route - not used. We use JWT auth via /api/auth/login
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ 
    error: 'Not implemented - use /api/auth/login instead' 
  }, { status: 404 });
}

export async function POST() {
  return NextResponse.json({ 
    error: 'Not implemented - use /api/auth/login instead' 
  }, { status: 404 });
}
