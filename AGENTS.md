# AGENTS.md

This file provides guidance to AI coding agents working with code in this repository.

## Project Overview

This is the Asciidoctor Docs UI project – a custom Antora UI bundle for the Asciidoctor documentation site. The project builds on top of Antora's default UI, but the preview workflow now relies on Antora itself (driven by mise tasks). Vite (configured in `vite.config.ts`) orchestrates the JS/CSS build pipeline using PostCSS and esbuild, and the resulting bundle ships the Handlebars layouts, partials, helpers, fonts, and images consumed by Antora.

## Development Commands

### Common Development Tasks
- `mise run dev` – Build the UI bundle once, then launch the live preview stack (live-server plus preview/theme watchers). Use Ctrl+C to stop. If you background the process manually, clean up `.devserver.pid` afterward.
- `mise run preview` – Execute a single Antora build; regenerates `public/` and refreshes `ui-bundle.zip`.
- `mise run bundle` – Produce the distribution archive (runs CSS/JS optimizers and asset packaging). This task exports a `TAG` environment variable (defaulting to `v${package.json.version}`) so Vite’s bundler can stamp the version into `build/ui.yml`; set `TAG` explicitly when you need a custom tag (e.g., release candidates).
- `mise run clean` – Remove `public/`, `build/`, `.antora-cache`, and `ui-bundle.zip`.
- `hk run check --all` / `hk run fix --all` – Run or auto-fix lint rules through hk (Biome, stylelint, djLint, actionlint, `tsc --noEmit`, and `mise run validate`).

### Specialized Tasks
- `mise run watch:preview` – Watch Antora preview content (`preview-src/modules/ROOT`) and rebuild the site when AsciiDoc changes.
- `mise run watch:theme` – Watch UI theme sources (`src/layouts`, `src/partials`, `src/helpers`, `src/css`, `src/js`, `src/img`) and trigger preview rebuilds. A `--` separator is already baked into the task so watchexec handles flags correctly.
- `mise run serve` – Serve the latest `public/` directory on http://127.0.0.1:5252 without watchers.
- `mise run validate` – Sanity-check that required Antora files and directories exist before attempting a build. Expand this guard (or wire it into hk tasks) if future workflows need stronger preflight checks.

### Preview Dev Server
- `mise run dev` orchestrates the full developer loop: it runs `mise run preview` once, then starts `mise run serve`, `mise run watch:preview`, and `mise run watch:theme`. All three tasks stream to the terminal; press Ctrl+C once to shut them down cleanly.
- If a previous agent left the dev server running, stop it with `kill $(cat .devserver.pid)` and delete `.devserver.pid` before starting a new session.
- The live preview serves content from `public/`. When the watchers rebuild, live-server automatically refreshes connected browsers.

## Architecture

### Build System
- **Antora CLI**: `preview-src/antora-playbook.yml` drives preview generation against the checked-out UI sources. Antora writes the static site to `public/`.
- **Mise**: Orchestrates tool installation and wraps repeatable tasks (`preview`, `bundle`, `dev`, `watch:*`, `clean`).
- **Vite**: Library-mode build defined in `vite.config.ts` emits JS and CSS bundles (minified via esbuild) and copies referenced fonts through PostCSS.
- **PostCSS**: Inline plugin chain (import, url copy, custom properties, calc, autoprefixer, cssnano) executes inside the Vite build to produce `css/site.css` and `css/home.css`.
- **live-server + watchexec**: Provide local serving and rebuild-on-change flows during development.

### Source Structure
- `src/` – Primary UI assets
  - `css/` – Stylesheets (including vendor CSS)
  - `js/` – JavaScript modules and vendor bundles
  - `layouts/`, `partials/`, `helpers/` – Handlebars templates and helpers
  - `img/` – Images and icons
  - `ui.yml` – UI descriptor included in the bundle
- `preview-src/` – Antora preview component
  - `antora.yml` – Component descriptor (`name`, `nav`, `start_page`)
  - `antora-playbook.yml` – Playbook used for local preview builds
  - `modules/ROOT/pages/` – Sample AsciiDoc content (home, kitchen sink, components, etc.)
  - `modules/ROOT/nav.adoc` – Navigation structure for the preview
  - `modules/ROOT/images/` – Preview-only images
- `build/` – Production build output assembled during `mise run bundle`
- `public/` – Generated preview site output created by Antora
- `scripts/` – Node.js utilities retained for release automation (preview generation no longer lives here)

#### Template Architecture (Handlebars)

**Layouts (`src/layouts/`):**
- `default.hbs` – Main page layout template (includes head, header, body, footer)
- `404.hbs` – Error page layout for 404 pages

**Partials (`src/partials/`):**
The partials are organized in a hierarchical structure:

*Page Structure:*
- `head.hbs` – Aggregates all head-related partials
  - `head-prelude.hbs` – Early head content
  - `head-title.hbs` – Page title generation
  - `head-styles.hbs` – CSS stylesheet links
  - `head-info.hbs` – Metadata and OpenGraph tags
  - `head-meta.hbs` – Meta tags
  - `head-scripts.hbs` – Head JavaScript includes
  - `head-icons.hbs` – Favicon and icon links
- `header.hbs` – Aggregates header components
  - `header-scripts.hbs` – Header JavaScript
  - `header-content.hbs` – Main navigation bar with logo, search, and menu
- `body.hbs` – Main content wrapper
  - `nav.hbs` – Left sidebar navigation container
    - `nav-menu.hbs` – Component/version navigation menu
    - `nav-explore.hbs` – Site exploration menu
    - `nav-tree.hbs` – Hierarchical page navigation
  - `main.hbs` – Article content area
    - `toolbar.hbs` – Page tools (breadcrumbs, edit link, version selector)
    - `toc.hbs` – Table of contents
    - `article.hbs` – Main article content
    - `article-404.hbs` – 404 error content
- `footer.hbs` – Aggregates footer components
  - `footer-content.hbs` – Footer links, branding, and legal information
  - `footer-scripts.hbs` – Footer JavaScript includes

*Component Partials:*
- `breadcrumbs.hbs` – Navigation breadcrumb trail
- `edit-this-page.hbs` – Edit page link functionality
- `page-versions.hbs` – Version selector dropdown
- `pagination.hbs` – Previous/next page navigation
- `nav-toggle.hbs` – Mobile navigation toggle button

*Template Composition:*
The templates use Handlebars partial inclusion (`{{> partialName}}`) to compose the final page structure. Each partial is focused on a specific UI component or functionality, allowing for modularity and maintainability.

### Key Technologies
- **Antora** – Generates preview content directly from the current repository state.
- **Vite** – Bundles JavaScript, extracts CSS, and emits static assets for the UI bundle.
- **PostCSS** – Handles CSS composition and optimization.
- **Handlebars** – Template engine for HTML generation (templates copied into the bundle).
- **Highlight.js** – Syntax highlighting (v11.11.1).
- **Fontsource** – Provides self-hosted font files that are copied into the bundle.
- **watchexec / live-server** – Enable local rebuilds and preview serving.

### Asset Management Best Practices

#### Dependency Management
- All third-party libraries (JS and CSS) MUST be added as dependencies in `package.json`.
- Do NOT commit library files directly into the `src` directory.

#### CSS Best Practices
- Import vendor CSS directly from `node_modules` within the main application CSS files (e.g., `src/css/site.css`).
- Example: `@import "@some-package/dist/style.css";`

#### JavaScript Best Practices
- Use ES Modules (`import`/`export`) for all new JavaScript code.
- If a third-party library needs to be bundled separately (as is the case for `docsearch`, `highlight.js`, and `tabs.js`), create a modern ESM wrapper file in `src/js/vendor/` that imports the library.
- Add this wrapper file as a new entry point in `vite.config.js`. This keeps vendor code separate from the main `site.js` bundle.
- Avoid legacy formats like IIFEs and CommonJS (`require`) unless absolutely necessary for compatibility with an old library.

### Font Management

Fontsource packages are imported through CSS (`@import '@fontsource/<family>/<weight>.css'`). During `mise run bundle`, Vite (via `vite-plugin-static-copy` and a PostCSS rewrite) copies the referenced font files from `node_modules/@fontsource/*/files/` into `build/fonts/` and rewrites `url(...)` references to target those local copies. Adding a new font requires installing the appropriate Fontsource package, importing the desired weights in `src/css/fonts.css`, and updating any CSS variables in `src/css/vars.css`.

## Development Workflow

### Local Development
1. Run `mise install` to provision Node.js, hk, watchexec, and other CLI dependencies.
2. Run `hk setup` to install hk's git hooks locally.
3. Run `npm ci` to install Node.js dependencies.
4. Launch the preview loop with `mise run dev`. This builds the bundle, starts live-server on http://127.0.0.1:5252, and begins watching both preview content and theme sources.
5. To rebuild once without watchers, use `mise run preview`.
6. Generated preview output lives in `public/`; delete via `mise run clean` when needed.

### Bundle Creation
1. Run `mise run bundle` to produce `build/ui-bundle.zip`.
2. The command runs Vite's production build, copies templates/assets/fonts, appends the UI descriptor, and zips the bundle.
3. Bundle artifacts are staged in `build/`; only `ui-bundle.zip` needs to be published.

### Release Process
- Automated via Release Please (GitHub Actions) which opens a release PR and, on merge, creates a semver tag and GitHub Release.
- A separate `on: release` workflow builds the UI and uploads `build/ui-bundle.zip` to the GitHub Release.
- Must pass linting to create the release.
- Consumers can fetch the latest bundle from `https://github.com/timothysparg/antora-tldr-ui/releases/latest/download/ui-bundle.zip`.

### Preview System (Antora-based)

The preview system mirrors production by letting Antora render the sample content locally.

- Component metadata lives in `preview-src/antora.yml` with `start_page: ROOT:index.adoc` and navigation defined in `modules/ROOT/nav.adoc`.
- Preview content resides under `preview-src/modules/ROOT/pages/`; add new `.adoc` files here and register them in `nav.adoc`.
- `preview-src/antora-playbook.yml` points Antora at the current repository (`start_path: preview-src`) and uses `ui.bundle.url: ../../src` so preview builds render with in-repo templates.
- Run `mise run preview` for a one-off build or `mise run dev` for continuous development. Both paths call `mise run bundle`, which executes the Vite build before Antora regenerates the preview content.
- When structural changes cause stale output, run `mise run clean` followed by a fresh preview build.

### Antora Preview Configuration and Homepage Routing

- The homepage is `preview-src/modules/ROOT/pages/index.adoc`; Antora resolves it through `start_page: ROOT:index.adoc` in `antora.yml`.
- Navigation is controlled by `preview-src/modules/ROOT/nav.adoc`. Keep entries in sync when adding or renaming pages.
- Images referenced from preview content should live in `preview-src/modules/ROOT/images/` and use `image::ROOT:filename[]` so Antora resolves them correctly.
- Because Antora writes to `public/`, clear that directory with `mise run clean` if routes appear stale after major changes.
- Use `mise run validate` to confirm required Antora files exist before starting a new preview session.

## Important Notes

- Node.js version managed via `.mise.toml` (migrated from .nvmrc).
- UI bundle is designed specifically for the Antora static site generator.
- Source maps are available for JavaScript builds; CSS maps are disabled in production by default.
- Project supports deploy previews via Netlify for pull requests.
- Optional automation/search/documentation tools may be available via `.mcp.json`.
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
   mise run dev
   ```
   The server will be available at http://localhost:5252. This task runs Antora once and then attaches the live-server + watchexec watchers.

2. **Take Screenshots with Playwright MCP**:
   - Use `mcp__playwright__browser_navigate` to open the local development server
   - Use `mcp__playwright__browser_take_screenshot` to capture screenshots
   - Screenshots are saved to `.playwright-mcp/` directory
   - Example: Full page screenshot saved as `local-dev-homepage.png`
   - Use `mcp__playwright__browser_close` to close the browser when finished

3. **Development Server Management**:
   - Server runs in foreground with live reload; use another terminal for edits or background it manually
   - Changes to `src/` themes or `preview-src/modules/ROOT` content trigger rebuilds and refreshes
   - Use Ctrl+C once to stop all watchers; if backgrounded, `kill $(cat .devserver.pid)` then remove the pid file

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
  - Compare structural differences in the. accessibility tree

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
 2. Run `mise run clean` to clear all build artifacts
  3. Ensure only one `index.adoc` file exists with the desired homepage content
 4. Restart the development server with `mise run dev`
  5. Verify that `public/index.html` is generated with correct content

#### Preview Content File Organization
- **Homepage**: Always use `index.adoc` for the homepage content
- **Other Content**: Use descriptive names (e.g., `blog-post-name.adoc`, `kitchensink.adoc`)
- **Configuration**: The `ui-model.yml` file controls routing and must be consistent with actual filenames

#### Build Cache Considerations
- Build artifacts are cached in the `public/` directory
- When making structural changes to content files or routing configuration, always run `mise run clean` followed by a fresh `mise run dev`
- Changes to `ui-model.yml` require a server restart to take effect

## Important Notes

- Node.js version managed via `.mise.toml` (migrated from .nvmrc).
- UI bundle is designed specifically for the Antora static site generator.
- Source maps available in development, optional for production builds.
- Project supports deploy previews via Netlify for pull requests.
- Optional automation/search/documentation tools may be available via `.mcp.json`.

# Agent Workflow Notes

- Before committing check if the changes that have been introduced outdate or necessitate changes in the @README.adoc
- Before committing check if the changes that have been introduced outdate or necessitate changes in the @AGENTS.md
- Before committing run `hk run check --all` and apply `hk run fix --all` as needed so the commit can proceed
- When committing follow the conventional commits syntax for commit messages
- If changes do not seem like a logical grouping, make a suggestion of how to group the changes into multiple commits to the user
- After committing changes, clear the session/context if your tooling supports it
- Before editing any files, create and switch to a task branch following the Branch Workflow guidance

## Task Planning & Logging (PLAN.md lifecycle)

**Goal:** When an agent (e.g., Copilot, Claude, Gemini, Codex) is asked to perform a task, it must continuously maintain a canonical **PLAN.md** at the repo root that captures the plan, progress, and all human↔agent interactions.

### Lifecycle rules
- **On startup:** If **PLAN.md** exists, *prompt the user once* — “PLAN.md found. Should I resume this task?”  
  - If user says **yes**, continue appending to the existing file.  
  - If user says **no**, either (a) archive to `logs/PLAN-YYYYMMDD-HHMM.md` or (b) delete per user instruction, then start fresh.
- **During execution:** After **every** material step (prompt exchange, tool/LLM run, code change, commit, test), append the relevant sections below, updating statuses.
- **Completion:** When the task is verifiably done (tests pass, acceptance criteria met, user confirms), remove **PLAN.md** from the repo. If an audit trail is wanted, move it to `logs/` instead of deleting.

### Required sections in PLAN.md (always kept up to date)
1. **Task**  
   - Short title and problem statement.  
   - Acceptance criteria (bullet list).
2. **Architectural Approach**  
   - Key decisions, trade-offs, and affected components.  
   - Alternatives considered (brief).
3. **Implementation Plan**  
   - Ordered steps with owners (if multi-agent) and estimated scope.  
   - **Status** per step: `todo | in-progress | blocked | done` with timestamps.
4. **Breakdown & Progress**  
   - Checklist of sub-tasks with current % complete.  
   - Blocking issues and links (PRs, commits, issues).
5. **User Prompts & Agent Responses (chronological log)**  
   - For each turn: timestamp, agent name, *user prompt*, *agent response summary*.  
   - Include key decisions or commands issued; elide verbose outputs unless essential.
6. **LLMs & Tools Used**  
   - Running list of LLMs (e.g., Copilot, Claude, Gemini, Codex) and tools (linters, build, scripts) invoked for this task, with purpose per entry.

#### Recommended PLAN.md template
```markdown
# Task
- **Title:** …
- **Problem:** …
- **Acceptance Criteria:** 
  - [ ] …

## Architectural Approach
- Decisions: …
- Trade-offs: …
- Alternatives: …

## Implementation Plan
| Step | Description | Owner | Status | Notes | Updated |
|------|-------------|-------|--------|-------|---------|
| 1    | …           | …     | todo   | …     | 2025-09-22 10:15 |

## Breakdown & Progress
- Overall: 0–100% (update as you go)
- Sub-tasks:
  - [ ] …
  - [ ] …

## User Prompts & Agent Responses (log)
- **2025-09-22 10:12** · *User:* “…”
  - *Agent (Claude Code):* summary of response/commands

## LLMs & Tools Used
- Claude Code — plan synthesis, refactor suggestions
- GitHub Copilot — inline code completions
- Gemini — test generation
- hk, Biome, stylelint, djlint — lint/fix
```

### Agent execution rules
- Always create/update **PLAN.md** on first actionable prompt for a task.  
- After each tool/LLM invocation or code change, update **Implementation Plan** statuses and **User Prompts & Agent Responses**.  
- Prefer concise summaries; link to commits/PRs instead of pasting large diffs.  
- Never include proprietary model internals; list only tool/model names you invoked and why.  
- If switching agents, the new agent must read **PLAN.md** first and continue the same structure.

### Privacy & issues/PR hygiene
- Do **not** paste **PLAN.md** content into Issues/PR descriptions. Summarize instead and link to commits. Keep **PLAN.md** as a working note that’s deleted or archived on completion, as above.

## Creating GitHub Issues (agents)

- Use descriptive, human-readable titles (avoid conventional commit prefixes).
- Include summary, motivation, and actionable tasks so maintainers can execute without local context.
- Only reference artifacts available in the repository or public sources; omit local-only notes such as **PLAN.md**.
- Capture dependencies explicitly when one issue blocks or requires another.
- Add a brief acknowledgment comment if it matches the repository's collaboration style.

## Creating Pull Requests (agents)

- Use descriptive, human-readable titles that clearly describe the changes.
- Include summary, motivation, test plan, and benefits in the pull request body.
- **Do NOT include agent acknowledgment lines** (e.g., "🤖 Generated with [Claude Code]") in pull request descriptions.
- Agent attribution is handled via commit message Co-Authors sections, not PR descriptions.
- Focus on technical details and impact of changes for human reviewers.
- When using the GitHub CLI, authenticate on demand via 1Password: `GITHUB_TOKEN=$(op read "op://Personal/GitHub Personal Access Token/token") gh <command>`. Quick sanity check: `GITHUB_TOKEN=$(op read "op://Personal/GitHub Personal Access Token/token") gh repo list` should return your accessible repositories.

## Commit Message Format

Commit messages must follow this exact structure:

> **Signature requirement:** Every commit must be signed with your configured signing key (GPG or SSH). Verify signatures with `git log --show-signature` before handing work off.

1. **Subject line**: Conventional commits format (e.g., "feat:", "fix:", "refactor:")
2. **Body**: Detailed description of changes (optional)
3. **Plan section**: When working from a plan (e.g., **PLAN.md**), include relevant plan details – fourth to last
4. **User-Prompt section**: Original user request(s) - third to last
5. **Resolves section**: GitHub issue resolution (e.g., "Resolves: #3") - second to last  
6. **Co-Authors section**: Attribution - must be the last lines

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
  Plan: Commit 1 - Introduce Antora preview scaffolding
    ✅ Create `preview-src/antora.yml` and `antora-playbook.yml`
    ✅ Migrate sample AsciiDoc pages into `modules/ROOT/pages`
    ✅ Add mise tasks for preview/build/watch flows
    ✅ Run `mise run preview` successfully
    ✅ Run validation tests - all pass
  ```

### Resolves Section
- **When to include**: Include when the commit resolves one or more GitHub issues
- **Format**: Use "Resolves: #<issue-number>" on its own line for each issue
- **Multiple issues**: Use separate lines for each issue:
  ```
  Resolves: #1
  Resolves: #2
  ```
- **Placement**: Must come after User-Prompt section but before Co-Authors section

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

Resolves: #42

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

Resolves: #15
Resolves: #23

Co-Authored-By: Claude Code 🤖 <noreply@anthropic.com>
Co-Authored-By: Sonnet 4 <noreply@anthropic.com>
```

### Example (Gemini CLI):
```
chore(docs): refresh contributing guide examples

Clarify commit formatting rules and co-author attribution policy.

User-Prompt: Align docs with current tooling and attribution policy.

Resolves: #8

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
  - Use a single‑quoted heredoc delimiter to prevent expansion of backticks, `$()`, and `'''` sequences.
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

- Do not embed literal `'''` characters in `-m` strings; they will be committed as `'''` text, not newlines.
- Avoid using double quotes around `-m` when the message contains backticks (`` `like this` ``) or `$`; shells may perform command substitution. Use single quotes or a heredoc instead.
- Multiple `-m` flags are acceptable to create separate paragraphs, but still avoid `'''` escapes — use actual line breaks or separate `-m` options.

Following these tips will ensure commit messages render correctly and include the required sections (Plan, User-Prompt, Co-Authors) with proper formatting.

## Branch Workflow (Agents)

**Rule #1: Never work directly on `main`. Always work from a dedicated topic branch.**

### Branch naming convention
Follow `{type}/{scope}-{task}` where values align with Conventional Commits.

- **type**: `feat | fix | refactor | docs | test | chore`
- **scope**: product area affected (e.g., `api`, `auth`, `ui`)
- **task**: short kebab descriptor for the work (e.g., `user-login`, `caching-bug`)

**Examples**
- `feat/api-user-login`
- `fix/ui-caching-bug`

> Commit messages must still follow Conventional Commits syntax (e.g., `feat(api): add user authentication endpoint`).

### Standard single-agent workflow

1. **Sync the primary clone**
   ```bash
   git switch main
   git pull --ff-only origin main
   ```
2. **Create a feature branch**
   ```bash
   git switch -c feat/api-user-login
   ```
   Set your local git identity if needed and begin editing files from this branch.
3. **Develop on the branch**
   - Keep commits focused and signed (`git commit -S ...`).
   - Run required linting and tests before every commit.
4. **Stay current with main**
   ```bash
   git fetch origin
   git rebase origin/main
   ```
   Resolve conflicts locally and continue work once the rebase completes.
5. **Publish work and open a PR**
   ```bash
   git push -u origin feat/api-user-login
   # open PR from feat/api-user-login → main
   ```
6. **Clean up after merge**
   ```bash
   git switch main
   git pull --ff-only origin main
   git branch -d feat/api-user-login
   git push origin --delete feat/api-user-login
   ```

### Guardrails & best practices
- Protect `main` via repository settings; all changes land through PRs.
- Ensure CI (lint, tests, builds) passes before merge.
- Keep branches narrowly scoped to a single logical change.
- Prefer rebasing over merge commits to keep history linear unless a maintainer requests otherwise.
- Remove local branches after they merge to keep your environment tidy and avoid accidental reuse.