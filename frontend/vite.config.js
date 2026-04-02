import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // Base path — kalau deploy ke subfolder Vercel, ubah ke '/nama-folder/'
  base: '/',
  build: {
    outDir: 'dist',
    sourcemap: false,
    // Chunk splitting supaya bundle tidak terlalu besar
    rollupOptions: {
      output: {
        manualChunks: {
          vendor:   ['react', 'react-dom', 'react-router-dom'],
          charts:   ['recharts'],
          xlsx:     ['xlsx'],
        },
      },
    },
  },
  server: {
    port: 5173,
    // Proxy ke backend saat dev — ganti port kalau backend lu beda
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
})
