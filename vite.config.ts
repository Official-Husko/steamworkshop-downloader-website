import { defineConfig } from 'vite'
import preact from '@preact/preset-vite'
import { appDefines } from './vite.shared.ts'

// https://vite.dev/config/
export default defineConfig({
  plugins: [preact()],
  define: appDefines,
})
