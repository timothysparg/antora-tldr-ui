(() => {
	const SECT_CLASS_RX = /^sect[0-5](?=$| )/;

	const navContainer = document.querySelector(".nav-container");
	if (!navContainer) return;
	const navToggle = document.querySelector(".toolbar .nav-toggle");

	navToggle.addEventListener("click", showNav);
	navContainer.addEventListener("click", trapEvent);

	const nav = navContainer.querySelector(".nav");
	const navMenuToggle = navContainer.querySelector(".nav-menu-toggle");
	const menuPanel = nav.querySelector("[data-panel=menu]");
	const navBounds = {
		encroachingElement: document.querySelector("footer.footer"),
	};
	let currentPageItem;

	window.addEventListener(
		"load",
		fitNavInit,
	); /* needed if images shift the content */
	window.addEventListener("resize", fitNavInit);

	if (!menuPanel) return fitNavInit({});

	if (menuPanel.classList.contains("is-loading")) {
		currentPageItem =
			findItemForHash() || menuPanel.querySelector(".is-current-url");
		if (currentPageItem) {
			activateCurrentPath(currentPageItem);
			scrollItemToMidpoint(menuPanel, currentPageItem);
		} else {
			menuPanel.scrollTop = 0;
		}
		menuPanel.classList.remove("is-loading");
	} else {
		currentPageItem = menuPanel.querySelector(".is-current-page");
		let match = currentPageItem;
		if (!match || match.classList.contains("is-provisional")) {
			match = findItemForHash(true);
		}
		if (match) {
			const update = !!currentPageItem;
			currentPageItem = match;
			activateCurrentPath(currentPageItem, update);
			scrollItemToMidpoint(menuPanel, currentPageItem);
		}
	}

	fitNavInit({});

	find(menuPanel, ".nav-item-toggle").forEach((btn) => {
		btn.addEventListener("click", toggleActive.bind(btn.parentElement));
		const nextElement = btn.nextElementSibling;
		if (nextElement?.classList.contains("nav-text")) {
			nextElement.style.cursor = "pointer";
			nextElement.addEventListener(
				"click",
				toggleActive.bind(btn.parentElement),
			);
		}
	});

	if (navMenuToggle && menuPanel.querySelector(".nav-item-toggle")) {
		navMenuToggle.style.display = "";
		navMenuToggle.addEventListener("click", function () {
			const collapse = !this.classList.toggle("is-active");
			find(menuPanel, ".nav-item > .nav-item-toggle").forEach((btn) => {
				collapse
					? btn.parentElement.classList.remove("is-active")
					: btn.parentElement.classList.add("is-active");
			});
			if (currentPageItem) {
				if (collapse) activateCurrentPath(currentPageItem);
				scrollItemToMidpoint(menuPanel, currentPageItem);
			} else {
				menuPanel.scrollTop = 0;
			}
		});
	}

	nav
		.querySelector("[data-panel=explore] .context")
		.addEventListener("click", () => {
			find(nav, "[data-panel]").forEach((panel) => {
				// NOTE logic assumes there are only two panels
				panel.classList.toggle("is-active");
			});
		});

	// NOTE prevent text from being selected by double click
	menuPanel.addEventListener("mousedown", (e) => {
		if (e.detail > 1) e.preventDefault();
	});

	function onHashChange() {
		const navItem =
			findItemForHash() || menuPanel.querySelector(".is-current-url");
		if (!navItem || navItem === currentPageItem) return;
		currentPageItem = navItem;
		activateCurrentPath(currentPageItem, true);
		scrollItemToMidpoint(menuPanel, currentPageItem);
	}

	if (menuPanel.querySelector('.nav-link[href^="#"]'))
		window.addEventListener("hashchange", onHashChange);

	function activateCurrentPath(navItem, update) {
		if (update) {
			find(menuPanel, ".nav-item.is-active").forEach((el) => {
				el.classList.remove("is-current-path", "is-current-page", "is-active");
			});
		}
		let ancestor = navItem;
		while (ancestor !== menuPanel) {
			ancestor = ancestor.parentNode;
			if (!ancestor) break;
			if (ancestor.classList.contains("nav-item"))
				ancestor.classList.add("is-current-path", "is-active");
		}
		navItem.classList.add("is-current-page", "is-active");
	}

	function toggleActive() {
		if (this.classList.toggle("is-active")) {
			const padding = parseFloat(window.getComputedStyle(this).marginTop);
			const rect = this.getBoundingClientRect();
			const menuPanelRect = menuPanel.getBoundingClientRect();
			const overflowY = Math.round(
				rect.bottom - menuPanelRect.top - menuPanelRect.height + padding,
			);
			if (overflowY > 0)
				menuPanel.scrollTop += Math.min(
					Math.round(rect.top - menuPanelRect.top - padding),
					overflowY,
				);
		}
	}

	function showNav(e) {
		if (navToggle.classList.contains("is-active")) return hideNav(e);
		trapEvent(e);
		const html = document.documentElement;
		if (/mobi/i.test(window.navigator.userAgent)) {
			if (
				Math.round(parseFloat(window.getComputedStyle(html).minHeight)) !==
				window.innerHeight
			) {
				html.style.setProperty("--vh", `${window.innerHeight / 100}px`);
			} else {
				html.style.removeProperty("--vh");
			}
		}
		html.classList.add("is-clipped--nav");
		navToggle.classList.add("is-active");
		navContainer.classList.add("is-active");
		html.addEventListener("click", hideNav);
	}

	function hideNav(e) {
		trapEvent(e);
		const html = document.documentElement;
		html.classList.remove("is-clipped--nav");
		navToggle.classList.remove("is-active");
		navContainer.classList.remove("is-active");
		html.removeEventListener("click", hideNav);
	}

	function trapEvent(e) {
		e.stopPropagation();
	}

	function findItemForHash(articleOnly) {
		let hash = window.location.hash;
		if (!hash) return;
		if (hash.indexOf("%")) hash = decodeURIComponent(hash);
		if (hash.indexOf('"')) hash = hash.replace(/(?=")/g, "\\");
		let navLink =
			!articleOnly && menuPanel.querySelector(`.nav-link[href="${hash}"]`);
		if (navLink) return navLink.parentNode;
		const target = document.getElementById(hash.slice(1));
		if (!target) return;
		const scope = document.querySelector("article.doc");
		let ancestor = target;
		while (ancestor !== scope) {
			ancestor = ancestor.parentNode;
			if (!ancestor) break;
			let id = ancestor.id;
			if (!id)
				id =
					SECT_CLASS_RX.test(ancestor.className) &&
					ancestor.firstElementChild?.id;
			if (id) {
				navLink = menuPanel.querySelector(`.nav-link[href="#${id}"]`);
				if (navLink) return navLink.parentNode;
			}
		}
	}

	function scrollItemToMidpoint(panel, item) {
		const panelRect = panel.getBoundingClientRect();
		if (panel.scrollHeight === Math.round(panelRect.height)) return; // not scrollable
		const linkRect = item.querySelector(".nav-link").getBoundingClientRect();
		panel.scrollTop += Math.round(
			linkRect.top - panelRect.top - (panelRect.height - linkRect.height) * 0.5,
		);
	}

	function find(from, selector) {
		return [].slice.call(from.querySelectorAll(selector));
	}

	function fitNavInit(e) {
		window.removeEventListener("scroll", fitNav);
		if (window.getComputedStyle(navContainer).position === "fixed") return;
		navBounds.availableHeight = window.innerHeight;
		navBounds.preferredHeight = navContainer.getBoundingClientRect().height;
		if (fitNav() && e.type !== "resize" && currentPageItem)
			scrollItemToMidpoint(menuPanel, currentPageItem);
		window.addEventListener("scroll", fitNav);
	}

	function fitNav() {
		const scrollDatum =
			menuPanel && menuPanel.scrollTop + menuPanel.offsetHeight;
		const occupied =
			navBounds.availableHeight -
			navBounds.encroachingElement.getBoundingClientRect().top;
		let modified;
		if (occupied > 0) {
			const newHeight = `${Math.max(Math.round(navBounds.preferredHeight - occupied), 0)}px`;
			modified = nav.style.height !== newHeight;
			nav.style.height = newHeight;
		} else {
			modified = !!nav.style.removeProperty("height");
		}
		if (menuPanel) menuPanel.scrollTop = scrollDatum - menuPanel.offsetHeight;
		return modified;
	}
})();
