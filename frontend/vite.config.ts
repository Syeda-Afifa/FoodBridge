import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// The dev server proxies every /api request to the FastAPI backend.
// This keeps the browser on a single origin during development, which means
// no CORS preflights and — more importantly — the httpOnly refresh cookie
// is treated as first-party and gets sent automatically.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
    },
  },
})
