import { createMollieClient, type MollieClient } from '@mollie/api-client'

let client: MollieClient | null = null

/**
 * Lazily creates the Mollie client so builds and deploys without Mollie
 * credentials (e.g. while payments are switched off) keep working.
 */
export function getMollieClient(): MollieClient {
  if (client) return client

  const apiKey =
    process.env.NODE_ENV === 'production'
      ? process.env.MOLLIE_API_KEY
      : (process.env.MOLLIE_API_KEY_TEST ?? process.env.MOLLIE_API_KEY)

  if (!apiKey) {
    throw new Error('Missing Mollie API key. Set MOLLIE_API_KEY or MOLLIE_API_KEY_TEST in your environment.')
  }

  client = createMollieClient({ apiKey })
  return client
}
