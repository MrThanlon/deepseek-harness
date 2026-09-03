import { defineConfig } from 'nitro'

export default defineConfig({
  // Scan the project root so the file-based `api/`, `routes/`, `middleware/`
  // and `plugins/` directories are discovered (Nitro 3 defaults serverDir to
  // `false` for the Vite plugin).
  serverDir: './',
  compatibilityDate: '2026-09-03',
})
