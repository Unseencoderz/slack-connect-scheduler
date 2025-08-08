import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/auth': {
        target: 'https://slack-connect-scheduler.onrender.com',
        changeOrigin: true
      },
      '/messages': {
        target: 'https://slack-connect-scheduler.onrender.com',
        changeOrigin: true
      }
    }
  }
})