import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

export default defineConfig({
  plugins: [react()],
  server: {
    open: true, // This will automatically open the browser
    port: 3000  // Optional: specify a port
  },
  build: {
    chunkSizeWarningLimit: 1500,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': ['@headlessui/react', '@heroicons/react', 'tailwindcss'],
          'utils-vendor': ['@reduxjs/toolkit', 'react-redux', 'axios', 'lodash'],
        },
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('@mui')) return 'mui-vendor'
            if (id.includes('chart.js')) return 'chart-vendor'
            if (id.includes('firebase')) return 'firebase-vendor'
            return 'common-vendor'
          }
        }
      }
    }
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})