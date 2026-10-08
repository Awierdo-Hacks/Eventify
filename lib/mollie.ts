import { createMollieClient } from '@mollie/api-client'

const apiKey =
  process.env.NODE_ENV === 'production'
    ? process.env.MOLLIE_API_KEY!
    : (process.env.MOLLIE_API_KEY_TEST ?? process.env.MOLLIE_API_KEY!)

if (!apiKey) {
  throw new Error('Missing Mollie API key. Set MOLLIE_API_KEY or MOLLIE_API_KEY_TEST in your environment.')
}

export const mollieClient = createMollieClient({ apiKey })
