declare module "postcss-calc" {
	import type { AcceptedPlugin } from "postcss";

	interface CalcOptions {
		precision?: number;
		warnWhenCannotResolve?: boolean;
		preserve?: boolean;
		mediaQueries?: boolean;
		selectors?: boolean;
		inlineMatchers?: string[];
	}

	export default function postcssCalc(options?: CalcOptions): AcceptedPlugin;
}
