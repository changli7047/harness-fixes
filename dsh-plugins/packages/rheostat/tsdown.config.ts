import { defineConfig } from 'tsdown'

/**
 * Bundle the plugin entry to `lib/index.js`. Everything under `@deepseek-ai/`
 * stays external: the host harness supplies its own copies at runtime, and the
 * bundle's peers must share the host's instances.
 */
export default defineConfig({
  entry: ['src/index.ts'],
  outDir: 'lib',
  format: ['esm'],
  platform: 'node',
  target: 'es2024',
  dts: false,
  clean: true,
  deps: { neverBundle: [/^@deepseek-ai\//] },
})
