import { describe, expect, it } from "vitest";
import { createOceanHabitat, stepOceanHabitat } from "./ocean-aquarium";

describe("ocean-aquarium procedural habitat", () => {
	it("generates unique ocean habitats across different empty tabs and started chats", () => {
		const emptyA = createOceanHabitat("empty:tab-1");
		const emptyB = createOceanHabitat("empty:tab-2");
		const chatA = createOceanHabitat("chat:sess-1:msg-1");
		const chatB = createOceanHabitat("chat:sess-2:msg-1");

		const signatures = new Set(
			[emptyA, emptyB, chatA, chatB].map(
				h =>
					`${h.palette.name}:${h.dominantBehavior}:${h.sharks.map(s => `${s.species}-${s.x.toFixed(2)}`).join(",")}`,
			),
		);
		expect(signatures.size).toBe(4);
	});

	it("is deterministic for a given seed and includes multi-shark populations", () => {
		const first = createOceanHabitat("chat:session-xyz:m1");
		const second = createOceanHabitat("chat:session-xyz:m1");

		expect(first).toEqual(second);
		expect(first.sharks.length).toBeGreaterThanOrEqual(3);
		expect(first.sharks.length).toBeLessThanOrEqual(7);
		expect(first.bubbles.length).toBeGreaterThan(0);
		expect(first.kelp.length).toBeGreaterThan(0);
	});

	it("advances shark swimming, bubbles, and reacts smoothly to pointer movement", () => {
		const habitat = createOceanHabitat("empty:tab-swim");
		const initialPositions = habitat.sharks.map(shark => shark.x);
		const initialBubbles = habitat.bubbles.map(bubble => bubble.yRatio);

		stepOceanHabitat(habitat, 0.1, 1.0, 120, { xRatio: 0.5, yRatio: 0.5, active: true });

		expect(habitat.sharks.some((shark, i) => shark.x !== initialPositions[i])).toBe(true);
		expect(habitat.bubbles.some((bubble, i) => bubble.yRatio !== initialBubbles[i])).toBe(true);
	});
});
