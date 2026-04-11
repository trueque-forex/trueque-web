import { defineConfig } from 'vitest/config';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
    test: {
        environment: 'jsdom',
        globals: true,
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
        exclude: ['**/node_modules/**', '**/dist/**', '**/tests/frontend/e2e/**'],
        setupFiles: ['./tests/setup.ts'],
    },
    esbuild: {
        jsx: 'automatic',
    },
});
