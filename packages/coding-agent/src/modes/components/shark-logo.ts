import { TERMINAL, visibleWidth } from "@oh-my-pi/pi-tui";
import { DISPLAY_NAME } from "@oh-my-pi/pi-utils";

/** ASCII shark from stackedlol/ascii-sharks, shared by the welcome, setup, and cockpit surfaces. */
export const SHARK_LOGO = [
	"                            ;'",
	"                             %%'",
	"                              .t;.               .oooo",
	"                               S;:S%              %8S8.",
	"                                ;:tt%t '..        XX%%S",
	"t'                            ''XSSS8SSX%XX8#.    %XSX%",
	" :;'               ;.''X8%8XX%%S%%S%SStt%tSX8S#X8't%ttt.",
	"  ::%'       ''8XXXSSt%Stttttt%t8@%%@%8@8%Sttt%%%%SSSSS%tt.",
	"  'SXXtt%t%%%S%:;StS%ttSS%tSXSt88@@%8%@8%tStS%%X%SS%%S%;;t",
	" .@##88#@...'@@@@#@8@88X88#XXXSX8SX88SX8%SS%S%%S88St%t%%%.",
	"  %;%t             :.    '.'##@###@X#888XX##8@@@#.X%XS%.",
	" .%t                            ;%%%#@@##@@@.     SXS%%",
	" t.                            .%;%%%.            %%XXS",
	"                              '%t:t              .SXSS'",
	"                             '::'.                ooooo",
	"                            .S'",
	"                            .",
] as const;

const PRODUCT_WORDS = DISPLAY_NAME.match(/^(oh)(my)(.+)$/i)?.slice(1) ?? [DISPLAY_NAME];
export const SHARK_WORDMARK = PRODUCT_WORDS.map(word => {
	const titleCase = word.charAt(0).toUpperCase() + word.slice(1);
	return [...titleCase].join(" ");
}).join("   ");
export const SHARK_WIDTH = Math.max(...SHARK_LOGO.map(line => visibleWidth(line)));

/** Multi-stop blue palette for the diagonal gradient. */
export const GRADIENT_STOPS: ReadonlyArray<readonly [number, number, number]> = [
	[11, 98, 196],
	[57, 167, 255],
	[143, 230, 255],
];

/** 256-color blue ramp fallback when truecolor isn't available. */
export const GRADIENT_RAMP_256 = [25, 27, 33, 39, 45, 51, 87, 123];

/** Half-width of the shine highlight band, expressed in gradient-t units. */
export const SHINE_HALF_WIDTH = 0.18;

export interface ShineConfig {
	strength: number;
	pos: number;
}

export function gradientEscape(t: number, shine?: ShineConfig): string {
	const shineStrength = shine && shine.strength > 0 ? shine.strength : 0;
	const shinePos = shine ? shine.pos : 0;
	if (TERMINAL.trueColor) {
		const stops = GRADIENT_STOPS;
		const seg = t * (stops.length - 1);
		const i = Math.min(stops.length - 2, Math.floor(seg));
		const f = seg - i;
		const a = stops[i];
		const b = stops[i + 1];
		let r = a[0] + (b[0] - a[0]) * f;
		let g = a[1] + (b[1] - a[1]) * f;
		let bl = a[2] + (b[2] - a[2]) * f;
		if (shineStrength > 0) {
			const dist = Math.abs(t - shinePos);
			const intensity = Math.max(0, 1 - dist / SHINE_HALF_WIDTH) * shineStrength;
			if (intensity > 0) {
				r += (255 - r) * intensity;
				g += (255 - g) * intensity;
				bl += (255 - bl) * intensity;
			}
		}
		return `\x1b[38;2;${Math.round(r)};${Math.round(g)};${Math.round(bl)}m`;
	}
	const ramp = GRADIENT_RAMP_256;
	let idx = Math.min(ramp.length - 1, Math.max(0, Math.floor(t * (ramp.length - 1) + 0.5)));
	if (shineStrength > 0) {
		const dist = Math.abs(t - shinePos);
		const intensity = Math.max(0, 1 - dist / SHINE_HALF_WIDTH) * shineStrength;
		if (intensity > 0.5) idx = ramp.length - 1;
	}
	return `\x1b[38;5;${ramp[idx]}m`;
}

export function gradientLogo(lines: readonly string[], phase = 0, shine?: ShineConfig): string[] {
	const reset = "\x1b[0m";
	const rows = lines.length;
	const cols = Math.max(...lines.map(l => l.length));
	const xSpan = Math.max(1, cols - 1);
	const ySpan = Math.max(1, rows - 1);
	const normalizedPhase = ((phase % 1) + 1) % 1;
	return lines.map((line, y) => {
		let result = "";
		for (let x = 0; x < line.length; x++) {
			const char = line[x];
			if (char === " ") {
				result += char;
				continue;
			}
			const base = (x / xSpan + y / ySpan) / 2;
			const t = normalizedPhase === 0 ? base : (base + normalizedPhase) % 1;
			result += gradientEscape(t, shine) + char + reset;
		}
		return result;
	});
}

export const INTRO_MS = 3000;
export const INTRO_TICK_MS = 33;
export const INTRO_SWEEPS = 2.5;
export const INTRO_SHINE_TRAVERSALS = 3;

export function introLogoFrame(progress: number): string[] {
	const eased = 1 - (1 - progress) ** 3;
	const phase = ((((1 - eased) * INTRO_SWEEPS) % 1) + 1) % 1;
	const shinePos = (((progress * INTRO_SHINE_TRAVERSALS) % 1) + 1) % 1;
	const shineStrength = (1 - eased) ** 1.5;
	return gradientLogo(SHARK_LOGO, phase, { strength: shineStrength, pos: shinePos });
}

export const REST_FRAME = gradientLogo(SHARK_LOGO, 0);
