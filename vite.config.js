import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  // Relative assets work both on the GitHub Pages project path and on a custom
  // domain served from its root.
  base: './',
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
  },
});

