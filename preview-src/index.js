// Import styles and JavaScript from src/
import './main.js'

// Import and render the main page
import homePage from './index.adoc'

// Replace the loading message with the rendered page
document.getElementById('app').innerHTML = homePage

// Handle navigation for other pages
const pages = {
  '/': () => import('./index.adoc').then((module) => module.default),
  '/getting-started-asciidoc.html': () => import('./getting-started-asciidoc.adoc').then((module) => module.default),
  '/advanced-formatting.html': () => import('./advanced-formatting.adoc').then((module) => module.default),
  '/static-sites.html': () => import('./static-sites.adoc').then((module) => module.default),
  '/documentation-best-practices.html': () => import('./documentation-best-practices.adoc').then((module) => module.default),
  '/kitchensink.html': () => import('./kitchensink.adoc').then((module) => module.default),
  '/404.html': () => import('./404.adoc').then((module) => module.default),
}

// Simple client-side routing for development
window.addEventListener('popstate', () => {
  const path = location.pathname
  const page = pages[path] || pages['/404.html']
  page().then((content) => {
    document.getElementById('app').innerHTML = content
  })
})

console.log('Preview site loaded with Vite + AsciiDoc + Handlebars integration')
