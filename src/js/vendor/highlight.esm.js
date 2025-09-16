// ESM wrapper to bundle highlight.js v11 with selected languages
import hljs from "highlight.js/lib/core";
import asciidoc from "highlight.js/lib/languages/asciidoc";
import clojure from "highlight.js/lib/languages/clojure";
import css from "highlight.js/lib/languages/css";
import groovy from "highlight.js/lib/languages/groovy";
import java from "highlight.js/lib/languages/java";
import javascript from "highlight.js/lib/languages/javascript";
import json from "highlight.js/lib/languages/json";
import markdown from "highlight.js/lib/languages/markdown";
import python from "highlight.js/lib/languages/python";
import ruby from "highlight.js/lib/languages/ruby";
import scala from "highlight.js/lib/languages/scala";
import shell from "highlight.js/lib/languages/shell";
import xml from "highlight.js/lib/languages/xml";
import yaml from "highlight.js/lib/languages/yaml";

hljs.registerLanguage("asciidoc", asciidoc);
hljs.registerLanguage("clojure", clojure);
hljs.registerLanguage("css", css);
hljs.registerLanguage("groovy", groovy);
hljs.registerLanguage("java", java);
hljs.registerLanguage("javascript", javascript);
hljs.registerLanguage("json", json);
hljs.registerLanguage("markdown", markdown);
hljs.registerLanguage("python", python);
hljs.registerLanguage("ruby", ruby);
hljs.registerLanguage("scala", scala);
hljs.registerLanguage("shell", shell);
hljs.registerLanguage("xml", xml);
hljs.registerLanguage("yaml", yaml);

Array.prototype.slice
	.call(document.querySelectorAll("pre code.hljs[data-lang]"))
	.forEach((node) => {
		hljs.highlightElement(node);
	});
