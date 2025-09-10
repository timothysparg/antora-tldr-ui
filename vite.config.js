import { defineConfig } from 'vite'
import { resolve } from 'path'
import copy from 'rollup-plugin-copy'
import zipPack from 'vite-plugin-zip-pack'

export default defineConfig({
  root: '.',
  
  build: {
    outDir: 'build-vite',
    emptyOutDir: true,
    
    rollupOptions: {
      input: {
        'js/site': resolve(__dirname, 'src/js/site.js'),
        'site': resolve(__dirname, 'src/css/site.css'),
        'home': resolve(__dirname, 'src/css/home.css')
      },
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: '[name].js',
        assetFileNames: (assetInfo) => {
          if (assetInfo.name?.endsWith('.css')) return 'css/[name].[ext]'
          if (assetInfo.name?.match(/\.(png|jpg|jpeg|gif|svg|ico)$/)) return 'img/[name].[ext]'
          if (assetInfo.name?.match(/\.(woff|woff2|ttf)$/)) return 'font/[name].[ext]'
          return '[name].[ext]'
        }
      }
    }
  },
  
  server: {
    port: 5252,
    host: '0.0.0.0',
    open: false,
    fs: {
      serve: '.'
    }
  },
  
  preview: {
    port: 5252,
    host: '0.0.0.0'
  },
  
  publicDir: 'public',
  
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
        // Copy images (including favicon)
        {
          src: 'src/img/**/*.{png,jpg,jpeg,gif,svg,ico}',
          dest: 'build-vite/img'
        },
        // Copy fonts from node_modules
        {
          src: [
            'node_modules/@fontsource/roboto/files/roboto-latin-400-normal.woff',
            'node_modules/@fontsource/roboto/files/roboto-latin-400-normal.woff2',
            'node_modules/@fontsource/roboto/files/roboto-latin-400-italic.woff',
            'node_modules/@fontsource/roboto/files/roboto-latin-400-italic.woff2',
            'node_modules/@fontsource/roboto/files/roboto-latin-500-normal.woff',
            'node_modules/@fontsource/roboto/files/roboto-latin-500-normal.woff2',
            'node_modules/@fontsource/roboto/files/roboto-latin-500-italic.woff',
            'node_modules/@fontsource/roboto/files/roboto-latin-500-italic.woff2',
            'node_modules/@fontsource/roboto-mono/files/roboto-mono-latin-400-normal.woff',
            'node_modules/@fontsource/roboto-mono/files/roboto-mono-latin-400-normal.woff2',
            'node_modules/@fontsource/roboto-mono/files/roboto-mono-latin-500-normal.woff',
            'node_modules/@fontsource/roboto-mono/files/roboto-mono-latin-500-normal.woff2',
            'node_modules/@fontsource/comfortaa/files/comfortaa-latin-400-normal.woff',
            'node_modules/@fontsource/comfortaa/files/comfortaa-latin-400-normal.woff2'
          ],
          dest: 'build-vite/font'
        },
        // Copy static files if they exist (optional)
        ...(require('fs').existsSync('src/static') ? [{
          src: 'src/static/**/*',
          dest: 'build-vite/',
          dot: true
        }] : [])
      ],
      hook: 'writeBundle'
    }),
    zipPack({
      inDir: 'build-vite',
      outDir: 'build',
      outFileName: 'ui-bundle.zip'
    })
  ]
})