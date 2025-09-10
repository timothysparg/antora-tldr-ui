import { defineConfig } from 'vite'
import { resolve } from 'path'
import previewSitePlugin from '../plugins/vite-plugin-preview-site.js'

export default defineConfig({
  root: resolve(__dirname),
  
  plugins: [
    previewSitePlugin(),
    // Custom plugin to serve images and assets
    {
      name: 'serve-images',
      configureServer(server) {
        const path = require('path')
        const fs = require('fs')
        
        server.middlewares.use((req, res, next) => {
          if (req.url?.startsWith('/img/')) {
            // Serve images from src/img directory
            const filePath = path.join(__dirname, '..', 'src', req.url)
            if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
              const ext = path.extname(filePath).toLowerCase()
              let mimeType = 'application/octet-stream'
              
              // Set appropriate MIME types
              if (ext === '.png') mimeType = 'image/png'
              else if (ext === '.jpg' || ext === '.jpeg') mimeType = 'image/jpeg'
              else if (ext === '.gif') mimeType = 'image/gif'
              else if (ext === '.svg') mimeType = 'image/svg+xml'
              else if (ext === '.ico') mimeType = 'image/x-icon'
              else if (ext === '.webp') mimeType = 'image/webp'
              
              res.setHeader('Content-Type', mimeType)
              return fs.createReadStream(filePath).pipe(res)
            }
          }
          next()
        })
      }
    }
    ,
    // Serve bundled vendor scripts from the main build output for preview
    {
      name: 'serve-bundled-vendor',
      configureServer(server) {
        const path = require('path')
        const fs = require('fs')
        server.middlewares.use((req, res, next) => {
          if (req.url?.startsWith('/js/vendor/')) {
            const filePath = path.join(__dirname, '..', 'build', req.url)
            if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
              res.setHeader('Content-Type', 'application/javascript')
              return fs.createReadStream(filePath).pipe(res)
            }
          }
          next()
        })
      }
    }
  ],
  
  server: {
    port: 5253,
    host: '0.0.0.0',
    open: false,
  },
  
  build: {
    outDir: '../preview-dist',
    emptyOutDir: true,
    rollupOptions: {
      input: resolve(__dirname, 'index.html')
    }
  },
  
  resolve: {
    alias: {
      '~': resolve(__dirname, '..'),
      '/js/vendor': resolve(__dirname, '../build/js/vendor'),
      '/css': resolve(__dirname, '../src/css'),
      '/js': resolve(__dirname, '../src/js')
    }
  },
  
  publicDir: false
})
