import { NextResponse } from 'next/server';
import { categoryLabel } from '@/lib/catalog';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/session';

/** Quote a CSV cell and defuse spreadsheet formulas (cells starting with = + - @). */
function cell(value: string | null | undefined): string {
  let text = value ?? '';
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}

/** Waitlist as CSV that opens directly in Excel (admin only). */
export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role !== 'ADMIN') return NextResponse.json({ error: 'Geen toegang.' }, { status: 403 });

  const entries = await db.waitlistEntry.findMany({ orderBy: { created_at: 'desc' } });
  const rows = [
    ['Naam', 'Type', 'E-mail', 'Telefoon', 'Diensten', 'Bericht', 'Aangemeld op'].map(cell).join(';'),
    ...entries.map((entry) =>
      [
        entry.name,
        entry.type === 'PROVIDER' ? 'Dienstverlener' : 'Klant',
        entry.email,
        entry.phone,
        entry.categories.map((category) => categoryLabel(category)).join(', '),
        entry.message,
        entry.created_at.toISOString().slice(0, 10),
      ]
        .map(cell)
        .join(';'),
    ),
  ];

  // BOM + semicolons: Excel with Belgian/Dutch settings opens this correctly.
  return new NextResponse(`﻿${rows.join('\r\n')}`, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="eventiphy-wachtlijst-${new Date().toISOString().slice(0, 10)}.csv"`,
      'Cache-Control': 'private, no-store',
    },
  });
}
