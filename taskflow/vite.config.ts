import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': './src'
    }
  },
  server: {
    host: true,
    port: 5173,
    cors: true,
    hmr: {
      clientPort: 443,
      port: 5173
    },
    proxy: {
      '/v1/chat/completions': {
        target: 'http://localhost:1234',
        changeOrigin: true,
        secure: false,
      },
      '/v1/completions': {
        target: 'http://localhost:1234',
        changeOrigin: true,
        secure: false,
      },
      '/api/generate': {
        target: 'http://localhost:11434',
        changeOrigin: true,
        secure: false,
      }
    },
  }
})
