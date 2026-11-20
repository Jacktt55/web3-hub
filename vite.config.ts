import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  // GitHub Pages project site: https://jacktt55.github.io/web3-hub/
  // Vercel serves from the domain root, so use '/' there (Vercel sets VERCEL=1
  // in its build environment). Without this the built HTML references
  // /web3-hub/assets/... which 404s on Vercel and renders a blank page.
  base: process.env.VERCEL ? '/' : '/web3-hub/',
  plugins: [react(), tailwindcss()],
})
