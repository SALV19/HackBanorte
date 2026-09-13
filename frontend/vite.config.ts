import path from 'path'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@hackbanorte/catalog': path.resolve(__dirname, '../catalog'),
    },
  },
  server: {
    fs: {
      allow: [path.resolve(__dirname, '..')],
    },
    // PASO 6 (plan A2UI): proxy en vez de CORS en el backend — el smoke
    // test descartable de App.tsx llama /mcp/chat y /a2ui/action tal cual,
    // sin base URL, y Vite los reenvía al backend real.
    proxy: {
      '/mcp/chat': 'http://localhost:3000',
      '/a2ui/action': 'http://localhost:3000',
    },
  },
})
