import { describe, expect, it } from "bun:test";
import { FreeAndLocalDiscovery } from "./free-and-local-discovery";

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

	// --- 5+ NEW TDD SPECIFIC TESTS ---

	it("TDD 1: should complete parallel local probes rapidly within deadline", async () => {
		const start = Date.now();
		const timeout = 120;
		// 3 candidates in parallel should not take 3 * 120ms (360ms); should finish in ~150ms
		const endpoints = await discovery.probeLocalEndpoints(timeout);
		const duration = Date.now() - start;

		expect(endpoints.length).toBe(3);
		expect(duration).toBeLessThan(timeout * 3);
	});

	it("TDD 2: should determine model quantization feasibility (q4, q8, fp16) based on host RAM", () => {
		const profile = discovery.inspectSystemResources();
		expect(profile.quantization).toBeDefined();

		const validLevels = ["feasible", "tight", "insufficient"];
		expect(validLevels).toContain(profile.quantization.q4_k_m);
		expect(validLevels).toContain(profile.quantization.q8_0);
		expect(validLevels).toContain(profile.quantization.fp16);

		// If total RAM is at least 32GB, fp16 must be feasible
		if (profile.totalRamGb >= 32) {
			expect(profile.quantization.fp16).toBe("feasible");
			expect(profile.quantization.q4_k_m).toBe("feasible");
		}
	});

	it("TDD 3: should validate free cloud catalog completeness, valid help URLs and context windows", () => {
		const providers = discovery.getFreeCloudProviders();
		for (const prov of providers) {
			expect(prov.id.length).toBeGreaterThan(0);
			expect(prov.name.length).toBeGreaterThan(0);
			expect(prov.keyHelpUrl).toMatch(/^https:\/\//);
			expect(prov.recommendedModels.length).toBeGreaterThan(0);
			expect(typeof prov.contextWindowTokens).toBe("number");
			expect(prov.contextWindowTokens).toBeGreaterThanOrEqual(32768);
		}

		// Verify key recommended free models are present
		const allModels = providers.flatMap((p) => p.recommendedModels);
		expect(allModels.some((m) => m.includes("deepseek-r1"))).toBe(true);
		expect(allModels.some((m) => m.includes("gemini"))).toBe(true);
		expect(allModels.some((m) => m.includes("llama-3.3-70b"))).toBe(true);
	});

	it("TDD 4: should detect GPU acceleration profile and details structure", () => {
		const profile = discovery.inspectSystemResources();
		expect(profile.gpu).toBeDefined();
		expect(typeof profile.gpu.hasGpu).toBe("boolean");
		expect(["nvidia_cuda", "apple_metal", "amd_rocm", "unknown", "none"]).toContain(profile.gpu.type);
		expect(profile.gpu.details.length).toBeGreaterThan(0);
	});

	it("TDD 5: should categorize hardware platform and CPU cores consistently", () => {
		const profile = discovery.inspectSystemResources();
		expect(["win32", "linux", "darwin"]).toContain(profile.platform);
		expect(profile.cpuCores).toBeGreaterThanOrEqual(1);
		expect(profile.freeRamGb).toBeGreaterThanOrEqual(0);
		expect(profile.freeRamGb).toBeLessThanOrEqual(profile.totalRamGb);
	});
});
