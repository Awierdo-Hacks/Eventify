import { prisma } from "./prisma";
import { encryptToken, decryptToken } from "./calendarEncryption";
import { format, addDays, parseISO } from "date-fns";

const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_REVOKE_URL = "https://oauth2.googleapis.com/revoke";
const GOOGLE_FREEBUSY_URL = "https://www.googleapis.com/calendar/v3/freeBusy";
const GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v2/userinfo";

function getClientId() {
  return process.env.GOOGLE_CLIENT_ID ?? "";
}
function getClientSecret() {
  return process.env.GOOGLE_CLIENT_SECRET ?? "";
}
function getRedirectUri() {
  return process.env.GOOGLE_REDIRECT_URI ?? "";
}

export function getGoogleAuthUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: getClientId(),
    redirect_uri: getRedirectUri(),
    response_type: "code",
    scope: "https://www.googleapis.com/auth/calendar.readonly openid email",
    access_type: "offline",
    prompt: "consent",
    state,
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

export async function exchangeGoogleCode(
  code: string,
  providerId: string
): Promise<{ email: string }> {
  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: getClientId(),
      client_secret: getClientSecret(),
      redirect_uri: getRedirectUri(),
      grant_type: "authorization_code",
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Google token exchange failed: ${err}`);
  }

  const tokens = await res.json();
  const expiresAt = new Date(Date.now() + tokens.expires_in * 1000);

  // Get the user's email
  const userRes = await fetch(GOOGLE_USERINFO_URL, {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });
  const userInfo = await userRes.json();
  const email = userInfo.email ?? "";

  await prisma.calendarIntegration.upsert({
    where: { provider_id_type: { provider_id: providerId, type: "GOOGLE" } },
    create: {
      provider_id: providerId,
      type: "GOOGLE",
      is_active: true,
      google_account_email: email,
      access_token: encryptToken(tokens.access_token),
      refresh_token: tokens.refresh_token ? encryptToken(tokens.refresh_token) : null,
      token_expires_at: expiresAt,
      sync_error: null,
    },
    update: {
      is_active: true,
      google_account_email: email,
      access_token: encryptToken(tokens.access_token),
      refresh_token: tokens.refresh_token ? encryptToken(tokens.refresh_token) : null,
      token_expires_at: expiresAt,
      sync_error: null,
    },
  });

  return { email };
}

async function getValidAccessToken(
  integrationId: string
): Promise<string> {
  const integration = await prisma.calendarIntegration.findUniqueOrThrow({
    where: { id: integrationId },
  });

  if (!integration.access_token) throw new Error("No access token stored");

  // If token expires within 5 minutes, refresh it
  const needsRefresh =
    !integration.token_expires_at ||
    integration.token_expires_at.getTime() < Date.now() + 5 * 60 * 1000;

  if (!needsRefresh) {
    return decryptToken(integration.access_token);
  }

  if (!integration.refresh_token) throw new Error("No refresh token, re-authorization required");

  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: getClientId(),
      client_secret: getClientSecret(),
      refresh_token: decryptToken(integration.refresh_token),
      grant_type: "refresh_token",
    }),
  });

  if (!res.ok) {
    throw new Error("Token refresh failed — user must re-authorize");
  }

  const tokens = await res.json();
  const expiresAt = new Date(Date.now() + tokens.expires_in * 1000);

  await prisma.calendarIntegration.update({
    where: { id: integrationId },
    data: {
      access_token: encryptToken(tokens.access_token),
      token_expires_at: expiresAt,
    },
  });

  return tokens.access_token;
}

export async function syncGoogleCalendar(
  integrationId: string,
  fromDate: Date,
  toDate: Date
): Promise<void> {
  const integration = await prisma.calendarIntegration.findUniqueOrThrow({
    where: { id: integrationId },
  });

  let accessToken: string;
  try {
    accessToken = await getValidAccessToken(integrationId);
  } catch (err) {
    await prisma.calendarIntegration.update({
      where: { id: integrationId },
      data: { sync_error: (err as Error).message },
    });
    throw err;
  }

  const body = {
    timeMin: fromDate.toISOString(),
    timeMax: toDate.toISOString(),
    items: [{ id: "primary" }],
  };

  const res = await fetch(GOOGLE_FREEBUSY_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text();
    await prisma.calendarIntegration.update({
      where: { id: integrationId },
      data: { sync_error: `FreeBusy API error: ${errText}` },
    });
    throw new Error(`Google FreeBusy API failed: ${errText}`);
  }

  const data = await res.json();
  const busySlots: { start: string; end: string }[] =
    data.calendars?.primary?.busy ?? [];

  // Expand busy time ranges into individual days
  const days = new Map<string, boolean>();
  for (const slot of busySlots) {
    let current = parseISO(slot.start);
    const end = parseISO(slot.end);
    while (current < end) {
      days.set(format(current, "yyyy-MM-dd"), true);
      current = addDays(current, 1);
    }
  }

  // Delete existing synced events for this integration in the date range, then re-insert
  await prisma.externalCalendarEvent.deleteMany({
    where: {
      integration_id: integrationId,
      start_date: { gte: fromDate, lte: toDate },
    },
  });

  if (days.size > 0) {
    await prisma.externalCalendarEvent.createMany({
      data: Array.from(days.keys()).map((dateStr) => ({
        integration_id: integrationId,
        external_uid: `google-${integrationId}-${dateStr}`,
        title: "Bezet (Google Calendar)",
        start_date: new Date(dateStr),
        end_date: new Date(dateStr),
        is_all_day: true,
      })),
      skipDuplicates: true,
    });
  }

  await prisma.calendarIntegration.update({
    where: { id: integrationId },
    data: { last_synced_at: new Date(), sync_error: null },
  });
}

export async function disconnectGoogleCalendar(providerId: string): Promise<void> {
  const integration = await prisma.calendarIntegration.findUnique({
    where: { provider_id_type: { provider_id: providerId, type: "GOOGLE" } },
  });

  if (integration?.access_token) {
    // Best-effort revoke
    try {
      const token = decryptToken(integration.access_token);
      await fetch(`${GOOGLE_REVOKE_URL}?token=${token}`, { method: "POST" });
    } catch {
      // Ignore revoke errors
    }
  }

  await prisma.calendarIntegration.delete({
    where: { provider_id_type: { provider_id: providerId, type: "GOOGLE" } },
  });
}
