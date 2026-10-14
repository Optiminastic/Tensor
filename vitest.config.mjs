import { fileURLToPath } from 'node:url'

import { defineConfig } from 'vitest/config'

// Mirrors the `@/*` path in tsconfig.json, so tests can import modules that
// reach other modules through the alias at runtime, not just for types.
export default defineConfig({
  resolve: {
    alias: { '@': fileURLToPath(new URL('./', import.meta.url)) },
  },
})
