/**
 * Pre-paint theme script — loaded synchronously from <head>, BEFORE any
 * module. The prefs IPC that resolves the real theme is async, so without
 * this every cold start painted the light default first: a white flash for
 * dark-theme users. Mirrors the scheme written by lib/themes.ts
 * (applyThemeByName → localStorage "omp.themeScheme"), and the chosen
 * theme's background ("omp.themeBackground") when it is a plain color.
 */
(function () {
	try {
		var scheme = localStorage.getItem("omp.themeScheme");
		if (scheme === "system") {
			scheme =
				window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches
					? "dark"
					: "light";
		} else if (!scheme) {
			scheme = "dark";
		}
		if (scheme === "dark" || scheme === "light") {
			document.documentElement.dataset.theme = scheme;
			var background = localStorage.getItem("omp.themeBackground");
			var plain = background && window.CSS && CSS.supports("color", background) && !/var\(/.test(background);
			document.documentElement.style.backgroundColor = plain ? background : scheme === "dark" ? "#0a0c10" : "#ffffff";
			document.documentElement.style.colorScheme = scheme;
		}
	} catch (e) {
		document.documentElement.dataset.theme = "dark";
		document.documentElement.style.backgroundColor = "#0a0c10";
		document.documentElement.style.colorScheme = "dark";
	}
})();
