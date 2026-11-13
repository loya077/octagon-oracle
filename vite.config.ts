/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// `base` must match the GitHub repo name for GitHub Pages.
export default defineConfig({
  base: process.env.VITE_BASE ?? '/octagon-oracle/',
  plugins: [react()],
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
