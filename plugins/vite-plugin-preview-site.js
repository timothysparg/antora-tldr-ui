import Asciidoctor from '@asciidoctor/core'
import kroki from 'asciidoctor-kroki'
import fs from 'node:fs'
import path from 'node:path'
import handlebars from 'handlebars'
import yaml from 'js-yaml'
import chokidar from 'chokidar'

const asciidoctor = Asciidoctor()
// Create extension registry and register kroki extension
const registry = asciidoctor.Extensions.create()
kroki.register(registry)

const ASCIIDOC_ATTRIBUTES = {
  experimental: '',
  icons: 'font',
  sectanchors: '',
  'source-highlighter': 'highlight.js',
  'kroki-server-url': 'https://kroki.io',
}

let uiModel = null
const layouts = new Map()
let isHandlebarsInitialized = false

async function initializeHandlebars () {
  if (isHandlebarsInitialized) return

  // Register built-in helpers
  handlebars.registerHelper('relativize', relativize)
  handlebars.registerHelper('resolvePage', resolvePage)
  handlebars.registerHelper('resolvePageURL', resolvePageURL)

  // Register custom helpers from src/helpers
  const helpersPath = path.resolve(__dirname, '../src/helpers')
  if (fs.existsSync(helpersPath)) {
    const helperFiles = fs.readdirSync(helpersPath).filter((f) => f.endsWith('.js'))
    for (const file of helperFiles) {
      const helperName = path.basename(file, '.js')
      const helperPath = path.join(helpersPath, file)
      try {
        const helperModule = await import(helperPath)
        handlebars.registerHelper(helperName, helperModule.default)
      } catch (error) {
        console.warn(`Failed to load helper ${helperName}:`, error.message)
      }
    }
  }

  // Register partials from src/partials
  const partialsPath = path.resolve(__dirname, '../src/partials')
  if (fs.existsSync(partialsPath)) {
    const partialFiles = fs.readdirSync(partialsPath).filter((f) => f.endsWith('.hbs'))
    for (const file of partialFiles) {
      const partialName = path.basename(file, '.hbs')
      const partialContent = fs.readFileSync(path.join(partialsPath, file), 'utf8')
      handlebars.registerPartial(partialName, partialContent)
    }
  }

  // Load layouts from src/layouts
  const layoutsPath = path.resolve(__dirname, '../src/layouts')
  if (fs.existsSync(layoutsPath)) {
    const layoutFiles = fs.readdirSync(layoutsPath).filter((f) => f.endsWith('.hbs'))
    for (const file of layoutFiles) {
      const layoutName = path.basename(file, '.hbs')
      const layoutContent = fs.readFileSync(path.join(layoutsPath, file), 'utf8')
      layouts.set(layoutName, handlebars.compile(layoutContent, { preventIndent: true }))
    }
  }

  isHandlebarsInitialized = true
}

function loadUiModel () {
  if (!uiModel) {
    const uiModelPath = path.resolve(__dirname, '../preview-src/ui-model.yml')
    if (fs.existsSync(uiModelPath)) {
      const content = fs.readFileSync(uiModelPath, 'utf8')
      uiModel = yaml.load(content)
    } else {
      uiModel = {}
    }
  }
  return uiModel
}

export default function previewSitePlugin () {
  return {
    name: 'preview-site',

    configureServer (server) {
      const srcWatcher = chokidar.watch([
        '../src/layouts/*.hbs',
        '../src/partials/*.hbs',
        '../src/helpers/*.js',
        'ui-model.yml',
      ], { ignoreInitial: true })

      srcWatcher.on('change', () => {
        isHandlebarsInitialized = false
        uiModel = null
        layouts.clear()
        server.ws.send({ type: 'full-reload' })
      })

      // Add middleware to handle .html requests by mapping to .adoc files
      server.middlewares.use(async (req, res, next) => {
        if (req.url?.endsWith('.html') && req.method === 'GET') {
          const htmlPath = req.url
          const adocFileName = path.basename(htmlPath, '.html') + '.adoc'
          const adocPath = path.join(server.config.root, adocFileName)
          
          if (fs.existsSync(adocPath)) {
            try {
              const content = fs.readFileSync(adocPath, 'utf8')
              const html = await processAsciiDoc(content, adocPath)
              
              // Extract the actual HTML from the export statement
              const htmlContent = JSON.parse(html.replace('export default ', ''))
              
              res.setHeader('Content-Type', 'text/html')
              res.end(htmlContent)
              return
            } catch (error) {
              console.error(`Error processing ${adocPath}:`, error)
              res.statusCode = 500
              res.end('Internal Server Error')
              return
            }
          }
        }
        next()
      })
    },

    async load (id) {
      if (id.endsWith('.adoc')) {
        const filePath = id.replace(/\?.*$/, '')
        if (fs.existsSync(filePath)) {
          const content = fs.readFileSync(filePath, 'utf8')
          return await processAsciiDoc(content, filePath)
        }
      }
      return null
    },
  }
}

async function processAsciiDoc (content, filePath) {
  await initializeHandlebars()
  const baseUiModel = loadUiModel()

  const pageUiModel = { ...baseUiModel }
  const url = pageUiModel.env?.DEPLOY_PRIME_URL || pageUiModel.env?.URL
  if (url) pageUiModel.site.url = url

  pageUiModel.page = { ...pageUiModel.page }
  pageUiModel.siteRootPath = '.'
  pageUiModel.uiRootPath = ''

  const fileName = path.basename(filePath, '.adoc')

  if (fileName === '404') {
    pageUiModel.page = { layout: '404', title: 'Page Not Found' }
  } else {
    const doc = asciidoctor.load(content, {
      safe: 'safe',
      attributes: ASCIIDOC_ATTRIBUTES,
      extension_registry: registry,
    })

    pageUiModel.page.attributes = Object.entries(doc.getAttributes())
      .filter(([name]) => name.startsWith('page-'))
      .reduce((accum, [name, val]) => {
        accum[name.slice(5)] = val
        return accum
      }, {})

    pageUiModel.page.layout = doc.getAttribute('page-layout', 'default')
    if (doc.hasAttribute('docrole')) pageUiModel.page.role = doc.getAttribute('docrole')
    pageUiModel.page.title = doc.getDocumentTitle()
    pageUiModel.page.contents = Buffer.from(doc.convert())
  }

  const layout = layouts.get(pageUiModel.page.layout) || layouts.get('default')

  if (layout) {
    const html = layout(pageUiModel)
    return `export default ${JSON.stringify(html)}`
  } else {
    throw new Error(`Layout not found: ${pageUiModel.page.layout}`)
  }
}

function relativize (to, { data: { root } }) {
  if (!to) return '#'
  if (to.charAt() !== '/') return to
  const from = root.page.url
  if (!from) return (root.site.path || '') + to
  let hash = ''
  const hashIdx = to.indexOf('#')
  if (~hashIdx) {
    hash = to.slice(hashIdx)
    to = to.slice(0, hashIdx)
  }
  if (to === from) return hash || (to.charAt(to.length - 1) === '/' ? './' : path.basename(to))
  const rel = path.relative(path.dirname(from + '.'), to)
  const toDir = to.charAt(to.length - 1) === '/'
  return rel ? (toDir ? rel + '/' : rel) + hash : (toDir ? './' : '../' + path.basename(to)) + hash
}

function resolvePage (spec) {
  if (spec) return { pub: { url: resolvePageURL(spec) } }
}

function resolvePageURL (spec) {
  if (spec) return '/' + (spec = spec.split(':').pop()).slice(0, spec.lastIndexOf('.')) + '.html'
}
