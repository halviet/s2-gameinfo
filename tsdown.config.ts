import { defineConfig } from 'tsdown'

export default defineConfig({
  exports: true,
  entry: 'src/index.ts',
  outDir: 'dist/',
  format: ['esm', 'cjs'],
  dts: true,
  sourcemap: true,
  minify: true,
  clean: true
})
