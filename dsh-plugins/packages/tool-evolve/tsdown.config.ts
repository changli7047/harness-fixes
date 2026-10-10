import { defineConfig } from 'tsdown'

/** Bundle the plugin entry; host-provided `@deepseek-ai/*` packages stay external. */
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
