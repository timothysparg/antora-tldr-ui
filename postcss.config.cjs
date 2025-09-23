// PostCSS configuration extracted from Vite config
// Keep cssnano for production builds only

const production = process.env.NODE_ENV === "production";

module.exports = {
	plugins: [
		require("postcss-import"),
		require("postcss-url")({
			url: "copy",
			useHash: false,
			assetsPath: "../fonts",
		}),
		require("postcss-custom-properties")({
			disableDeprecationNotice: true,
			preserve: true,
		}),
		require("postcss-calc"),
		require("autoprefixer"),
		production && require("cssnano")(),
	].filter(Boolean),
};
