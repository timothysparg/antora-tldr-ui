import { promises as fs } from "node:fs";
import { dirname, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import autoprefixer from "autoprefixer";
import cssnano from "cssnano";
import postcssCalc from "postcss-calc";
import postcssCustomProperties from "postcss-custom-properties";
import postcssImport from "postcss-import";
import postcssUrl from "postcss-url";
import { defineConfig } from "vite";
import zipPack from "vite-plugin-zip-pack";

const __dirname = dirname(fileURLToPath(import.meta.url));
const isProduction = process.env.NODE_ENV === "production";

export default defineConfig(async () => {
	const { viteStaticCopy } = await import("vite-plugin-static-copy");

	const customPropertiesPlugin = postcssCustomProperties({
		disableDeprecationNotice: true,
		preserve: true,
	});
	const calcPlugin = postcssCalc({});

	const config = {
		root: __dirname,
		base: "",
		build: {
			outDir: "build",
			emptyOutDir: true,
			assetsDir: ".",
			cssCodeSplit: true,
			minify: "esbuild",
			rollupOptions: {
				input: {
					"js/site": resolve(__dirname, "src/js/site.js"),
					"js/vendor/tabs": resolve(__dirname, "src/js/vendor/tabs.esm.js"),
					"js/vendor/highlight": resolve(
						__dirname,
						"src/js/vendor/highlight.esm.js",
					),
					"js/vendor/docsearch": resolve(
						__dirname,
						"src/js/vendor/docsearch.esm.js",
					),
					"css/site": resolve(__dirname, "src/css/site.css"),
					"css/home": resolve(__dirname, "src/css/home.css"),
				},
				output: {
					entryFileNames: ({ name }) => `${name}.js`,
					chunkFileNames: "js/[name]-[hash].js",
					assetFileNames: ({ name }) => {
						if (!name) {
							return "assets/[name]-[hash][extname]";
						}

						const cssNameMap = {
							"site.css": "css/site.css",
							"home.css": "css/home.css",
							"css/site.css": "css/site.css",
							"css/home.css": "css/home.css",
						};
						if (name in cssNameMap) return cssNameMap[name];
						if (/\.(woff2?|ttf|eot)$/.test(name))
							return "fonts/[name][extname]";
						if (name.endsWith(".css")) return "css/[name][extname]";
						return "assets/[name][extname]";
					},
					preserveModules: false,
				},
			},
		},
		css: {
			postcss: {
				plugins: [
					postcssImport(),
					postcssUrl({
						url: ({ url }) => {
							const fontRewrites = [
								{
									prefix: "../../node_modules/@fontsource/roboto/files/",
									dest: "../fonts/",
								},
								{
									prefix: "../../node_modules/@fontsource/roboto-mono/files/",
									dest: "../fonts/",
								},
								{
									prefix: "../../node_modules/@fontsource/comfortaa/files/",
									dest: "../fonts/",
								},
							];
							for (const { prefix, dest } of fontRewrites) {
								if (url.startsWith(prefix)) {
									return url.replace(prefix, dest);
								}
							}
							return url;
						},
					}),
					customPropertiesPlugin,
					calcPlugin,
					autoprefixer(),
					...(isProduction ? [cssnano()] : []),
				],
			},
		},
		plugins: [
			viteStaticCopy({
				targets: [
					{ src: resolve(__dirname, "src/layouts/**/*"), dest: "layouts" },
					{ src: resolve(__dirname, "src/partials/**/*"), dest: "partials" },
					{ src: resolve(__dirname, "src/helpers/**/*"), dest: "helpers" },
					{ src: resolve(__dirname, "src/img/**/*"), dest: "img" },

					{
						src: resolve(__dirname, "node_modules/@fontsource/roboto/files/*"),
						dest: "fonts",
					},
					{
						src: resolve(
							__dirname,
							"node_modules/@fontsource/roboto-mono/files/*",
						),
						dest: "fonts",
					},
					{
						src: resolve(
							__dirname,
							"node_modules/@fontsource/comfortaa/files/*",
						),
						dest: "fonts",
					},
					{ src: resolve(__dirname, "src/ui.yml"), dest: "." },
				],
			}),
			zipPack({
				inDir: "build",
				outDir: __dirname,
				outFileName: "ui-bundle.zip",
			}),
		],
	};

	return config;
});
