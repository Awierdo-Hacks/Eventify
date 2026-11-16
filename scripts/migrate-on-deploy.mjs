/**
 * Applies pending database migrations during a platform deploy (Vercel sets
 * VERCEL=1), so the code and the schema never get out of step. Skipped for
 * local and Docker builds, where migrations are run explicitly.
 */
import { spawnSync } from 'node:child_process';

if (process.env.VERCEL !== '1' && process.env.MIGRATE_ON_BUILD !== '1') process.exit(0);

console.log('Applying pending database migrations…');
const result = spawnSync('npx', ['prisma', 'migrate', 'deploy'], { stdio: 'inherit' });
process.exit(result.status ?? 1);
