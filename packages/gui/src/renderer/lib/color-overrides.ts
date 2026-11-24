/**
 * Live manual color & glass customizer overrides layered on top of any active
 * theme preset. Persisted in localStorage and prefs IPC so colors survive
 * restarts without modifying theme JSON files on disk.
 */

export interface ManualColorOverrides {
	accent?: string;
	bgPrimary?: string;
	textPrimary?: string;
	oceanTop?: string;
	oceanBottom?: string;
	sharkColor?: string;
	glassBlur?: number;
	glassOpacity?: number;
}

const STORAGE_KEY = "omsk.colorOverrides";

const VALID_HEX = /^#[0-9a-fA-F]{6}$/;

function isValidHex(value: unknown): value is string {
	return typeof value === "string" && VALID_HEX.test(value);
}

export function readColorOverrides(): ManualColorOverrides {
	if (typeof window === "undefined") return {};
	try {
		const raw = window.localStorage?.getItem(STORAGE_KEY);
		if (!raw) return {};
		const parsed = JSON.parse(raw) as Record<string, unknown>;
		return {
			...(isValidHex(parsed.accent) ? { accent: parsed.accent } : {}),
			...(isValidHex(parsed.bgPrimary) ? { bgPrimary: parsed.bgPrimary } : {}),
			...(isValidHex(parsed.textPrimary) ? { textPrimary: parsed.textPrimary } : {}),
			...(isValidHex(parsed.oceanTop) ? { oceanTop: parsed.oceanTop } : {}),
			...(isValidHex(parsed.oceanBottom) ? { oceanBottom: parsed.oceanBottom } : {}),
			...(isValidHex(parsed.sharkColor) ? { sharkColor: parsed.sharkColor } : {}),
			...(typeof parsed.glassBlur === "number" && Number.isFinite(parsed.glassBlur)
				? { glassBlur: Math.max(0, Math.min(20, parsed.glassBlur)) }
				: {}),
			...(typeof parsed.glassOpacity === "number" && Number.isFinite(parsed.glassOpacity)
				? { glassOpacity: Math.max(15, Math.min(90, parsed.glassOpacity)) }
				: {}),
		};
	} catch {
		return {};
	}
}

export function saveColorOverrides(overrides: ManualColorOverrides): void {
	if (typeof window !== "undefined") {
		try {
			const clean: Record<string, unknown> = {};
			for (const [key, value] of Object.entries(overrides)) {
				if (value !== undefined && value !== "") clean[key] = value;
			}
			if (Object.keys(clean).length === 0) {
				window.localStorage?.removeItem(STORAGE_KEY);
			} else {
				window.localStorage?.setItem(STORAGE_KEY, JSON.stringify(clean));
			}
		} catch {
			// Ignore storage errors in sandboxed/test contexts
		}
		try {
			const prefs = (window as { omp?: { prefs?: { set?: (k: string, v: unknown) => Promise<void> } } }).omp?.prefs;
			void prefs?.set?.("colorOverrides", overrides);
		} catch {
			// Ignore IPC errors in tests
		}
	}
	applyManualColorOverrides(overrides);
}

export function clearColorOverrides(): void {
	saveColorOverrides({});
}

const appliedOverrideKeys = new Set<string>();

export function applyManualColorOverrides(overrides: ManualColorOverrides): void {
	if (typeof document === "undefined") return;
	const style = document.documentElement.style;
	for (const prop of appliedOverrideKeys) {
		style.removeProperty(prop);
	}
	appliedOverrideKeys.clear();
	const setProp = (prop: string, val: string) => {
		style.setProperty(prop, val);
		appliedOverrideKeys.add(prop);
	};
	if (isValidHex(overrides.accent)) {
		setProp("--omp-accent", overrides.accent);
		setProp("--omp-accent-bright", `color-mix(in srgb, ${overrides.accent} 80%, #ffffff)`);
		setProp("--omp-accent-dim", `color-mix(in srgb, ${overrides.accent} 16%, transparent)`);
		setProp("--omp-accent-glow", `color-mix(in srgb, ${overrides.accent} 32%, transparent)`);
		setProp("--omp-border-accent", `color-mix(in srgb, ${overrides.accent} 58%, transparent)`);
		setProp("--omp-selected-bg", `color-mix(in srgb, ${overrides.accent} 16%, transparent)`);
	}
	if (isValidHex(overrides.bgPrimary)) {
		setProp("--omp-bg-primary", overrides.bgPrimary);
	}
	if (isValidHex(overrides.textPrimary)) {
		setProp("--omp-text", overrides.textPrimary);
	}
	if (isValidHex(overrides.oceanTop)) {
		setProp("--omsk-ocean-top", overrides.oceanTop);
	}
	if (isValidHex(overrides.oceanBottom)) {
		setProp("--omsk-ocean-bottom", overrides.oceanBottom);
	}
	if (isValidHex(overrides.sharkColor)) {
		setProp("--omsk-shark-color", overrides.sharkColor);
	}
	if (typeof overrides.glassBlur === "number") {
		setProp("--omsk-glass-blur", `${overrides.glassBlur}px`);
	}
	if (typeof overrides.glassOpacity === "number") {
		setProp("--omsk-glass-opacity", String(overrides.glassOpacity));
	}
}
