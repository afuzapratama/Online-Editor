import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss()
  ],
  server: {
    proxy: {
      // Setiap permintaan ke /api/... akan diteruskan ke server backend kita
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      // Setiap permintaan ke /previews/... akan diteruskan ke folder di backend
      '/previews': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        // Kita perlu menulis ulang path agar backend tahu di mana mencari file
        rewrite: (path) => path.replace(/^\/previews/, '/previews-static'),
      }
    }
  }
})
