import { describe, expect, it, beforeEach, afterEach } from "bun:test";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import * as os from "node:os";
import { ProgressiveReader } from "./progressive-reader";
import { DeterministicToolRouter } from "../router/deterministic-tool-router";

describe("ProgressiveReader & DeterministicToolRouter", () => {
	let tempDir: string;
	let reader: ProgressiveReader;
	let router: DeterministicToolRouter;

	beforeEach(async () => {
		tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "omsk-reader-test-"));
		reader = new ProgressiveReader(tempDir);
		router = new DeterministicToolRouter();
	});

	afterEach(async () => {
		await fs.rm(tempDir, { recursive: true, force: true });
	});

	it("should perform Level 1 outline reading saving context tokens", async () => {
		const sampleFile = path.join(tempDir, "service.ts");
		const sampleContent = `
import { Logger } from "./logger";
export interface ServiceConfig {
	port: number;
	name: string;
}

export class OrderService {
	private logger: Logger;
	constructor() {
		this.logger = new Logger();
	}

	public async processOrder(id: string): Promise<boolean> {
		const valid = id.length > 0;
		return valid;
	}
}

export function createService(): OrderService {
	return new OrderService();
}
`;
		await fs.writeFile(sampleFile, sampleContent, "utf8");

		const resultL1 = await reader.read({ filePath: sampleFile, level: 1 });
		expect(resultL1.level).toBe(1);
		expect(resultL1.symbolsFound).toContain("OrderService");
		expect(resultL1.symbolsFound).toContain("ServiceConfig");
		expect(resultL1.symbolsFound).toContain("createService");
		expect(resultL1.returnedLines).toBeLessThan(resultL1.totalLines);

		// Level 3 targeted reading
		const resultL3 = await reader.read({
			filePath: sampleFile,
			level: 3,
			targetSymbols: ["processOrder", "OrderService"],
		});
		expect(resultL3.level).toBe(3);
		expect(resultL3.content).toContain("OrderService");
	});

	it("should deterministically route AST patterns and symbols", () => {
		const astDecision = router.route("console.log($ARG)");
		expect(astDecision.primaryTool).toBe("ast_edit");
		expect(astDecision.confidence).toBeGreaterThan(0.9);

		const lspDecision = router.route("processOrder", { filePath: "service.ts" });
		expect(lspDecision.primaryTool).toBe("lsp");

		const grepDecision = router.route("getaddrinfo ENOTFOUND");
		expect(grepDecision.primaryTool).toBe("grep");

		const semanticDecision = router.route("why was this architecture chosen for teia");
		expect(semanticDecision.primaryTool).toBe("semantic_memory");
	});
});
