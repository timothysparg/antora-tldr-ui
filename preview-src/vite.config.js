import { defineConfig } from 'vite'
import { resolve } from 'path'
import previewSitePlugin from '../plugins/vite-plugin-preview-site.js'

export default defineConfig({
  root: resolve(__dirname),
  
  plugins: [
    previewSitePlugin()
  ],
  
  server: {
    port: 5253,
    host: '0.0.0.0',
    open: false,
  },
  
  build: {
    outDir: '../dist-preview',
    emptyOutDir: true,
    rollupOptions: {
      input: resolve(__dirname, 'index.html')
    }
  },
  
  resolve: {
    alias: {
      '~': resolve(__dirname, '..'),
      '/css': resolve(__dirname, '../src/css'),
      '/js': resolve(__dirname, '../src/js'),
      '/img': resolve(__dirname, '../src/img')
    }
  },
  
  publicDir: false
})
