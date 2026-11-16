import 'server-only';
import { SignJWT, jwtVerify } from 'jose';
import { db } from '@/lib/db';
import { env } from '@/lib/env';
import { decryptToken, encryptToken, canEncryptTokens } from '@/features/calendar/encryption';

const AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const REVOKE_URL = 'https://oauth2.googleapis.com/revoke';
const USERINFO_URL = 'https://www.googleapis.com/oauth2/v2/userinfo';
// Free/busy only: Eventiphy never reads event titles, guests or descriptions.
const SCOPE = 'https://www.googleapis.com/auth/calendar.freebusy openid email';

export function googleCalendarConfigured(): boolean {
  return Boolean(
    env.google.clientId && env.google.clientSecret && env.google.redirectUri && canEncryptTokens()
  );
}

const stateKey = () => new TextEncoder().encode(`${env.sessionSecret}:google-calendar-state`);

/**
 * The OAuth `state` is a short-lived signed token bound to the provider who
 * started the flow. v1 passed the bare provider id, which let anyone attach
 * their own Google account to another provider's agenda.
 */
export async function createGoogleAuthUrl(providerId: string): Promise<string> {
  const state = await new SignJWT({ providerId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('10m')
    .sign(stateKey());
  const params = new URLSearchParams({
    client_id: env.google.clientId!,
    redirect_uri: env.google.redirectUri!,
    response_type: 'code',
    scope: SCOPE,
    access_type: 'offline',
    prompt: 'consent',
    state,
  });
  return `${AUTH_URL}?${params.toString()}`;
}

export async function verifyGoogleState(state: string): Promise<string | null> {
  try {
    const { payload } = await jwtVerify(state, stateKey(), { algorithms: ['HS256'] });
    return typeof payload.providerId === 'string' ? payload.providerId : null;
  } catch {
    return null;
  }
}

export async function connectGoogleCalendar(code: string, providerId: string): Promise<void> {
  const response = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: env.google.clientId!,
      client_secret: env.google.clientSecret!,
      redirect_uri: env.google.redirectUri!,
      grant_type: 'authorization_code',
    }),
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) throw new Error('Google token exchange failed');
  const tokens = (await response.json()) as {
    access_token: string;
    refresh_token?: string;
    expires_in: number;
  };

  const profile = await fetch(USERINFO_URL, {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
    signal: AbortSignal.timeout(10_000),
  });
  const email = profile.ok ? (((await profile.json()) as { email?: string }).email ?? null) : null;

  const data = {
    is_active: true,
    google_account_email: email,
    access_token: encryptToken(tokens.access_token),
    token_expires_at: new Date(Date.now() + tokens.expires_in * 1000),
    sync_error: null,
    last_synced_at: null,
    ...(tokens.refresh_token ? { refresh_token: encryptToken(tokens.refresh_token) } : {}),
  };
  await db.calendarIntegration.upsert({
    where: { provider_id_type: { provider_id: providerId, type: 'GOOGLE' } },
    create: { provider_id: providerId, type: 'GOOGLE', ...data },
    update: data,
  });
}

/** Revoke our access at Google (best effort) and delete everything we stored. */
export async function disconnectGoogleCalendar(providerId: string): Promise<void> {
  const integration = await db.calendarIntegration.findUnique({
    where: { provider_id_type: { provider_id: providerId, type: 'GOOGLE' } },
    select: { id: true, access_token: true, refresh_token: true },
  });
  if (!integration) return;
  const stored = integration.refresh_token ?? integration.access_token;
  if (stored) {
    try {
      await fetch(REVOKE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ token: decryptToken(stored) }),
        signal: AbortSignal.timeout(8_000),
      });
    } catch {
      // Revocation is best effort; the stored tokens are deleted regardless.
    }
  }
  await db.calendarIntegration.delete({ where: { id: integration.id } });
}
