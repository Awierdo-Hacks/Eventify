/**
 * Demo accounts: one-click logins for looking around the product as each role.
 *
 * This is a developer convenience and a real risk if misused — with it on,
 * anyone who opens the login page can sign in as an administrator. It is
 * therefore OFF unless explicitly enabled:
 *
 *   - `npm run dev`            on by default (set DEMO_ACCOUNTS=0 to hide it)
 *   - any production build     only when DEMO_ACCOUNTS=1
 *
 * Never set DEMO_ACCOUNTS=1 on the live site with real customers. On Vercel,
 * add the variable to the Preview environment only.
 */
export function isDemoEnabled(): boolean {
  const flag = process.env.DEMO_ACCOUNTS;
  if (flag === '1') return true;
  if (flag === '0') return false;
  return process.env.NODE_ENV === 'development';
}

/** Every demo account lives under this address suffix, which is how they are recognised. */
export const DEMO_EMAIL_SUFFIX = '@demo.eventiphy.local';

export const DEMO_ACCOUNTS = [
  {
    key: 'customer',
    email: `klant${DEMO_EMAIL_SUFFIX}`,
    name: 'Emma Peeters',
    role: 'Klant',
    description: 'Plant een bruiloft, vergelijkt offertes',
  },
  {
    key: 'provider',
    email: `cateraar${DEMO_EMAIL_SUFFIX}`,
    name: 'Atelier Smaak',
    role: 'Dienstverlener · catering',
    description: 'Aanvragen, offertes, boekingen en agenda',
  },
  {
    key: 'admin',
    email: `beheerder${DEMO_EMAIL_SUFFIX}`,
    name: 'Beheerder',
    role: 'Beheerder',
    description: 'Verifieert profielen, behandelt meldingen',
  },
] as const;

export type DemoAccountKey = (typeof DEMO_ACCOUNTS)[number]['key'];
