import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/graphql': {
        target: 'http://apollo-service-router:4000',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/graphql/, "")
      }
    }
  }
})
