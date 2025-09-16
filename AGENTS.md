# AGENTS.md

This file provides guidance to AI coding agents working with code in this repository.

## Project Overview

This is the Asciidoctor Docs UI project - a custom Antora UI bundle for the Asciidoctor documentation site. It's built on top of the Antora default UI and uses Vite as the modern build system.

## Development Commands

### Common Development Tasks
- `npm start` or `npm run dev` - Start Vite development server with HMR at http://localhost:5252
- `npm run build` - Build and bundle the UI for production (creates build/ui-bundle.zip)
- `npm run bundle` - Alias for build command
- `npm run preview` - Preview production build using Vite preview server
- `npm run lint` - Run both CSS and JavaScript linting
- `npm run clean` - Clean build artifacts
- `npm run format` - Format JavaScript files using prettier-eslint

### Specialized Tasks
- `npm run preview:build` - Generate preview pages from AsciiDoc content
- `npm run lint:css` - Lint CSS files only using stylelint
- `npm run lint:js` - Lint JavaScript files only using eslint

## Architecture

### Build System
- **Vite**: Modern build tool and development server with HMR (Hot Module Replacement)
- **Configuration**: Build configuration in vite.config.js
- **Development**: Fast Vite dev server with instant updates and optimized bundling  
- **Production**: Optimized bundles with CSS/JS minification and font/asset copying
- **Preview Generation**: Node.js script for AsciiDoc processing (scripts/build-preview-pages.js)

### Source Structure
- `src/` - Main source directory containing all UI assets
  - `css/` - Stylesheets including vendor CSS and custom styling
  - `js/` - JavaScript files including vendor libraries and custom scripts
  - `layouts/` - Handlebars templates for page layouts
  - `partials/` - Handlebars partial templates for reusable components
  - `helpers/` - Handlebars helper functions
  - `img/` - Images and icons
- `preview-src/` - Sample content for local development preview
- `scripts/` - Node.js utility scripts for build and release processes

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
- **Vite**: Modern build tool and development server with HMR
- **Rollup**: JavaScript bundling (via Vite)
- **PostCSS**: CSS processing with autoprefixer and cssnano
- **Handlebars**: Template engine for HTML generation (templates copied to bundle)
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
2. Use `npm start` to launch Vite development server with HMR
3. Edit files in `src/` directory - changes auto-reload instantly in browser
4. Preview content is in `preview-src/` directory for testing

### Bundle Creation
1. Run `npm run build` - includes cleaning, linting, and bundling
2. Vite processes and optimizes CSS into `site.css` and JS into `site.js`
3. All assets (fonts, images, templates) are copied to correct bundle structure
4. Final bundle is created as `build/ui-bundle.zip`

### Release Process
- Automated via Release Please (GitHub Actions) which opens a release PR and, on merge, creates a semver tag and GitHub Release
- A separate `on: release` workflow builds the UI and uploads `build/ui-bundle.zip` to the GitHub Release
- Must pass linting to create release
- Consumers can use the latest bundle at `https://github.com/timothysparg/antora-tldr-ui/releases/latest/download/ui-bundle.zip`

## Tooling

This project may be configured with development tools to enhance automation and research.

### Configuration
- Configuration file: `.mcp.json` (project root), if present
- Provides optional tooling for browser automation, search, and documentation lookup
- Integrates with AI coding assistants to streamline development workflows

### Playwright MCP
- If configured, the Playwright MCP server enables automated browser testing and web interaction.
- Artifacts such as screenshots are saved to `.playwright-mcp/`.

#### Development Preview and Screenshots (Playwright MCP)
To run the local development preview and take screenshots using the Playwright MCP server:

1. **Start Development Server**:
   ```bash
   npm start
   # or
   npm run dev
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
- Text search: use your editor search or command line tools like `rg`/`grep` across the codebase
  ```bash
  # Example: finding "Edit this Page" functionality
  rg -n "Edit this Page" src
  
  # Example: where an edit-this-page partial is referenced
  rg -n "edit-this-page" src
  ```
- Investigate templates to understand component structure and inclusion hierarchy

#### 2. **Making Template Changes**
- **Targeted Modification**: Edit the specific template file (e.g., `src/partials/toolbar.hbs`)
- **Clean Removal**: Remove unwanted elements completely rather than commenting out
- **Preserve Structure**: Maintain proper Handlebars syntax and template hierarchy

#### 3. **Validation with Browser Automation (optional)**
- **Before/After Comparison**: 
  - Take accessibility snapshot and screenshot before changes
  - Make modifications to templates
  - Take new accessibility snapshot and screenshot after changes
  - Compare structural differences in the accessibility tree

- Use any available tooling to navigate, snapshot, and screenshot as supported by your environment

- If Playwright MCP is available, you can use these commands:
  ```bash
  # Navigate to development server
  mcp__playwright__browser_navigate url:http://localhost:5252
  
  # Capture current state
  mcp__playwright__browser_snapshot  # Accessibility tree structure
  mcp__playwright__browser_take_screenshot filename:.playwright-mcp/modified-ui.png
  
  # Close browser
  mcp__playwright__browser_close
  ```

- **Documentation**: Save verification artifacts to `.playwright-mcp/` directory:
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

### Antora Preview Configuration and Homepage Routing

When working with Antora preview content and homepage configuration:

#### Homepage Configuration Process
1. **File Naming**: The file that serves as the homepage must be named `index.adoc` in the `preview-src/` directory
2. **UI Model Configuration**: Update `preview-src/ui-model.yml` to set:
   - `homeUrl: &home_url /index.html` (must match the generated HTML filename)
   - `relativeSrcPath: index.adoc` (must match the source filename)
   - `title:` should reflect the actual page title from the AsciiDoc file

#### Common Homepage Routing Issues and Solutions
- **Problem**: Root URL shows directory listing or wrong content after configuration changes
- **Root Cause**: Cached build files or conflicting file names prevent proper routing
- **Solution Process**:
  1. Remove any conflicting files (e.g., old `index.adoc` files with different content)
  2. Run `npm run clean` to clear all build artifacts
  3. Ensure only one `index.adoc` file exists with the desired homepage content
  4. Restart the development server with `npm start`
  5. Verify that `public/index.html` is generated with correct content

#### Preview Content File Organization
- **Homepage**: Always use `index.adoc` for the homepage content
- **Other Content**: Use descriptive names (e.g., `blog-post-name.adoc`, `kitchensink.adoc`)
- **Configuration**: The `ui-model.yml` file controls routing and must be consistent with actual filenames

#### Build Cache Considerations
- Build artifacts are cached in the `public/` directory
- When making structural changes to content files or routing configuration, always run `npm run clean` followed by a fresh `npm start`
- Changes to `ui-model.yml` require a server restart to take effect

## Important Notes

- Node.js version managed via `.mise.toml` (migrated from .nvmrc)
- UI bundle is designed specifically for Antora static site generator
- Source maps available in development, optional for production builds
- Project supports deploy previews via Netlify for pull requests
- Optional automation/search/documentation tools may be available via `.mcp.json`

# Agent Workflow Notes

- Before committing check if the changes that have been introduced outdate or necessitate changes in the @README.adoc
- Before committing check if the changes that have been introduced outdate or necessitate changes in the @AGENTS.md
- Before committing run `npm run lint` and `npm run format` and fix any issues before the commit can proceed
- When committing follow the conventional commits syntax for commit messages
- If changes do not seem like a logical grouping, make a suggestion of how to group the changes into multiple commits to the user
- After committing changes, clear the session/context if your tooling supports it

## Creating GitHub Issues (agents)

- Use descriptive, human-readable titles (avoid conventional commit prefixes).
- Include summary, motivation, and actionable tasks so maintainers can execute without local context.
- Only reference artifacts available in the repository or public sources; omit local-only notes such as PLAN.md.
- Capture dependencies explicitly when one issue blocks or requires another.
- Add a brief acknowledgment comment if it matches the repository's collaboration style.

## Commit Message Format

Commit messages must follow this exact structure:

> **Signature requirement:** Every commit must be signed with your configured signing key (GPG or SSH). Verify signatures with `git log --show-signature` before handing work off.

1. **Subject line**: Conventional commits format (e.g., "feat:", "fix:", "refactor:")
2. **Body**: Detailed description of changes (optional)
3. **Plan section**: When working from a plan (e.g., plan.md), include relevant plan details - third to last
4. **User-Prompt section**: Original user request(s) - second to last  
5. **Co-Authors section**: Attribution - must be the last lines

### User-Prompt Section
- **CRITICAL**: Include user prompts and requests that are relevant to the specific changes being committed
- **Scope Rules**:
  - **New session**: All prompts/requests from start of session until current commit
  - **Subsequent commits**: All prompts/requests since the last commit that relate to current changes
  - **Multiple commits**: Use discretion to assign prompts to the most relevant commit (prompts may be relevant to multiple commits)
- Add relevant prompts in chronological order
- Prefix with "User-Prompt:" on its own line
- If multiple prompts, place each new prompt on a new line, maintaining chronological order
- Include requests that led to code changes, feature additions, UI modifications, or configuration updates being committed
- DO NOT include prompt messages that only instruct to save/commit (e.g., "save these changes", "commit this", "please commit", "save please")
- **Example format for relevant prompts**:
  ```
  User-Prompt: please remove the navigation section  
  User-Prompt: please remove the breadcrumbs section
  User-Prompt: now we just have an empty toolbar, lets remove that as well
  ```

### Plan Section
- **When to include**: Include when working from a structured plan (e.g., plan.md)
- **Format**: Use "Plan:" prefix followed by indented plan details
- **Content**: Include specific plan section and task checklist status
- **Example format**:
  ```
  Plan: Commit 1 - Add Vite Dependencies and Basic Configuration
    ✅ Add Vite and related dependencies to package.json
    ✅ Add standardized npm scripts to package.json  
    ✅ Run npm install successfully
    ✅ Ensure Vite build works
    ✅ Run validation tests - all pass
  ```

### Co-Authors Section  
- Must be the final lines of the commit message.
- Use exactly two lines per assistant used, chosen from the Attribution Registry below.
- If multiple assistants contributed, include each assistant’s two lines in order of primary → secondary, grouped by assistant.
- Do not mix identities across vendors (tool and model must match).
- Do not use placeholders; use the exact strings.

#### Assistant Attribution Registry
- OpenAI Codex
  - Co-Authored-By: OpenAI Codex 🤖 <noreply@openai.com>
  - Co-Authored-By: GPT-5 <noreply@openai.com>
- Claude Code (Anthropic)
  - Co-Authored-By: Claude Code 🤖 <noreply@anthropic.com>
  - Co-Authored-By: Sonnet 4 <noreply@anthropic.com>
- Gemini CLI (Google)
  - Co-Authored-By: Gemini CLI 🤖 <noreply@google.com>
  - Co-Authored-By: Gemini Pro <noreply@google.com>
  
Note: If you use a different model variant (e.g., Sonnet 3.5), substitute the model line with the exact variant name from the vendor (e.g., "Sonnet 3.5").

### Example Commit Message (OpenAI Codex):
```
feat: add dark mode toggle to settings

Implement user-requested dark mode functionality with persistent storage
and smooth transitions between light and dark themes.

User-Prompt: I want to add a dark mode toggle to the application settings. Make sure you run the tests and build when you're done!

Co-Authored-By: OpenAI Codex 🤖 <noreply@openai.com>
Co-Authored-By: GPT-5 <noreply@openai.com>
```

### Example with Multiple User Prompts (Claude Code):
```
refactor: transform UI to blog layout and configure homepage

Remove navigation sidebar, simplify footer, remove breadcrumbs and toolbar.
Create comprehensive blog structure with landing page and sample posts.
Configure Antora homepage routing to serve blog at root URL.

User-Prompt: Lets change the name of @preview-src/index.adoc to kitchensink.adoc @preview-src/home.adoc
User-Prompt: please remove the navigation section
User-Prompt: Cleanup the footer. Only keep the Asciidoctor logo and the text "Produced by Antora and Asciidoctor"
User-Prompt: please center the contents of the footer as well
User-Prompt: please remove the breadcrumbs section
User-Prompt: now we just have an empty toolbar, lets remove that as well
User-Prompt: Please create a home.adoc as the landing page of the blog
User-Prompt: lets set @preview-src/home.adoc as the home page in @preview-src/ui-model.yml

Co-Authored-By: Claude Code 🤖 <noreply@anthropic.com>
Co-Authored-By: Sonnet 4 <noreply@anthropic.com>
```

### Example (Gemini CLI):
```
chore(docs): refresh contributing guide examples

Clarify commit formatting rules and co-author attribution policy.

User-Prompt: Align docs with current tooling and attribution policy.

Co-Authored-By: Gemini CLI 🤖 <noreply@google.com>
Co-Authored-By: Gemini Pro <noreply@google.com>
```

### Example of Splitting Changes Across Multiple Commits:
If you were to split the above into multiple commits, you might have:

**Commit 1 - UI Cleanup:**
```
refactor: remove navigation sidebar and simplify footer

User-Prompt: please remove the navigation section
User-Prompt: Cleanup the footer. Only keep the Asciidoctor logo and the text "Produced by Antora and Asciidoctor"
User-Prompt: please center the contents of the footer as well
```

**Commit 2 - Blog Content:**
```
feat: create blog homepage and sample content

User-Prompt: Please create a home.adoc as the landing page of the blog
User-Prompt: lets set @preview-src/home.adoc as the home page in @preview-src/ui-model.yml
```

### Shell‑Safe Commit Message Submission

When creating commits from the CLI, ensure messages use real line breaks and avoid shell interpretation issues:

- Prefer a heredoc with `git commit -F -` to pass the full message with literal newlines.
  - Use a single‑quoted heredoc delimiter to prevent expansion of backticks, `$()`, and `\n` sequences.
  - Example:
    ```bash
    git commit -F - <<'MSG'
    feat: concise subject line

    Body line 1
    Body line 2

    Plan:
      ✅ Step A
      ✅ Step B

    User-Prompt: original user instruction 1
    User-Prompt: original user instruction 2

    Co-Authored-By: OpenAI Codex 🤖 <noreply@openai.com>
    Co-Authored-By: GPT-5 <noreply@openai.com>
    MSG
    ```

- Do not embed literal `\n` characters in `-m` strings; they will be committed as `\n` text, not newlines.
- Avoid using double quotes around `-m` when the message contains backticks (`` `like this` ``) or `$`; shells may perform command substitution. Use single quotes or a heredoc instead.
- Multiple `-m` flags are acceptable to create separate paragraphs, but still avoid `\n` escapes — use actual line breaks or separate `-m` options.

Following these tips will ensure commit messages render correctly and include the required sections (Plan, User-Prompt, Co-Authors) with proper formatting.

## Worktrees & Branch Policy (Agents)

**Never work directly on `main`. Always use a worktree on a dedicated branch.**  
This prevents accidental commits to `main`, keeps agent changes isolated, and simplifies review.

### Branch naming (aligned with Conventional Commits)
Use: `{type}/{scope}-{task}-{actor}`

- **type**: `feat|fix|refactor|docs|test|chore|ci`
- **scope**: app area (e.g., `search`, `auth`, `ui`)
- **task**: short kebab descriptor (e.g., `bm25`, `oauth-flow`)
- **actor**: who/what is doing the work (e.g., `claude`, `gemini`, `human`)

**Examples**
- `feat/search-bm25-claude`
- `fix/auth-oauth-flow-gemini`
- `refactor/ui-tables-human`

> Commit messages must still follow Conventional Commits (e.g., `feat(search): add BM25 scorer`).

### Standard workflow

1) **Sync base**
```bash
git fetch origin
```

2) **Create a task base branch from main (no direct work on it)**
```bash
git switch -c feat/search-bm25-base origin/main
```

3) **Create per-actor branches from the task base**
```bash
git branch feat/search-bm25-claude   feat/search-bm25-base
git branch feat/search-bm25-gemini   feat/search-bm25-base
git branch feat/search-bm25-human    feat/search-bm25-base
```

4) **Add worktrees for each actor branch**
```bash
git worktree add ../wt-claude feat/search-bm25-claude
git worktree add ../wt-gemini feat/search-bm25-gemini
git worktree add ../wt-human  feat/search-bm25-human
```

5) **Identify per worktree (recommended)**
```bash
cd ../wt-claude
git config user.name  "Claude Code (bot)"
git config user.email "claude+bot@example.com"
```

6) **Do the work in the worktree, never in the primary checkout**
```bash
# inside ../wt-claude
# run tools, tests, etc.
git add -p
git commit -m "feat(search): add BM25 scorer"
git push -u origin feat/search-bm25-claude
```

7) **Keep in sync (rebase from the base branch)**
```bash
git fetch origin
git rebase origin/feat/search-bm25-base
```

8) **PR flow**
- Open PRs from each actor branch → `feat/search-bm25-base`.
- After review/merge, open a single PR from `feat/search-bm25-base` → `main`.
- Squash-merge recommended to maintain clean history.

### Guardrails
- Protect `main`; block pushes except via PR.
- Pre-commit + CI must pass before merge.
- Keep changes small and scoped; split unrelated changes.
- If two actors must touch the same file, merge one PR, rebase the other.

### Cleanup
```bash
# after merging
git worktree prune
git branch -d feat/search-bm25-claude feat/search-bm25-gemini feat/search-bm25-human
rm -rf ../wt-claude ../wt-gemini ../wt-human
```
