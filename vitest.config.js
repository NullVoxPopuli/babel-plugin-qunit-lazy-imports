import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    exclude: ['test-app/**', 'node_modules/**', 'dist/**'],
  },
})