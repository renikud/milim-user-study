/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from "path"
import tailwindcss from "@tailwindcss/vite"
import { copyFileSync } from 'fs'

// https://vite.dev/config/
export default defineConfig({
  base: '/phonikud-user-study/',
  plugins: [
    react(), 
    tailwindcss(),
    // Copy index.html to 404.html for GitHub Pages SPA routing
    {
      name: 'copy-404',
      closeBundle() {
        copyFileSync('dist/index.html', 'dist/404.html')
      }
    }
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: './src/tests/setup.ts',
    testTimeout: 5000,
  },
})