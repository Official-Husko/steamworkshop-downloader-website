import { defineConfig } from 'vite'
import preact from '@preact/preset-vite'
import { appDefines } from './vite.shared.ts'

// https://vite.dev/config/
export default defineConfig({
  plugins: [preact()],
  define: appDefines,
  server: {
    // Lets `npm run dev` talk to a locally-running backend (`go run .`,
    // default port 8080) without needing the full docker compose/nginx
    // stack just to iterate on the frontend.
    proxy: {
      '/api': 'http://localhost:8080',
    },
  },
})
