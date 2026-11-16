'use server';

import bcrypt from 'bcryptjs';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { fail, invalid, GENERIC_ERROR, type ActionResult } from '@/lib/action';
import { invalidateProviders } from '@/lib/cache';
import { limitByIp, rateLimit, TOO_MANY_REQUESTS } from '@/lib/rate-limit';
import { createSession, destroySession } from '@/lib/session';
import { dashboardPathFor } from '@/lib/session-token';
import { safeRedirectPath } from '@/lib/utils';
import { site } from '@/config/site';
import { LEGAL_DOCUMENTS } from '@/features/legal/documents';
import {
  loginSchema,
  registerCustomerSchema,
  registerProviderSchema,
  type LoginInput,
  type RegisterCustomerInput,
  type RegisterProviderInput,
} from '@/features/auth/schemas';

const BCRYPT_ROUNDS = 12;
// Compared against when no account exists, so response time does not reveal
// whether an e-mail address is registered.
const DUMMY_HASH = '$2b$12$hlML0Ti1u/0szdJPU9lbC.7hgLIA83NRoeQkTFMs29/yId.YUSv9W';

const INVALID_CREDENTIALS = 'Dit e-mailadres of wachtwoord klopt niet.';

export async function loginAction(input: LoginInput): Promise<ActionResult> {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const { email, password } = parsed.data;

  const ipLimit = await limitByIp('login', 20, 10 * 60_000);
  const accountLimit = rateLimit(`login-account:${email}`, 8, 10 * 60_000);
  if (!ipLimit.allowed || !accountLimit.allowed) return fail(TOO_MANY_REQUESTS);

  let destination: string;
  try {
    const user = await db.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        password_hash: true,
        deleted_at: true,
        provider: { select: { id: true } },
      },
    });

    const passwordMatches = await bcrypt.compare(password, user?.password_hash || DUMMY_HASH);
    if (!user || user.deleted_at || !passwordMatches) return fail(INVALID_CREDENTIALS);

    if (user.status === 'SUSPENDED') {
      return fail(
        `Je account is tijdelijk geschorst. Neem contact op via ${site.contact.supportEmail} voor meer informatie of om bezwaar te maken.`
      );
    }
    if (user.status === 'BANNED') {
      return fail(
        `Je account is geblokkeerd wegens een schending van onze voorwaarden. Je kunt bezwaar maken via ${site.contact.supportEmail}.`
      );
    }

    await createSession({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      status: user.status,
      providerId: user.provider?.id ?? null,
    });
    destination = safeRedirectPath(parsed.data.redirect, dashboardPathFor(user.role));
  } catch (error) {
    console.error('[auth] login failed', error);
    return fail(GENERIC_ERROR);
  }

  redirect(destination);
}

export async function logoutAction(): Promise<void> {
  await destroySession();
  redirect('/');
}

const EMAIL_TAKEN =
  'Er bestaat al een account met dit e-mailadres. Log in of gebruik een ander adres.';

export async function registerCustomerAction(input: RegisterCustomerInput): Promise<ActionResult> {
  const parsed = registerCustomerSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const data = parsed.data;

  const limit = await limitByIp('register', 8, 60 * 60_000);
  if (!limit.allowed) return fail(TOO_MANY_REQUESTS);

  try {
    const existing = await db.user.findUnique({
      where: { email: data.email },
      select: { id: true },
    });
    if (existing) return fail(EMAIL_TAKEN, { email: EMAIL_TAKEN });

    const passwordHash = await bcrypt.hash(data.password, BCRYPT_ROUNDS);
    const terms = LEGAL_DOCUMENTS['terms-customer'];
    const privacy = LEGAL_DOCUMENTS.privacy;

    const user = await db.user.create({
      data: {
        email: data.email,
        name: `${data.firstName} ${data.lastName}`,
        first_name: data.firstName,
        last_name: data.lastName,
        date_of_birth: new Date(data.dateOfBirth),
        password_hash: passwordHash,
        role: 'CUSTOMER',
        legal_acceptances: {
          create: [
            { document: terms.key, version: terms.version },
            { document: privacy.key, version: privacy.version },
          ],
        },
      },
      select: { id: true, email: true, name: true, role: true, status: true },
    });

    await createSession({ ...user, providerId: null });
  } catch (error) {
    console.error('[auth] customer registration failed', error);
    return fail(GENERIC_ERROR);
  }

  redirect('/dashboard?welkom=1');
}

export async function registerProviderAction(input: RegisterProviderInput): Promise<ActionResult> {
  const parsed = registerProviderSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const data = parsed.data;

  const limit = await limitByIp('register', 8, 60 * 60_000);
  if (!limit.allowed) return fail(TOO_MANY_REQUESTS);

  try {
    const existing = await db.user.findUnique({
      where: { email: data.email },
      select: { id: true },
    });
    if (existing) return fail(EMAIL_TAKEN, { email: EMAIL_TAKEN });

    const passwordHash = await bcrypt.hash(data.password, BCRYPT_ROUNDS);
    const terms = LEGAL_DOCUMENTS['terms-provider'];
    const privacy = LEGAL_DOCUMENTS.privacy;

    const user = await db.user.create({
      data: {
        email: data.email,
        name: data.contactName,
        phone: data.phone,
        password_hash: passwordHash,
        role: 'PROVIDER',
        provider: {
          create: {
            business_name: data.businessName,
            category: data.category,
            location: data.location,
            price_range: data.priceRange,
            description: data.description,
            phone: data.phone,
            btw_number: data.btwNumber || null,
            services: [],
            images: [],
            portfolio_images: [],
          },
        },
        legal_acceptances: {
          create: [
            { document: terms.key, version: terms.version },
            { document: privacy.key, version: privacy.version },
          ],
        },
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        provider: { select: { id: true } },
      },
    });

    await createSession({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      status: user.status,
      providerId: user.provider?.id ?? null,
    });
    invalidateProviders();
  } catch (error) {
    console.error('[auth] provider registration failed', error);
    return fail(GENERIC_ERROR);
  }

  // New providers finish their profile (photos, services) while signed in.
  redirect('/provider-dashboard/profile?welkom=1');
}
