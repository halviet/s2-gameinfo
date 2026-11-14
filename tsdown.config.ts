import { defineConfig, type UserConfig} from 'tsdown'

const config: UserConfig = defineConfig({
  exports: true,
  entry: 'src/index.ts',
  outDir: 'dist/',
  format: ['esm', 'cjs'],

  // Oxc's declaration pass tries to parse the ConVar JSON catalog as TypeScript.
  dts: { oxc: false },

  sourcemap: true,
  minify: true,
  clean: true
})
export default config
