# Changelog

## 1.0.0 (2025-09-25)


### ⚠ BREAKING CHANGES

* Replace .nvmrc with .mise.toml configuration

### Features

* add continue.json configuration with enhanced commit guidelines ([32eb359](https://github.com/timothysparg/antora-tldr-ui/commit/32eb359e63bbca165cc986cb4d5e386e9b912301))
* add kroki diagram rendering support ([9bd164a](https://github.com/timothysparg/antora-tldr-ui/commit/9bd164af10a659c42b563232f8faf4e8793bd419))
* add MCP configuration and Claude Code documentation ([eb6d358](https://github.com/timothysparg/antora-tldr-ui/commit/eb6d3582a74c85b342659108eb3f522c1bdff44f))
* add Vite dependencies and npm scripts for migration foundation ([4e63379](https://github.com/timothysparg/antora-tldr-ui/commit/4e633799bd89ec3bc7de2089f7d3542987eda0e4))
* complete Gulp removal and finalize Vite migration ([c83305d](https://github.com/timothysparg/antora-tldr-ui/commit/c83305ded3a08821dc39c233be42edd9f45cd906))
* configure blog homepage and add comprehensive sample content ([dcccd75](https://github.com/timothysparg/antora-tldr-ui/commit/dcccd7518cb0174304c7b11fd5ae4a29ce64ce2e))
* configure Handlebars template processing for Vite ([4965436](https://github.com/timothysparg/antora-tldr-ui/commit/4965436b54e285c54f94f20febadcc4ed66a191d))
* configure Vite development server with preview integration ([e53416b](https://github.com/timothysparg/antora-tldr-ui/commit/e53416bf26a3d093a5a223a89870772bad72f1b8))
* configure Vite for asset processing ([04b28ad](https://github.com/timothysparg/antora-tldr-ui/commit/04b28ad9b083538b015de35564f01c87cdea8922))
* create complete Vite bundle pipeline with ui-bundle.zip ([aa078f2](https://github.com/timothysparg/antora-tldr-ui/commit/aa078f2f55ff55db13a7cd75d0601c9d61ee330c))
* create modern Vite preview system and consolidate plugins ([dda046c](https://github.com/timothysparg/antora-tldr-ui/commit/dda046cdc5ddc58f5fc7b19213af2feed61bd4e2))
* implement HTML linting with djLint for Handlebars templates ([#14](https://github.com/timothysparg/antora-tldr-ui/issues/14)) ([ad74209](https://github.com/timothysparg/antora-tldr-ui/commit/ad742095afd700afec339ef8d3e55fe4f23173ba)), closes [#8](https://github.com/timothysparg/antora-tldr-ui/issues/8)
* make article titles clickable hyperlinks in blog homepage ([15b8b26](https://github.com/timothysparg/antora-tldr-ui/commit/15b8b26bfedbf5c8a696385f68f711f84106d73a))
* migrate from .nvmrc to mise for Node.js version management ([709b0ae](https://github.com/timothysparg/antora-tldr-ui/commit/709b0ae05a4b9433460b546f58da65dcf83b049c))
* migrate JavaScript tooling to biome ([f728632](https://github.com/timothysparg/antora-tldr-ui/commit/f728632766a888c30fad1b424c242de786237767))
* remove breadcrumbs and toolbar sections ([bd4f65a](https://github.com/timothysparg/antora-tldr-ui/commit/bd4f65aa40e0da88054125e6f14725cb7b22fd79))
* remove Edit this Page link from toolbar ([a239f84](https://github.com/timothysparg/antora-tldr-ui/commit/a239f8488321dfb7884305a2280911be98e0f1a7))
* remove left sidebar navigation section ([401f073](https://github.com/timothysparg/antora-tldr-ui/commit/401f0734304429a8b24aa18200a179064271245c))
* remove version dropdown and support menu from navigation ([49aefbe](https://github.com/timothysparg/antora-tldr-ui/commit/49aefbeb39d1e39330f783c096f5e51be7f8154c))
* replace live-server with browser-sync for dev server ([#26](https://github.com/timothysparg/antora-tldr-ui/issues/26)) ([971bd18](https://github.com/timothysparg/antora-tldr-ui/commit/971bd18bfa95b2d2e6ffe1066a9107e86ed31f3b))
* simplify and center footer layout ([7fe9ebc](https://github.com/timothysparg/antora-tldr-ui/commit/7fe9ebc34f155656ad2ef798f322b04b6d89a47e))
* **vendor:** bundle tabs and highlight as ESM entries and load as modules (Phase 4c) ([c854992](https://github.com/timothysparg/antora-tldr-ui/commit/c85499256ce16eb5f884406ff534387567717b1c))


### Bug Fixes

* add AsciiDoc routing middleware to Vite preview server ([f6b89e9](https://github.com/timothysparg/antora-tldr-ui/commit/f6b89e95267789cadcb5faa869775443c96adb66))
* add Vite middleware to serve Asciidoctor logos in preview ([be03630](https://github.com/timothysparg/antora-tldr-ui/commit/be036304cdd0e118a1a6bc87d3dc2cf5a76a696c))
* **fonts:** modernize Fontsource integration ([c2a568b](https://github.com/timothysparg/antora-tldr-ui/commit/c2a568bce50ea1ec9753d5998a043282cd818399)), closes [#3](https://github.com/timothysparg/antora-tldr-ui/issues/3)
* resolve CSS and assets loading issues in Vite development server ([b78ddde](https://github.com/timothysparg/antora-tldr-ui/commit/b78dddebf6404cdbd1fd302f030ad306cece3d8f))
* update MCP Playwright server configuration and add development preview instructions ([bce774b](https://github.com/timothysparg/antora-tldr-ui/commit/bce774b37db4281dc7fbc98d64d11dec3e8200f8))
