import { NextResponse } from 'next/server';
import { eventTemplates } from '@/lib/eventHelpers';

// GET - List all event templates
export async function GET() {
  try {
    return NextResponse.json({
      templates: eventTemplates,
    });
  } catch (error) {
    console.error('Error fetching templates:', error);
    return NextResponse.json(
      { error: 'Failed to fetch templates' },
      { status: 500 }
    );
  }
}
