import { describe, expect, it } from "bun:test";
import { FreeAndLocalDiscovery, FREE_CLOUD_PROVIDERS } from "./free-and-local-discovery";

describe("FreeAndLocalDiscovery", () => {
	const discovery = new FreeAndLocalDiscovery();

	it("should inspect system resources accurately and determine feasibility", () => {
		const profile = discovery.inspectSystemResources();
		expect(profile.totalRamGb).toBeGreaterThan(0);
		expect(profile.cpuCores).toBeGreaterThan(0);
		expect(typeof profile.cpuModel).toBe("string");
		expect(["lightweight_only", "medium_feasible", "heavy_feasible", "cloud_recommended"]).toContain(
			profile.localModelFeasibility,
		);
	});

	it("should provide catalog of 100% free cloud providers with free tiers", () => {
		const providers = discovery.getFreeCloudProviders();
		expect(providers.length).toBeGreaterThanOrEqual(4);
		expect(providers.some((p) => p.id === "gemini-free")).toBe(true);
		expect(providers.some((p) => p.id === "openrouter-free")).toBe(true);
		expect(providers.some((p) => p.id === "groq-free")).toBe(true);
	});

	it("should probe local endpoints safely without throwing errors if offline", async () => {
		const endpoints = await discovery.probeLocalEndpoints(150);
		expect(endpoints.length).toBe(3);
		for (const ep of endpoints) {
			expect(typeof ep.name).toBe("string");
			expect(typeof ep.available).toBe("boolean");
			expect(Array.isArray(ep.models)).toBe(true);
		}
	});
});
