declare module "postcss-custom-properties" {
	import type { AcceptedPlugin } from "postcss";

	interface CustomPropertiesOptions {
		preserve?: boolean | "computed";
		importFrom?: string | string[] | Record<string, unknown>;
		exportTo?: string | string[] | Record<string, unknown>;
		disableDeprecationNotice?: boolean;
	}

	export default function postcssCustomProperties(
		options?: CustomPropertiesOptions,
	): AcceptedPlugin;
}
