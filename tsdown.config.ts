import { defineConfig, type UserConfig} from 'tsdown'

const config: UserConfig = defineConfig({
  exports: true,
  entry: 'src/index.ts',
  outDir: 'dist/',
  format: ['esm', 'cjs'],

  dts: true,

  sourcemap: true,
  minify: true,
  clean: true
})
export default config
