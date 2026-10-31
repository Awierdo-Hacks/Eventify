export type PaymentsMode = 'off' | 'test' | 'live';

/**
 * Online payments stay switched off until Eventiphy has a company and a
 * verified Mollie account. 'test' is for the demo environment (Mollie test
 * keys), 'live' for real payments. Public on purpose: the UI needs it too.
 */
export function getPaymentsMode(): PaymentsMode {
  const mode = process.env.NEXT_PUBLIC_PAYMENTS_MODE;
  return mode === 'test' || mode === 'live' ? mode : 'off';
}

export function paymentsEnabled(): boolean {
  return getPaymentsMode() !== 'off';
}

export const PAYMENTS_DISABLED_MESSAGE =
  'Online betalen is binnenkort beschikbaar. Regel de betaling voorlopig rechtstreeks met de provider.';
