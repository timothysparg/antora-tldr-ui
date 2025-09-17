import fs from "node:fs";
import path from "node:path";
import Asciidoctor from "@asciidoctor/core";
import kroki from "asciidoctor-kroki";
import handlebars from "handlebars";
import yaml from "js-yaml";

const LAYOUTS_DIR = path.resolve(__dirname, "../src/layouts");
const PARTIALS_DIR = path.resolve(__dirname, "../src/partials");
const HELPERS_DIR = path.resolve(__dirname, "../src/helpers");
const UI_MODEL_PATH = path.resolve(__dirname, "../preview-src/ui-model.yml");

const WATCH_GLOBS = [
	toGlob(LAYOUTS_DIR, "**/*.hbs"),
	toGlob(PARTIALS_DIR, "**/*.hbs"),
	toGlob(HELPERS_DIR, "**/*.js"),
	UI_MODEL_PATH,
];

const asciidoctor = Asciidoctor();
// Create extension registry and register kroki extension
const registry = asciidoctor.Extensions.create();
kroki.register(registry);

const ASCIIDOC_ATTRIBUTES = {
	experimental: "",
	icons: "font",
	sectanchors: "",
	"source-highlighter": "highlight.js",
	"kroki-server-url": "https://kroki.io",
};

let uiModel = null;
const layouts = new Map();
let isHandlebarsInitialized = false;

async function initializeHandlebars() {
	if (isHandlebarsInitialized) return;

	// Register built-in helpers
	handlebars.registerHelper("relativize", relativize);
	handlebars.registerHelper("resolvePage", resolvePage);
	handlebars.registerHelper("resolvePageURL", resolvePageURL);

	// Register custom helpers from src/helpers
	if (fs.existsSync(HELPERS_DIR)) {
		const helperFiles = fs
			.readdirSync(HELPERS_DIR)
			.filter((f) => f.endsWith(".js"));
		for (const file of helperFiles) {
			const helperName = path.basename(file, ".js");
			const helperPath = path.join(HELPERS_DIR, file);
			try {
				const helperModule = await import(helperPath);
				handlebars.registerHelper(helperName, helperModule.default);
			} catch (error) {
				console.warn(`Failed to load helper ${helperName}:`, error.message);
			}
		}
	}

	// Register partials from src/partials
	if (fs.existsSync(PARTIALS_DIR)) {
		const partialFiles = fs
			.readdirSync(PARTIALS_DIR)
			.filter((f) => f.endsWith(".hbs"));
		for (const file of partialFiles) {
			const partialName = path.basename(file, ".hbs");
			const partialContent = fs.readFileSync(
				path.join(PARTIALS_DIR, file),
				"utf8",
			);
			handlebars.registerPartial(partialName, partialContent);
		}
	}

	// Load layouts from src/layouts
	if (fs.existsSync(LAYOUTS_DIR)) {
		const layoutFiles = fs
			.readdirSync(LAYOUTS_DIR)
			.filter((f) => f.endsWith(".hbs"));
		for (const file of layoutFiles) {
			const layoutName = path.basename(file, ".hbs");
			const layoutContent = fs.readFileSync(
				path.join(LAYOUTS_DIR, file),
				"utf8",
			);
			layouts.set(
				layoutName,
				handlebars.compile(layoutContent, { preventIndent: true }),
			);
		}
	}

	isHandlebarsInitialized = true;
}

function loadUiModel() {
	if (!uiModel) {
		if (fs.existsSync(UI_MODEL_PATH)) {
			const content = fs.readFileSync(UI_MODEL_PATH, "utf8");
			uiModel = yaml.load(content);
		} else {
			uiModel = {};
		}
	}
	return uiModel;
}

export default function previewSitePlugin() {
	return {
		name: "preview-site",

		configureServer(server) {
			registerHandlebarsWatchers(server);
			server.middlewares.use(createAsciiDocMiddleware(server.config.root));
		},

		configurePreviewServer(server) {
			server.middlewares.use(createAsciiDocMiddleware(server.config.root));
		},

		async load(id) {
			if (id.endsWith(".adoc")) {
				const filePath = id.replace(/\?.*$/, "");
				if (fs.existsSync(filePath)) {
					const content = fs.readFileSync(filePath, "utf8");
					return await processAsciiDoc(content, filePath);
				}
			}
			return null;
		},
	};
}

function registerHandlebarsWatchers(server) {
	server.watcher.add(WATCH_GLOBS);

	let watcherReady = false;

	const markReady = () => {
		watcherReady = true;
	};

	server.watcher.on("ready", markReady);

	const invalidate = (file) => {
		if (!isHandlebarsDependency(file)) return;
		resetHandlebarsState();
		server.ws.send({ type: "full-reload" });
	};

	const onAdd = (file) => {
		if (!watcherReady) return;
		invalidate(file);
	};

	const onChange = (file) => invalidate(file);
	const onUnlink = (file) => invalidate(file);

	server.watcher.on("add", onAdd);
	server.watcher.on("change", onChange);
	server.watcher.on("unlink", onUnlink);

	const cleanup = () => {
		server.watcher.off("ready", markReady);
		server.watcher.off("add", onAdd);
		server.watcher.off("change", onChange);
		server.watcher.off("unlink", onUnlink);
	};

	if (server.httpServer) server.httpServer.once("close", cleanup);
}

function createAsciiDocMiddleware(rootDir) {
	return async (req, res, next) => {
		if (!req.url || req.method !== "GET") return next();

		const requestPath = req.url.replace(/\?.*$/, "");
		if (!requestPath.endsWith(".html")) return next();

		const adocFileName = `${path.basename(requestPath, ".html")}.adoc`;
		const adocPath = path.join(rootDir, adocFileName);

		if (!fs.existsSync(adocPath)) return next();

		try {
			const content = fs.readFileSync(adocPath, "utf8");
			const html = await processAsciiDoc(content, adocPath);
			const htmlContent = JSON.parse(html.replace("export default ", ""));
			res.setHeader("Content-Type", "text/html");
			res.end(htmlContent);
		} catch (error) {
			console.error(`Error processing ${adocPath}:`, error);
			res.statusCode = 500;
			res.end("Internal Server Error");
		}
	};
}

async function processAsciiDoc(content, filePath) {
	await initializeHandlebars();
	const baseUiModel = loadUiModel();

	const pageUiModel = { ...baseUiModel };
	const url = pageUiModel.env?.DEPLOY_PRIME_URL || pageUiModel.env?.URL;
	if (url) pageUiModel.site.url = url;

	pageUiModel.page = { ...pageUiModel.page };
	pageUiModel.siteRootPath = ".";
	pageUiModel.uiRootPath = "";

	const fileName = path.basename(filePath, ".adoc");

	if (fileName === "404") {
		pageUiModel.page = { layout: "404", title: "Page Not Found" };
	} else {
		const doc = asciidoctor.load(content, {
			safe: "safe",
			attributes: ASCIIDOC_ATTRIBUTES,
			extension_registry: registry,
		});

		pageUiModel.page.attributes = Object.entries(doc.getAttributes())
			.filter(([name]) => name.startsWith("page-"))
			.reduce((accum, [name, val]) => {
				accum[name.slice(5)] = val;
				return accum;
			}, {});

		pageUiModel.page.layout = doc.getAttribute("page-layout", "default");
		if (doc.hasAttribute("docrole"))
			pageUiModel.page.role = doc.getAttribute("docrole");
		pageUiModel.page.title = doc.getDocumentTitle();
		pageUiModel.page.contents = Buffer.from(doc.convert());
	}

	const layout = layouts.get(pageUiModel.page.layout) || layouts.get("default");

	if (layout) {
		const html = layout(pageUiModel);
		return `export default ${JSON.stringify(html)}`;
	}
	throw new Error(`Layout not found: ${pageUiModel.page.layout}`);
}

function isHandlebarsDependency(file) {
	const normalized = path.normalize(file);
	return (
		normalized === UI_MODEL_PATH ||
		normalized.startsWith(`${LAYOUTS_DIR}${path.sep}`) ||
		normalized.startsWith(`${PARTIALS_DIR}${path.sep}`) ||
		normalized.startsWith(`${HELPERS_DIR}${path.sep}`)
	);
}

function resetHandlebarsState() {
	isHandlebarsInitialized = false;
	uiModel = null;
	layouts.clear();
}

function relativize(to, { data: { root } }) {
	if (!to) return "#";
	if (to.charAt() !== "/") return to;
	const from = root.page.url;
	if (!from) return (root.site.path || "") + to;
	let hash = "";
	const hashIdx = to.indexOf("#");
	if (~hashIdx) {
		hash = to.slice(hashIdx);
		to = to.slice(0, hashIdx);
	}
	if (to === from)
		return (
			hash || (to.charAt(to.length - 1) === "/" ? "./" : path.basename(to))
		);
	const rel = path.relative(path.dirname(`${from}.`), to);
	const toDir = to.charAt(to.length - 1) === "/";
	return rel
		? (toDir ? `${rel}/` : rel) + hash
		: (toDir ? "./" : `../${path.basename(to)}`) + hash;
}

function resolvePage(spec) {
	if (spec) return { pub: { url: resolvePageURL(spec) } };
}

function resolvePageURL(spec) {
	if (spec) {
		spec = spec.split(":").pop();
		return `/${spec.slice(0, spec.lastIndexOf("."))}.html`;
	}
}

function toGlob(dir, pattern) {
	return `${dir.replace(/\\/g, "/")}/${pattern}`;
}
