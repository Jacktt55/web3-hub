import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  // GitHub Pages project site: https://jacktt55.github.io/web3-hub/
  base: '/web3-hub/',
  plugins: [react(), tailwindcss()],
})
