# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is the Asciidoctor Docs UI project - a custom Antora UI bundle for the Asciidoctor documentation site. It's built on top of the Antora default UI and uses Gulp as the build system.

## Development Commands

### Common Development Tasks
- `npm start` or `npx gulp preview` - Start development server with live reload at http://localhost:5252
- `npx gulp bundle` - Build and bundle the UI for production (creates build/ui-bundle.zip)
- `npx gulp lint` - Run both CSS and JavaScript linting
- `npx gulp lint:css` - Lint CSS files using stylelint
- `npx gulp lint:js` - Lint JavaScript files using eslint
- `npx gulp format` - Format JavaScript files using prettier-eslint
- `npx gulp clean` - Clean build artifacts

### Advanced Commands
- `npx gulp bundle:pack` - Pack UI bundle without running full build pipeline
- `npx gulp release` - Bundle and publish to GitHub (CI only)
- `SOURCEMAPS=true npx gulp bundle` - Create bundle with source maps for debugging

## Architecture

### Build System
- **Gulp**: Primary build tool with tasks defined in gulpfile.js
- **Task Organization**: Individual gulp tasks are in gulp.d/tasks/ directory
- **Configuration**: Build targets different directories based on environment (build/ for production, public/dist/ for deploy previews)

### Source Structure
- `src/` - Main source directory containing all UI assets
  - `css/` - Stylesheets including vendor CSS and custom styling
  - `js/` - JavaScript files including vendor libraries and custom scripts
  - `layouts/` - Handlebars templates for page layouts
  - `partials/` - Handlebars partial templates for reusable components
  - `helpers/` - Handlebars helper functions
  - `img/` - Images and icons
- `preview-src/` - Sample content for local development preview
- `gulp.d/` - Gulp task definitions and build utilities

#### Template Architecture (Handlebars)

**Layouts (`src/layouts/`):**
- `default.hbs` - Main page layout template (includes head, header, body, footer)
- `404.hbs` - Error page layout for 404 pages

**Partials (`src/partials/`):**
The partials are organized in a hierarchical structure:

*Page Structure:*
- `head.hbs` - Aggregates all head-related partials
  - `head-prelude.hbs` - Early head content
  - `head-title.hbs` - Page title generation
  - `head-styles.hbs` - CSS stylesheet links
  - `head-info.hbs` - Metadata and OpenGraph tags
  - `head-meta.hbs` - Meta tags
  - `head-scripts.hbs` - Head JavaScript includes
  - `head-icons.hbs` - Favicon and icon links
- `header.hbs` - Aggregates header components
  - `header-scripts.hbs` - Header JavaScript
  - `header-content.hbs` - Main navigation bar with logo, search, and menu
- `body.hbs` - Main content wrapper
  - `nav.hbs` - Left sidebar navigation container
    - `nav-menu.hbs` - Component/version navigation menu
    - `nav-explore.hbs` - Site exploration menu
    - `nav-tree.hbs` - Hierarchical page navigation
  - `main.hbs` - Article content area
    - `toolbar.hbs` - Page tools (breadcrumbs, edit link, version selector)
    - `toc.hbs` - Table of contents
    - `article.hbs` - Main article content
    - `article-404.hbs` - 404 error content
- `footer.hbs` - Aggregates footer components
  - `footer-content.hbs` - Footer links, branding, and legal information
  - `footer-scripts.hbs` - Footer JavaScript includes

*Component Partials:*
- `breadcrumbs.hbs` - Navigation breadcrumb trail
- `edit-this-page.hbs` - Edit page link functionality
- `page-versions.hbs` - Version selector dropdown
- `pagination.hbs` - Previous/next page navigation
- `nav-toggle.hbs` - Mobile navigation toggle button

*Template Composition:*
The templates use Handlebars partial inclusion (`{{> partialName}}`) to compose the final page structure. Each partial is focused on a specific UI component or functionality, allowing for modularity and maintainability.

### Key Technologies
- **Handlebars**: Template engine for HTML generation
- **PostCSS**: CSS processing with autoprefixer and cssnano
- **Browserify**: JavaScript bundling
- **Highlight.js**: Syntax highlighting (version 9.18.3 specifically)
- **Asciidoctor**: Content processing (@asciidoctor/core ~2.2)

## Code Style and Linting

### JavaScript
- Uses JavaScript Standard Style (eslint-config-standard)
- Max line length: 120 characters
- Arrow functions must have parentheses around parameters
- Trailing commas required in multiline arrays/objects
- Use `String#slice` instead of `String#substr`

### CSS
- Uses stylelint-config-standard
- No enforcement of comment empty lines or descending specificity rules

## Development Workflow

### Local Development
1. Run `npm ci` to install dependencies
2. Use `npm start` to launch development server
3. Edit files in `src/` directory - changes auto-reload in browser
4. Preview content is in `preview-src/` directory for testing

### Bundle Creation
1. Lint code passes (`npx gulp lint`)
2. Build process consolidates CSS into `site.css` and JS into `site.js`
3. Final bundle is created as `build/ui-bundle.zip`

### Release Process
- Automated via GitHub Actions on pushes to main branch
- Must pass linting to create release
- Creates git tag and GitHub release with UI bundle attached
- Use `[skip ci]` in commit message to skip automated release

## MCP Tooling

This project is configured with Model Context Protocol (MCP) servers to enhance development capabilities:

### Available MCP Servers
- **Playwright**: Automated browser testing and web interaction capabilities
- **Brave Search**: Web search functionality for research and information gathering
- **Context7**: Up-to-date documentation and code examples for libraries and frameworks

### MCP Configuration
- Configuration file: `.mcp.json` (project root)
- Provides enhanced tooling for browser automation, search, and documentation lookup
- Integrates with Claude Code for improved development workflow

### Development Preview and Screenshots
To run the local development preview and take screenshots using the MCP Playwright server:

1. **Start Development Server**:
   ```bash
   npm start
   # or
   npx gulp preview
   ```
   The server will be available at http://localhost:5252

2. **Take Screenshots with Playwright MCP**:
   - Use `mcp__playwright__browser_navigate` to open the local development server
   - Use `mcp__playwright__browser_take_screenshot` to capture screenshots
   - Screenshots are saved to `.playwright-mcp/` directory
   - Example: Full page screenshot saved as `local-dev-homepage.png`
   - Use `mcp__playwright__browser_close` to close the browser when finished

3. **Development Server Management**:
   - Server runs in background with live reload
   - Changes to `src/` files automatically trigger browser refresh
   - Use Ctrl+C to stop the development server

### UI Modification and Validation Workflow

When modifying UI elements, follow this systematic approach to find, change, and verify modifications:

#### 1. **Finding UI Elements in Templates**
- **Text Search**: Use `Grep` tool to search for visible text across the codebase
  ```bash
  # Example: Finding "Edit this Page" functionality
  Grep pattern:"Edit this Page" path:src output_mode:files_with_matches
  ```
- **Template Investigation**: Examine found files to understand component structure
- **Dependency Mapping**: Search for partial inclusions to trace where components are used
  ```bash
  # Example: Finding where edit-this-page partial is included
  Grep pattern:"edit-this-page" path:src output_mode:content
  ```

#### 2. **Making Template Changes**
- **Targeted Modification**: Edit the specific template file (e.g., `src/partials/toolbar.hbs`)
- **Clean Removal**: Remove unwanted elements completely rather than commenting out
- **Preserve Structure**: Maintain proper Handlebars syntax and template hierarchy

#### 3. **Validation with Playwright MCP**
- **Before/After Comparison**: 
  - Take accessibility snapshot and screenshot before changes
  - Make modifications to templates
  - Take new accessibility snapshot and screenshot after changes
  - Compare structural differences in the accessibility tree

- **Verification Process**:
  ```bash
  # Navigate to development server
  mcp__playwright__browser_navigate url:http://localhost:5252
  
  # Capture current state
  mcp__playwright__browser_snapshot  # Accessibility tree structure
  mcp__playwright__browser_take_screenshot filename:preview-output/modified-ui.png
  
  # Close browser
  mcp__playwright__browser_close
  ```

- **Documentation**: Save verification artifacts to `preview-output/` directory:
  - Screenshots showing visual changes
  - Accessibility snapshots showing structural modifications
  - Comparison files documenting before/after states

#### 4. **Change Validation Checklist**
- ✅ Target element is completely absent from accessibility tree
- ✅ No broken layout or spacing issues visible in screenshot
- ✅ Related functionality still works correctly
- ✅ Template structure remains valid and clean
- ✅ Development server auto-reload reflects changes immediately

This workflow ensures systematic UI modifications with proper validation and documentation of changes.

## Important Notes

- Node.js version managed via `.mise.toml` (migrated from .nvmrc)
- UI bundle is designed specifically for Antora static site generator
- Source maps available in development, optional for production builds
- Project supports deploy previews via Netlify for pull requests
- MCP servers provide additional development and testing capabilities

# Claude Workflow Notes

- Before committing check if the changes that have been introduced outdate or necessitate changes in the @README.adoc
- Before committing check if the changes that have been introduced outdate or necessitate changes in the @CLAUDE.md
- When committing follow the conventional commits syntax for commit messages
- When committing add exactly two Co-Authors: "Claude Code" and the LLM model name (e.g., "Sonnet 4", "Opus", etc). Do not add a generic "Claude" Co-Author
- When committing add the the original prompt and all subsequent user requests. Prefix the prompt with "User-Prompt:" If there are multiple prompts place each new prompt on a new line
- DO NOT save prompt messages from the user that instructs Claude to save or commit the set of changes (e.g., "save these changes", "commit this", "please commit")
- If changes do not seem like a logical grouping, make a suggestion of how to group the changes into multiple commits to the user
- When committing DO NOT ADD the Generated with Claude Code line