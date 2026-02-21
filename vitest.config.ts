import type { UserConfig } from 'vite'
import {defineConfig} from 'vitest/config'

const config: UserConfig = defineConfig({
    test: {
        globals: true, // Use describe/test/expect without imports
        environment: 'node', // Use 'jsdom' if testing DOM-related code
        include: ['test/**/*.test.ts', 'src/**/*.test.ts'],
        coverage: {
            provider: "v8",
            reporter: ['text', 'json', 'html'],
            exclude: ['node_modules/', 'dist/']
        }
    }
})
export default config