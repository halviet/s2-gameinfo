import { defineConfig, type UserConfig} from 'tsdown'

const config: UserConfig = defineConfig({
  exports: true,
  entry: 'src/index.ts',
  outDir: 'dist/',
  format: ['esm', 'cjs'],

  dts: true,
  // Fail on warnings in CI
  failOnWarn: 'ci-only',
  // Run package validators in CI
  publint: 'ci-only',
  attw: 'ci-only',

  sourcemap: true,
  minify: true,
  clean: true
})
export default config
