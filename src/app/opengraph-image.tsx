import { ImageResponse } from 'next/og';
import { site } from '@/config/site';

export const alt = `${site.name} — ${site.tagline}`;
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

/** Social sharing image, generated from markup so it always matches the brand. */
export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: 72,
          background: 'linear-gradient(135deg, #17111f 0%, #3b0764 55%, #9333ea 100%)',
          color: 'white',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <svg width="64" height="64" viewBox="0 0 32 32">
            <defs>
              <linearGradient id="pin" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#c084fc" />
                <stop offset="40%" stopColor="#a855f7" />
                <stop offset="100%" stopColor="#f59e0b" />
              </linearGradient>
            </defs>
            <path d="M16 2C10.5 2 6 6.2 6 11.2C6 18.5 16 30 16 30S26 18.5 26 11.2C26 6.2 21.5 2 16 2Z" fill="url(#pin)" />
            <path d="M16 6 L17.5 11 L22 12.5 L17.5 14 L16 19 L14.5 14 L10 12.5 L14.5 11 Z" fill="white" />
          </svg>
          <div style={{ fontSize: 44, fontWeight: 800, letterSpacing: -1 }}>{site.name}</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div style={{ fontSize: 84, fontWeight: 800, lineHeight: 1.05, letterSpacing: -3 }}>{site.tagline}</div>
          <div style={{ fontSize: 34, color: '#e9d5ff', maxWidth: 900, lineHeight: 1.3 }}>
            Vind geverifieerde dienstverleners en regel je hele event op één plek.
          </div>
        </div>
        <div style={{ display: 'flex', height: 10, width: 280, borderRadius: 999, background: 'linear-gradient(90deg, #a855f7, #f59e0b)' }} />
      </div>
    ),
    size,
  );
}
