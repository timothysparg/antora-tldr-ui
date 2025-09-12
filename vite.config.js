import { defineConfig } from 'vite'
import { resolve } from 'path'
import copy from 'rollup-plugin-copy'
import zipPack from 'vite-plugin-zip-pack'

export default defineConfig({
  root: '.',
  
  build: {
    outDir: 'build',
    emptyOutDir: true,
    
    rollupOptions: {
      input: {
        'js/site': resolve(__dirname, 'src/js/site.js'),
        'site': resolve(__dirname, 'src/css/site.css'),
        'home': resolve(__dirname, 'src/css/home.css'),
        'js/vendor/tabs.bundle': resolve(__dirname, 'src/js/vendor/tabs.esm.js'),
        'js/vendor/highlight.bundle': resolve(__dirname, 'src/js/vendor/highlight.esm.js')
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
  
  publicDir: 'preview-dist',
  
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
    // Inject version into build/ui.yml based on TAG env or package.json version
    {
      name: 'inject-ui-version',
      apply: 'build',
      writeBundle() {
        const fs = require('fs')
        const path = require('path')
        const pkg = require('./package.json')
        const tag = process.env.TAG || `v${pkg.version}`
        const uiYmlPath = path.join(__dirname, 'build', 'ui.yml')
        let content = ''
        if (fs.existsSync(uiYmlPath)) {
          content = fs.readFileSync(uiYmlPath, 'utf8')
          if (content.length && !content.endsWith('\n')) content += '\n'
        }
        content += `version: ${tag}\n`
        fs.writeFileSync(uiYmlPath, content)
      },
    },
    // Custom plugin to serve index.html for root requests and handle asset requests
    {
      name: 'serve-assets',
      configureServer(server) {
        const path = require('path')
        const fs = require('fs')
        
        server.middlewares.use((req, res, next) => {
          if (req.url === '/') {
            req.url = '/index.html'
          } else if (req.url?.startsWith('/_/')) {
            // Serve assets from preview-dist/_ directory
            const filePath = path.join(process.cwd(), 'preview-dist', req.url)
            if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
              const ext = path.extname(filePath).toLowerCase()
              let mimeType = 'application/octet-stream'
              
              // Set appropriate MIME types
              if (ext === '.css') mimeType = 'text/css'
              else if (ext === '.js') mimeType = 'application/javascript'
              else if (ext === '.png') mimeType = 'image/png'
              else if (ext === '.jpg' || ext === '.jpeg') mimeType = 'image/jpeg'
              else if (ext === '.gif') mimeType = 'image/gif'
              else if (ext === '.svg') mimeType = 'image/svg+xml'
              else if (ext === '.ico') mimeType = 'image/x-icon'
              else if (ext === '.woff') mimeType = 'font/woff'
              else if (ext === '.woff2') mimeType = 'font/woff2'
              else if (ext === '.ttf') mimeType = 'font/ttf'
              
              res.setHeader('Content-Type', mimeType)
              return fs.createReadStream(filePath).pipe(res)
            }
          }
          next()
        })
      }
    },
    copy({
      targets: [
        // Copy Handlebars layouts
        {
          src: 'src/layouts/*.hbs',
          dest: 'build/layouts'
        },
        // Copy Handlebars partials
        {
          src: 'src/partials/*.hbs',
          dest: 'build/partials'
        },
        // Copy Handlebars helpers
        {
          src: 'src/helpers/*.js',
          dest: 'build/helpers'
        },
        // Copy vendor CSS files
        {
          src: 'src/css/vendor/*.css',
          dest: 'build/css/vendor'
        },
        // Note: vendor JS is now bundled via Vite entry points above
        // Copy images (including favicon)
        {
          src: 'src/img/**/*.{png,jpg,jpeg,gif,svg,ico}',
          dest: 'build/img'
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
          dest: 'build/font'
        },
        // Copy static files if they exist (optional)
        ...(require('fs').existsSync('src/static') ? [{
          src: 'src/static/**/*',
          dest: 'build/',
          dot: true
        }] : [])
      ],
      hook: 'writeBundle'
    }),
    zipPack({
      inDir: 'build',
      outDir: 'build',
      outFileName: 'ui-bundle.zip'
    })
  ]
})
