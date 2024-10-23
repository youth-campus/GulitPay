import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

console.log('Loading Vite config...');

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    strictPort: true,
    onListening: (server) => {
      console.log(`Vite server is running on http://localhost:${server.config.server.port}`);
    }
  },
  build: {
    rollupOptions: {
      onwarn(warning, warn) {
        console.log('Rollup warning:', warning);
        warn(warning);
      }
    }
  }
})