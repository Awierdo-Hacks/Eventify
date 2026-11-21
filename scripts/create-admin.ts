/**
 * Create the first administrator, or promote an existing account.
 *
 * A new database has no accounts, and the site only lets people register as
 * customer or provider, so the first admin has to be created here.
 *
 *   ADMIN_EMAIL=you@example.com ADMIN_PASSWORD='a long password' npm run create-admin
 *
 * Optional: ADMIN_NAME. The database is the one your environment points to
 * (DATABASE_URL, or the variables of a connected Vercel database) — check
 * the "Database connection" line it prints before trusting the result.
 */
import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '../src/generated/prisma/client';
import { resolveDatabaseUrl, toDriverConnectionString } from './database-url.mjs';

async function main() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD ?? '';
  const name = process.env.ADMIN_NAME?.trim() || 'Beheerder';

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    throw new Error('Set ADMIN_EMAIL to a valid e-mail address.');
  if (password.length < 12)
    throw new Error('Set ADMIN_PASSWORD to a password of at least 12 characters.');

  const database = resolveDatabaseUrl();
  if (!database) throw new Error('No database connection string found (DATABASE_URL).');
  const host = new URL(database.url).host;
  const isLocal = /^(localhost|127\.0\.0\.1|postgres)(:|$)/.test(host);
  console.log(`Database connection: ${database.variable} → ${host}`);

  const adapter = new PrismaPg({
    connectionString: toDriverConnectionString(database.url),
    ...(isLocal ? {} : { ssl: { rejectUnauthorized: false } }),
  });
  const prisma = new PrismaClient({ adapter });

  try {
    const passwordHash = await bcrypt.hash(password, 12);
    const existing = await prisma.user.findUnique({
      where: { email },
      select: { id: true, role: true },
    });

    if (existing) {
      await prisma.user.update({
        where: { id: existing.id },
        data: { role: 'ADMIN', status: 'ACTIVE', password_hash: passwordHash, deleted_at: null },
      });
      console.log(
        `✔ ${email} already existed (${existing.role}); it is now an administrator with the new password.`
      );
    } else {
      await prisma.user.create({
        data: { email, name, password_hash: passwordHash, role: 'ADMIN' },
      });
      console.log(`✔ Administrator ${email} created. Log in at /login.`);
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(`✖ ${error instanceof Error ? error.message : error}`);
  process.exit(1);
});
