import localFont from 'next/font/local';

/**
 * Fonts are self-hosted: no request ever goes to a third-party font server,
 * which keeps visitor IP addresses out of other companies' logs (GDPR) and
 * removes a render-blocking round trip.
 *
 * Plus Jakarta Sans and Instrument Serif are both licensed under the SIL Open
 * Font License 1.1.
 */
export const fontSans = localFont({
  src: './plus-jakarta-sans-latin-wght-normal.woff2',
  weight: '200 800',
  style: 'normal',
  display: 'swap',
  variable: '--font-jakarta',
  fallback: ['ui-sans-serif', 'system-ui', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
});

export const fontSerif = localFont({
  src: [
    { path: './instrument-serif-latin-400-normal.woff2', weight: '400', style: 'normal' },
    { path: './instrument-serif-latin-400-italic.woff2', weight: '400', style: 'italic' },
  ],
  display: 'swap',
  variable: '--font-instrument',
  fallback: ['ui-serif', 'Georgia', 'Times New Roman', 'serif'],
});
