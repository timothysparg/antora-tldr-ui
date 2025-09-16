module.exports = ({
	data: {
		root: { contentCatalog = { getSiteStartPage() {} } },
	},
}) => contentCatalog.getSiteStartPage();
