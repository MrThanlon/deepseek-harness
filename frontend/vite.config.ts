import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { nitro } from 'nitro/vite'

// A single Vite config drives the whole app:
//  - `vite dev`    -> unified Vite dev server + Nitro file-based API routes
//  - `vite build`  -> builds the client bundle into `.output/public` and the
//                     Nitro server into `.output/server` (preset: node-server)
//  - `vite preview`/`node .output/server/index.mjs` -> serve the built output
export default defineConfig({
  plugins: [react(), nitro()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    host: '0.0.0.0',
    port: 4173,
    // The Arena preview reaches the dev server through a per-sandbox host
    // (e.g. 4173-<sandbox-id>.e2b.app); allow it (and any custom host).
    allowedHosts: true,
  },
  preview: {
    host: '0.0.0.0',
    port: 4173,
    allowedHosts: true,
  },
})
