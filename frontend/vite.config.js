import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 5173,
    host: true, // Izinkan akses dari jaringan lokal (HP / IP address)
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true
      }
    }
  }
});
