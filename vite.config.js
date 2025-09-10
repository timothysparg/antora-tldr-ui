import { defineConfig } from 'vite'
import { resolve } from 'path'
import copy from 'rollup-plugin-copy'

export default defineConfig({
  root: 'public',
  
  build: {
    outDir: '../build-vite',
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
    port: 5252,
    host: '0.0.0.0',
    open: false
  },
  
  preview: {
    port: 5252,
    host: '0.0.0.0'
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
  
  plugins: [
    copy({
      targets: [
        // Copy Handlebars layouts
        {
          src: 'src/layouts/*.hbs',
          dest: 'build-vite/layouts'
        },
        // Copy Handlebars partials
        {
          src: 'src/partials/*.hbs',
          dest: 'build-vite/partials'
        },
        // Copy Handlebars helpers
        {
          src: 'src/helpers/*.js',
          dest: 'build-vite/helpers'
        },
        // Copy vendor CSS files
        {
          src: 'src/css/vendor/*.css',
          dest: 'build-vite/css/vendor'
        },
        // Copy vendor JS files
        {
          src: 'src/js/vendor/*.js',
          dest: 'build-vite/js/vendor'
        },
        // Copy static files if they exist (optional)
        ...(require('fs').existsSync('src/static') ? [{
          src: 'src/static/**/*',
          dest: 'build-vite/',
          dot: true
        }] : [])
      ],
      hook: 'writeBundle'
    })
  ]
})