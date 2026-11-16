/**
 * Guards against the easiest way to leak credentials: typing real values into
 * `.env.example`, which is committed, instead of `.env`, which is not.
 *
 * Runs before every build and stops it when the example file contains
 * something that looks real. It never prints a value.
 *
 * Usage: node scripts/check-no-committed-secrets.mjs [path-to-example-file]
 */
import { existsSync, readFileSync } from 'node:fs';

const file = process.argv[2] ?? '.env.example';
if (!existsSync(file)) process.exit(0);

const values = new Map();
for (const line of readFileSync(file, 'utf8').split('\n')) {
  const match = /^\s*([A-Z0-9_]+)\s*=\s*"?([^"\n]*)"?\s*$/.exec(line);
  if (match) values.set(match[1], match[2].trim());
}

const problems = [];

const databaseUrl = values.get('DATABASE_URL') ?? '';
if (databaseUrl) {
  let host = '';
  try {
    host = new URL(databaseUrl).hostname;
  } catch {
    host = '(unreadable)';
  }
  if (!['localhost', '127.0.0.1', 'postgres'].includes(host)) {
    problems.push(`DATABASE_URL points to a real database host (${host}).`);
  }
}

// These must stay empty in the example file.
for (const name of [
  'NEXTAUTH_SECRET',
  'AUTH_SECRET',
  'BLOB_READ_WRITE_TOKEN',
  'GOOGLE_CLIENT_SECRET',
  'CALENDAR_ENCRYPTION_KEY',
]) {
  if (values.get(name)) problems.push(`${name} has a value.`);
}

if (problems.length > 0) {
  console.error(`\n✖ ${file} is committed to git but seems to contain real credentials:\n`);
  for (const problem of problems) console.error(`  • ${problem}`);
  console.error(
    '\nPut real values in `.env` (ignored by git) or in your hosting dashboard, and restore the' +
      '\nexample values here. Anything that was pushed must be considered leaked: change that' +
      '\npassword or secret at the provider, removing it from the file is not enough.\n'
  );
  process.exit(1);
}
