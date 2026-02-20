import { defineConfig } from 'vitest/config'

export default defineConfig({
    test: {
        globals: true,           // Use describe/test/expect without imports
        environment: 'node',     // Use 'jsdom' if testing DOM-related code
        include: ['test/**/*.test.ts', 'src/**/*.test.ts'],
        coverage: {
            provider: "v8",
            reporter: ['text', 'json', 'html'],
            exclude: ['node_modules/', 'dist/']
        }
    }
})