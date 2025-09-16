import { defineConfig } from 'vite'
import { resolve } from 'path'
import fs from 'node:fs'
import path from 'node:path'
import copy from 'rollup-plugin-copy'
import zipPack from 'vite-plugin-zip-pack'
// Read package.json without import assertion to satisfy ESLint parser
const pkg = JSON.parse(fs.readFileSync(new URL('./package.json', import.meta.url)))

export default defineConfig({
  root: '.',

  build: {
    outDir: 'build',
    emptyOutDir: true,

    rollupOptions: {
      input: {
        'js/site': resolve(__dirname, 'src/js/site.js'),
        site: resolve(__dirname, 'src/css/site.css'),
        home: resolve(__dirname, 'src/css/home.css'),
        'js/vendor/tabs.bundle': resolve(__dirname, 'src/js/vendor/tabs.esm.js'),
        'js/vendor/highlight.bundle': resolve(__dirname, 'src/js/vendor/highlight.esm.js'),
      },
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: '[name].js',
        assetFileNames: (assetInfo) => {
          if (assetInfo.name?.endsWith('.css')) return 'css/[name].[ext]'
          if (assetInfo.name?.match(/\.(png|jpg|jpeg|gif|svg|ico)$/)) return 'img/[name].[ext]'
          if (assetInfo.name?.match(/\.(woff|woff2|ttf)$/)) return 'fonts/[name].[ext]'
          return '[name].[ext]'
        },
      },
    },
  },

  plugins: [
    // Inject version into build/ui.yml based on TAG env or package.json version
    {
      name: 'inject-ui-version',
      apply: 'build',
      writeBundle () {
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
    copy({
      targets: [
        // Copy Handlebars layouts
        {
          src: 'src/layouts/*.hbs',
          dest: 'build/layouts',
        },
        // Copy Handlebars partials
        {
          src: 'src/partials/*.hbs',
          dest: 'build/partials',
        },
        // Copy Handlebars helpers
        {
          src: 'src/helpers/*.js',
          dest: 'build/helpers',
        },
        // Copy vendor CSS files
        {
          src: 'src/css/vendor/*.css',
          dest: 'build/css/vendor',
        },
        // Note: vendor JS is now bundled via Vite entry points above
        // Copy images (including favicon)
        {
          src: 'src/img/**/*.{png,jpg,jpeg,gif,svg,ico}',
          dest: 'build/img',
        },
        // Copy static files if they exist (optional)
        ...(
          require('fs').existsSync('src/static')
            ? [
                {
                  src: 'src/static/**/*',
                  dest: 'build/',
                  dot: true,
                },
              ]
            : []
        ),
      ],
      hook: 'writeBundle',
    }),
    zipPack({
      inDir: 'build',
      outDir: 'build',
      outFileName: 'ui-bundle.zip',
    }),
  ],
})
