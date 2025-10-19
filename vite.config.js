import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist', // Vercel will auto-detect this
  },
  server: {
    port: 3000,
    strictPort: true,
    proxy: {
      // Only used during local development
      '/api': 'http://localhost:3000',
    },
  },
})