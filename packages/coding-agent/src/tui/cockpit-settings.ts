import { register } from "../config/registry";

export const cfgCockpitDensity = register({
	id: "cockpit.density",
	type: "enum",
	values: ["auto", "compact", "standard", "advanced"] as const,
	default: "auto",
	ui: {
		tab: "appearance",
		group: "Cockpit",
		label: "Cockpit Density",
		description: "Information density of Deep Sea Cockpit",
		options: [
			{ value: "auto", label: "Auto (Responsive)" },
			{ value: "advanced", label: "Advanced" },
			{ value: "standard", label: "Standard" },
			{ value: "compact", label: "Compact" },
		],
	},
});

export const cfgCockpitSidebar = register({
	id: "cockpit.sidebar",
	type: "enum",
	values: ["auto", "visible", "collapsed", "hidden"] as const,
	default: "auto",
	ui: {
		tab: "appearance",
		group: "Cockpit",
		label: "Cockpit Sidebar",
		description: "Sidebar display mode for Deep Sea Cockpit",
		options: [
			{ value: "auto", label: "Auto (Responsive)" },
			{ value: "visible", label: "Always Visible" },
			{ value: "collapsed", label: "Collapsed" },
			{ value: "hidden", label: "Hidden" },
		],
	},
});

export const cfgCockpitEventStreamLines = register({
	id: "cockpit.eventStreamLines",
	type: "number",
	default: 4,
	min: 0,
	max: 16,
	step: 1,
	ui: {
		tab: "appearance",
		group: "Cockpit",
		label: "Cockpit Event Stream Rows",
		description: "Number of rows dedicated to the live event stream in Deep Sea Cockpit",
	},
});

export const cfgCockpitShowTips = register({
	id: "cockpit.showTips",
	type: "boolean",
	default: true,
	ui: {
		tab: "appearance",
		group: "Cockpit",
		label: "Cockpit Tips",
		description: "Display quick tips and shortcuts in Cockpit sidebar",
	},
});

export const cfgCockpitShowMemoryGraph = register({
	id: "cockpit.showMemoryGraph",
	type: "boolean",
	default: true,
	ui: {
		tab: "appearance",
		group: "Cockpit",
		label: "Cockpit Memory Graph",
		description: "Display Mente em Teia knowledge graph panel in Cockpit",
	},
});

export const cfgCockpitShowRecentFiles = register({
	id: "cockpit.showRecentFiles",
	type: "boolean",
	default: true,
	ui: {
		tab: "appearance",
		group: "Cockpit",
		label: "Cockpit Recent Files",
		description: "Display transactional edit engine recent files in Cockpit",
	},
});

export const cfgCockpitShowProgress = register({
	id: "cockpit.showProgress",
	type: "boolean",
	default: true,
	ui: {
		tab: "appearance",
		group: "Cockpit",
		label: "Cockpit Progress & Activity",
		description: "Display mission progress gauge and activity steps in Cockpit",
	},
});

export const cfgCockpitShowShortcuts = register({
	id: "cockpit.showShortcuts",
	type: "boolean",
	default: true,
	ui: {
		tab: "appearance",
		group: "Cockpit",
		label: "Cockpit Shortcuts Bar",
		description: "Display interactive shortcuts bar",
	},
});

export const cfgCockpitAutoHeight = register({
	id: "cockpit.autoHeight",
	type: "boolean",
	default: true,
	ui: {
		tab: "appearance",
		group: "Cockpit",
		label: "Cockpit Auto Height",
		description: "Adapt cockpit height automatically to viewport rows",
	},
});
