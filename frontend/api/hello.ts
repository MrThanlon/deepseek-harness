/**
 * Example Nitro API route.
 *
 * Demonstrates the Nitro half of the migrated project: the same Vite build
 * produces the server, and file-based routes under `api/` are served
 * alongside the SPA. Call `GET /api/hello` from the browser or a client fetch.
 */
import { defineHandler } from 'nitro'

export default defineHandler(() => ({
  message: 'Hello from the Nitro server',
  time: new Date().toISOString(),
}))
