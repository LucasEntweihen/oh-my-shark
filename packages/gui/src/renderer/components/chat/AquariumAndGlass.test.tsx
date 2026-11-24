import { parseHTML } from "linkedom";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it } from "vitest";
import { tabChipLabel, useTabsStore } from "../../stores/tabs";
import { Button, OmskLogo } from "../common";
import { LiquidGlassLayer } from "./LiquidGlassLayer";
import { OceanAquariumBackdrop } from "./OceanAquariumBackdrop";

const { document, window, Event, HTMLElement, Node } = parseHTML("<html><body></body></html>");
Object.assign(globalThis as Record<string, unknown>, {
	document,
	window,
	Event,
	HTMLElement,
	Node,
	IS_REACT_ACT_ENVIRONMENT: true,
});

let container: InstanceType<typeof HTMLElement> | null = null;
let root: Root | null = null;

afterEach(async () => {
	await act(async () => {
		root?.unmount();
	});
	container?.remove();
	container = null;
	root = null;
	useTabsStore.getState().reset();
});

describe("OhMyShark aquarium, liquid glass, brand mark, and enhanced tabs", () => {
	it("renders OceanAquariumBackdrop behind LiquidGlassLayer, OmskLogo, and tactile Button", async () => {
		container = document.createElement("div");
		document.body.appendChild(container);
		root = createRoot(container as unknown as Element);

		await act(async () => {
			root?.render(
				<div className="relative">
					<OceanAquariumBackdrop seedKey="empty:tab-demo" />
					<LiquidGlassLayer />
					<OmskLogo size={36} />
					<Button variant="primary">Launch</Button>
				</div>,
			);
		});

		const aquarium = container.querySelector('[data-ocean-aquarium="true"]');
		const glass = container.querySelector('[data-liquid-glass="true"]');
		expect(aquarium).not.toBeNull();
		expect(aquarium?.getAttribute("data-aquarium-habitat")).toBeTruthy();
		expect(Number(aquarium?.getAttribute("data-aquarium-sharks"))).toBeGreaterThanOrEqual(3);
		expect(glass).not.toBeNull();
		expect(glass?.querySelector("feDisplacementMap")).not.toBeNull();
		expect(container.querySelector("img")?.getAttribute("src")).toBe("./omsk-logo.png");
		expect(container.querySelector("button")?.textContent).toContain("Launch");
	});

	it("supports tab pinning and custom inline tab renaming", () => {
		useTabsStore.setState({
			tabs: [
				{ id: "t1", cwd: "/repo/a", status: "ready", kind: "agent", unreadDone: false },
				{ id: "t2", cwd: "/repo/b", status: "ready", kind: "chat", unreadDone: false },
			],
			activeTabId: "t1",
		});

		useTabsStore.getState().togglePinTab("t2");
		const pinnedFirst = useTabsStore.getState().tabs[0];
		expect(pinnedFirst?.id).toBe("t2");
		expect(pinnedFirst?.pinned).toBe(true);

		useTabsStore.getState().renameTab("t2", "Shark Reef API");
		const renamed = useTabsStore.getState().tabs.find(t => t.id === "t2")!;
		expect(tabChipLabel(renamed, useTabsStore.getState().tabs)).toBe("Shark Reef API");
	});
});
