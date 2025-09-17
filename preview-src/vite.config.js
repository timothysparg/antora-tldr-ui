import { resolve } from "node:path";
import sirv from "sirv";
import { defineConfig } from "vite";
import previewSitePlugin from "../plugins/vite-plugin-preview-site.js";

function previewStaticAssetPlugin() {
	const assetRoot = resolve(__dirname, "..", "src");

	const createMiddleware = (dev) =>
		sirv(assetRoot, {
			dev,
			tetag: true,
		});

	return {
		name: "preview-static-assets",
		configureServer(server) {
			server.middlewares.use(createMiddleware(true));
		},
		configurePreviewServer(server) {
			server.middlewares.use(createMiddleware(false));
		},
	};
}

export default defineConfig({
	root: resolve(__dirname),

	plugins: [previewSitePlugin(), previewStaticAssetPlugin()],

	server: {
		port: 5253,
		host: "0.0.0.0",
		open: false,
		fs: {
			allow: [resolve(__dirname, "..")],
		},
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
