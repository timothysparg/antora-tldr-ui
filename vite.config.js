import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  root: '.',
  
  build: {
    outDir: 'build-vite',
    emptyOutDir: true,
    
    rollupOptions: {
      input: {
        'js/site': resolve(__dirname, 'src/js/site.js'),
        'css/site': resolve(__dirname, 'src/css/site.css'),
        'css/home': resolve(__dirname, 'src/css/home.css')
      },
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: '[name].js',
        assetFileNames: (assetInfo) => {
          if (assetInfo.name?.endsWith('.css')) return 'css/[name].[ext]'
          if (assetInfo.name?.match(/\.(png|jpg|jpeg|gif|svg)$/)) return 'img/[name].[ext]'
          if (assetInfo.name?.match(/\.(woff|woff2|ttf)$/)) return 'font/[name].[ext]'
          return '[name].[ext]'
        }
      }
    }
  },
  
  server: {
    port: 5253,
    open: false
  },
  
  css: {
    postcss: {
      plugins: [
        require('postcss-import'),
        require('postcss-url'),
        require('postcss-custom-properties')({ 
          disableDeprecationNotice: true, 
          preserve: true 
        }),
        require('postcss-calc'),
        require('autoprefixer'),
        require('cssnano')
      ]
    }
  },
  
  plugins: []
})