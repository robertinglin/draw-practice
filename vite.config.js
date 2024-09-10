import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  base: '/draw-practice/',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  css: {
    preprocessorOptions: {
      css: { charset: false },
    },
  },
  optimizeDeps: {
    include: ['@tldraw/tldraw'],
  },
  build: {
    commonjsOptions: {
      include: [/@tldraw\/tldraw/, /node_modules/],
    },
  },
})