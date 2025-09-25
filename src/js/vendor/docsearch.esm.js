import docsearch from "@docsearch/js";

const FORWARD_BACK_TYPE = 2;
const SEARCH_FILTER_ACTIVE_KEY = "docs:search-filter-active";
const SAVED_SEARCH_STATE_KEY = "docs:saved-search-state";
const SAVED_SEARCH_STATE_VERSION = "1";

activateSearch(
	docsearch,
	document.getElementById("search-script").dataset,
);

function activateSearch(docsearch, config) {
	// Note: @docsearch/js automatically loads its own CSS, so we don't need appendStylesheet
	var searchField = document.getElementById(config.searchFieldId || "search");
	var searchInput = searchField.querySelector('.query');

	// Initialize DocsSearch with the new API
	var docSearchInstance = docsearch({
		appId: config.appId,
		apiKey: config.apiKey,
		indexName: config.indexName,
		container: searchInput,
		searchParameters: {
			hitsPerPage: parseInt(config.pageSize, 10) || 20,
		},
		insights: false, // Disable insights unless explicitly needed
	});

	// Add keyboard shortcuts for search
	document.addEventListener("keydown", function(e) {
		var target = e.target || {};
		if (e.altKey || target.isContentEditable || "disabled" in target) return;

		// Ctrl+/ or 's' to focus search
		if (e.ctrlKey ? e.key === "/" : e.key === "s") {
			searchInput.focus();
			e.preventDefault();
			e.stopPropagation();
		}
	});

	// Handle browser navigation
	window.addEventListener("pageshow", function(e) {
		var navigation = window.performance.navigation || {};
		if ("type" in navigation && navigation.type === FORWARD_BACK_TYPE) {
			if (window.sessionStorage.getItem("docs:restore-search-on-back") === "true") {
				if (!window.matchMedia("(min-width: 1024px)").matches) {
					var burger = document.querySelector(".navbar-burger");
					if (burger) burger.click();
				}
				searchInput.focus();
			}
		}
		window.sessionStorage.removeItem("docs:restore-search-on-back");
	});

	// Set autofocus if configured
	if (searchInput.getAttribute("autofocus") != null) {
		searchInput.focus();
	}
}

