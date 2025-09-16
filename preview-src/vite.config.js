import fs from "node:fs";
import path, { resolve } from "node:path";
import { defineConfig } from "vite";
import previewSitePlugin from "../plugins/vite-plugin-preview-site.js";

export default defineConfig({
	root: resolve(__dirname),

	plugins: [
		previewSitePlugin(),
		// Custom plugin to serve images and assets
		{
			name: "serve-images",
			configureServer(server) {
				server.middlewares.use((req, res, next) => {
					if (req.url?.startsWith("/img/")) {
						// Serve images from src/img directory
						const filePath = path.join(__dirname, "..", "src", req.url);
						if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
							const ext = path.extname(filePath).toLowerCase();
							let mimeType = "application/octet-stream";

							// Set appropriate MIME types
							if (ext === ".png") mimeType = "image/png";
							else if (ext === ".jpg" || ext === ".jpeg")
								mimeType = "image/jpeg";
							else if (ext === ".gif") mimeType = "image/gif";
							else if (ext === ".svg") mimeType = "image/svg+xml";
							else if (ext === ".ico") mimeType = "image/x-icon";
							else if (ext === ".webp") mimeType = "image/webp";

							res.setHeader("Content-Type", mimeType);
							return fs.createReadStream(filePath).pipe(res);
						}
					}
					next();
				});
			},
		},
		// Map UI asset URLs to source files for Vite dev transform
		{
			name: "rewrite-ui-assets",
			configureServer(server) {
				server.middlewares.use((req, _res, next) => {
					if (!req.url) return next();

					// /js/vendor/<name>.bundle.js -> src/js/vendor/<name>.esm.js
					let m = req.url.match(/^\/js\/vendor\/(.+)\.bundle\.js(\?.*)?$/);
					if (m) {
						const name = m[1];
						const esmPath = path.join(
							__dirname,
							"..",
							"src",
							"js",
							"vendor",
							`${name}.esm.js`,
						);
						if (fs.existsSync(esmPath)) req.url = `/@fs/${esmPath}`;
						return next();
					}

					// /css/vendor/<name>.css -> src/css/vendor/<name>.css
					m = req.url.match(/^\/css\/vendor\/(.+)\.css(\?.*)?$/);
					if (m) {
						const cssPath = path.join(
							__dirname,
							"..",
							"src",
							"css",
							"vendor",
							`${m[1]}.css`,
						);
						if (fs.existsSync(cssPath)) req.url = `/@fs/${cssPath}`;
						return next();
					}

					// /css/(site|home).css -> src/css/<name>.css
					m = req.url.match(/^\/css\/(site|home)\.css(\?.*)?$/);
					if (m) {
						const cssPath = path.join(
							__dirname,
							"..",
							"src",
							"css",
							`${m[1]}.css`,
						);
						if (fs.existsSync(cssPath)) req.url = `/@fs/${cssPath}`;
						return next();
					}

					// /js/site.js -> src/js/site.js
					if (req.url.startsWith("/js/site.js")) {
						const jsPath = path.join(__dirname, "..", "src", "js", "site.js");
						if (fs.existsSync(jsPath)) req.url = `/@fs/${jsPath}`;
						return next();
					}
					next();
				});
			},
		},
	],

	server: {
		port: 5253,
		host: "0.0.0.0",
		open: false,
	},

	build: {
		outDir: "../preview-dist",
		emptyOutDir: true,
		rollupOptions: {
			input: resolve(__dirname, "index.html"),
		},
	},

	resolve: {
		alias: {
			"~": resolve(__dirname, ".."),
			"/css": resolve(__dirname, "../src/css"),
			"/js": resolve(__dirname, "../src/js"),
		},
	},

	publicDir: false,
});
