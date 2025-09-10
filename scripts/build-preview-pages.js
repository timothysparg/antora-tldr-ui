#!/usr/bin/env node
'use strict'

const Asciidoctor = require('@asciidoctor/core')()
const kroki = require('asciidoctor-kroki')
const fs = require('node:fs')
const { promises: fsp } = fs
const handlebars = require('handlebars')
const ospath = require('node:path')
const path = ospath.posix
const yaml = require('js-yaml')
const { execSync } = require('node:child_process')

// Create extension registry and register kroki extension
const registry = Asciidoctor.Extensions.create()
kroki.register(registry)

const ASCIIDOC_ATTRIBUTES = {
  experimental: '',
  icons: 'font',
  sectanchors: '',
  'source-highlighter': 'highlight.js',
  'kroki-server-url': 'https://kroki.io',
}

async function buildPreviewPages () {
  const previewSrc = 'preview-src'
  const previewDest = 'public'

  console.log('Building preview pages...')

  // Ensure output directory exists
  if (!fs.existsSync(previewDest)) {
    fs.mkdirSync(previewDest, { recursive: true })
  }

  try {
    // Load UI model
    const uiModelContent = await fsp.readFile(ospath.join(previewSrc, 'ui-model.yml'), 'utf8')
    const baseUiModel = yaml.load(uiModelContent)

    // Register Handlebars helpers
    handlebars.registerHelper('relativize', relativize)
    handlebars.registerHelper('resolvePage', resolvePage)
    handlebars.registerHelper('resolvePageURL', resolvePageURL)

    // Register all custom helpers from src/helpers
    const helpersPath = 'src/helpers'
    if (fs.existsSync(helpersPath)) {
      const helperFiles = fs.readdirSync(helpersPath).filter((f) => f.endsWith('.js'))
      for (const file of helperFiles) {
        const helperName = path.basename(file, '.js')
        const helperPath = ospath.join(helpersPath, file)
        try {
          const helperModule = require(ospath.resolve(helperPath))
          handlebars.registerHelper(helperName, helperModule)
        } catch (error) {
          console.warn(`Failed to load helper ${helperName}:`, error.message)
        }
      }
    }

    // Register partials
    const partialsPath = 'src/partials'
    if (fs.existsSync(partialsPath)) {
      const partialFiles = fs.readdirSync(partialsPath).filter((f) => f.endsWith('.hbs'))
      for (const file of partialFiles) {
        const partialName = path.basename(file, '.hbs')
        const partialContent = fs.readFileSync(ospath.join(partialsPath, file), 'utf8')
        handlebars.registerPartial(partialName, partialContent)
      }
    }

    // Load and compile layouts
    const layouts = new Map()
    const layoutsPath = 'src/layouts'
    if (fs.existsSync(layoutsPath)) {
      const layoutFiles = fs.readdirSync(layoutsPath).filter((f) => f.endsWith('.hbs'))
      for (const file of layoutFiles) {
        const layoutName = path.basename(file, '.hbs')
        const layoutContent = fs.readFileSync(ospath.join(layoutsPath, file), 'utf8')
        layouts.set(layoutName, handlebars.compile(layoutContent, { preventIndent: true }))
      }
    }

    // Process AsciiDoc files
    const adocFiles = fs.readdirSync(previewSrc).filter((f) => f.endsWith('.adoc'))

    for (const file of adocFiles) {
      const filePath = ospath.join(previewSrc, file)
      const content = fs.readFileSync(filePath, 'utf8')

      const uiModel = { ...baseUiModel }
      const url = uiModel.env?.DEPLOY_PRIME_URL || uiModel.env?.URL
      if (url) uiModel.site.url = url
      uiModel.page = { ...uiModel.page }
      uiModel.siteRootPath = '.'
      uiModel.uiRootPath = './_'

      if (path.basename(file, '.adoc') === '404') {
        uiModel.page = { layout: '404', title: 'Page Not Found' }
      } else {
        const doc = Asciidoctor.load(content, {
          safe: 'safe',
          attributes: ASCIIDOC_ATTRIBUTES,
          extension_registry: registry,
        })

        uiModel.page.attributes = Object.entries(doc.getAttributes())
          .filter(([name]) => name.startsWith('page-'))
          .reduce((accum, [name, val]) => {
            accum[name.slice(5)] = val
            return accum
          }, {})

        uiModel.page.layout = doc.getAttribute('page-layout', 'default')
        if (doc.hasAttribute('docrole')) uiModel.page.role = doc.getAttribute('docrole')
        uiModel.page.title = doc.getDocumentTitle()
        uiModel.page.contents = Buffer.from(doc.convert())
      }

      const outputFile = ospath.join(previewDest, path.basename(file, '.adoc') + '.html')
      const layout = layouts.get(uiModel.page.layout) || layouts.get('default')

      if (layout) {
        const html = layout(uiModel)
        fs.writeFileSync(outputFile, html)
        console.log(`Generated: ${outputFile}`)
      } else {
        console.warn(`Layout not found: ${uiModel.page.layout}`)
      }
    }

    // Copy images
    // Simple image copy for now - could be enhanced with glob

    console.log('Preview pages built successfully!')

    // Copy built assets to public/_ for development server
    const buildDir = 'build'
    const assetsDir = 'public/_'

    // Ensure assets directory exists
    if (!fs.existsSync(assetsDir)) {
      fs.mkdirSync(assetsDir, { recursive: true })
    }

    // Only copy if build directory exists (from previous vite build)
    if (fs.existsSync(buildDir)) {
      try {
        execSync(`cp -r ${buildDir}/* ${assetsDir}/`)
        console.log('Assets copied to public/_/ for development server')
      } catch (error) {
        console.warn('Could not copy assets - run npm run build first for full styling')
      }
    } else {
      console.warn('Build directory not found - run npm run build first for full styling')
    }
  } catch (error) {
    console.error('Error building preview pages:', error)
    process.exit(1)
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

if (require.main === module) {
  buildPreviewPages()
}

module.exports = buildPreviewPages
