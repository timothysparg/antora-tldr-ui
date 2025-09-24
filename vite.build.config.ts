import { promises as fs } from "node:fs";
import { dirname, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import autoprefixer from "autoprefixer";
import cssnano from "cssnano";
import JSZip from "jszip";
import postcssCalc from "postcss-calc";
import postcssCustomProperties from "postcss-custom-properties";
import postcssImport from "postcss-import";
import postcssUrl from "postcss-url";
import { defineConfig } from "vite";

const __dirname = dirname(fileURLToPath(import.meta.url));
const isProduction = process.env.NODE_ENV === "production";

const collectFiles = async (directory: string): Promise<string[]> => {
	const dirents = await fs.readdir(directory, { withFileTypes: true });
	const nested = await Promise.all(
		dirents.map((dirent) => {
			const entryPath = resolve(directory, dirent.name);
			return dirent.isDirectory() ? collectFiles(entryPath) : entryPath;
		}),
	);
	return nested.flat();
};

export default defineConfig(async () => {
	const { viteStaticCopy } = await import("vite-plugin-static-copy");
	const archivePlugin = {
		name: "ui-bundle-zip",
		apply: "build" as const,
		enforce: "post" as const,
		async closeBundle() {
			const versionTag =
				process.env.TAG ?? `v${process.env.npm_package_version ?? ""}`;
			const uiPath = resolve(__dirname, "build", "ui.yml");
			try {
				let content = await fs.readFile(uiPath, "utf8");
				content = content.replace(/\n?version:\s.*$/m, "");
				if (!content.endsWith("\n")) {
					content += "\n";
				}
				content += `version: ${versionTag}\n`;
				await fs.writeFile(uiPath, content);
			} catch (_error) {
				// Ignore if ui.yml is absent
			}
			const baseDir = resolve(__dirname, "build");
			const entries = await collectFiles(baseDir);
			const zip = new JSZip();
			try {
				const uiContent = await fs.readFile(uiPath);
				zip.file("ui.yml", uiContent);
			} catch (_error) {
				// Ignore if ui.yml is absent when zipping
			}
			for (const filePath of entries) {
				const relPath = relative(baseDir, filePath).split("\\").join("/");
				if (relPath === "ui.yml") continue;
				const contents = await fs.readFile(filePath);
				zip.file(relPath, contents);
			}
			const zipPath = resolve(__dirname, "ui-bundle.zip");
			await fs.rm(zipPath, { force: true });
			const archive = await zip.generateAsync({
				type: "nodebuffer",
				compression: "DEFLATE",
				compressionOptions: { level: 9 },
			});
			await fs.writeFile(zipPath, archive);
		},
	};

	return {
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
					"js/vendor/tabs": resolve(__dirname, "src/js/vendor/tabs.bundle.js"),
					"js/vendor/highlight": resolve(
						__dirname,
						"src/js/vendor/highlight.bundle.js",
					),
					"js/vendor/docsearch": resolve(
						__dirname,
						"src/js/vendor/docsearch.bundle.js",
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

						const cssNameMap: Record<string, string> = {
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
							const fontRewrites: Array<{ prefix: string; dest: string }> = [
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
					postcssCustomProperties({
						disableDeprecationNotice: true,
						preserve: true,
					}),
					postcssCalc(),
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
						src: resolve(__dirname, "src/css/vendor/**/*"),
						dest: "css/vendor",
					},
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
			archivePlugin,
		],
	};
});
