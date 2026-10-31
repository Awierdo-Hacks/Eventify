/**
 * Builds an all-day iCalendar (.ics) event and lets the browser download it,
 * so customers and providers can add a booking to their own calendar.
 */
function escapeIcs(text: string): string {
  return text.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');
}

function icsDate(date: Date): string {
  return date.toISOString().split('T')[0].replace(/-/g, '');
}

export function downloadIcs(params: { id: string; title: string; date: string; location?: string; description?: string }) {
  const start = new Date(params.date);
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  const stamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Eventiphy//Boeking//NL',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:${params.id}@eventiphy.be`,
    `DTSTAMP:${stamp}`,
    `DTSTART;VALUE=DATE:${icsDate(start)}`,
    `DTEND;VALUE=DATE:${icsDate(end)}`,
    `SUMMARY:${escapeIcs(params.title)}`,
    ...(params.location ? [`LOCATION:${escapeIcs(params.location)}`] : []),
    ...(params.description ? [`DESCRIPTION:${escapeIcs(params.description)}`] : []),
    'END:VEVENT',
    'END:VCALENDAR',
  ];

  const blob = new Blob([lines.join('\r\n')], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `eventiphy-${params.id}.ics`;
  a.click();
  URL.revokeObjectURL(url);
}
