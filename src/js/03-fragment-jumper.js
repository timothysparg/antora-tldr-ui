(() => {
	const article = document.querySelector("article.doc");
	const toolbar = document.querySelector(".toolbar");
	const supportsScrollToOptions = "scrollTo" in document.documentElement;

	function decodeFragment(hash) {
		return (
			hash && (~hash.indexOf("%") ? decodeURIComponent(hash) : hash).slice(1)
		);
	}

	function computePosition(el, sum) {
		return article.contains(el)
			? computePosition(el.offsetParent, el.offsetTop + sum)
			: sum;
	}

	function jumpToAnchor(e) {
		if (e) {
			if (e.altKey || e.ctrlKey) return;
			window.location.hash = `#${this.id}`;
			e.preventDefault();
		}
		const y = computePosition(this, 0) - toolbar.getBoundingClientRect().bottom;
		const instant = e === false && supportsScrollToOptions;
		instant
			? window.scrollTo({ left: 0, top: y, behavior: "instant" })
			: window.scrollTo(0, y);
	}

	window.addEventListener("load", function jumpOnLoad(_e) {
		let fragment, target;
		fragment = decodeFragment(window.location.hash);
		if (fragment) {
			target = document.getElementById(fragment);
		}
		if (fragment && target) {
			jumpToAnchor.call(target, false);
			setTimeout(jumpToAnchor.bind(target, false), 250);
		}
		window.removeEventListener("load", jumpOnLoad);
	});

	Array.prototype.slice
		.call(document.querySelectorAll('a[href^="#"]'))
		.forEach((el) => {
			let fragment, target;
			fragment = decodeFragment(el.hash);
			if (fragment) {
				target = document.getElementById(fragment);
			}
			if (fragment && target) {
				el.addEventListener("click", jumpToAnchor.bind(target));
			}
		});
})();
