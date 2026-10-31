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

	// --- 5+ NEW TDD SPECIFIC TESTS ---

	it("TDD 1: should extract decorators and exported types in Level 1 Outline", async () => {
		const filePath = path.join(tempDir, "decorated-component.ts");
		const content = `
import { Injectable } from "@angular/core";

export type StatusTag = "active" | "inactive";

@Injectable({
  providedIn: "root"
})
export class PaymentProcessor {
  public executePayment(amount: number): boolean {
    const fee = 0.05;
    return amount > 0;
  }
}
`;
		await fs.writeFile(filePath, content, "utf8");

		const result = await reader.read({ filePath, level: 1 });
		expect(result.level).toBe(1);
		expect(result.content).toContain("@Injectable");
		expect(result.content).toContain("export type StatusTag");
		expect(result.symbolsFound).toContain("StatusTag");
		expect(result.symbolsFound).toContain("PaymentProcessor");
	});

	it("TDD 2: should capture Level 2 signatures with method bodies elided", async () => {
		const filePath = path.join(tempDir, "calculator.ts");
		const content = `
export class Calculator {
  public compute(a: number, b: number): number {
    const sum = a + b;
    const factor = 2;
    return sum * factor;
  }
}
`;
		await fs.writeFile(filePath, content, "utf8");

		const result = await reader.read({ filePath, level: 2 });
		expect(result.level).toBe(2);
		expect(result.content).toContain("compute(a: number, b: number): number { … }");
		expect(result.content).not.toContain("sum * factor");
	});

	it("TDD 3: should extract full method bodies in Level 3 even with nested inner braces", async () => {
		const filePath = path.join(tempDir, "nested-logic.ts");
		const content = `
export class ComplexHandler {
  public handleNested(items: string[]): Record<string, number> {
    const map: Record<string, number> = {};
    for (const item of items) {
      if (item.length > 0) {
        map[item] = item.length;
      }
    }
    return map;
  }

  public otherMethod(): void {
    console.log("unrelated");
  }
}
`;
		await fs.writeFile(filePath, content, "utf8");

		const result = await reader.read({
			filePath,
			level: 3,
			targetSymbols: ["handleNested"],
		});

		expect(result.level).toBe(3);
		expect(result.symbolsFound).toContain("handleNested");
		expect(result.content).toContain("map[item] = item.length");
		expect(result.content).not.toContain("unrelated");
	});

	it("TDD 4: should route rollback and restore intents to transactional_engine", () => {
		const decision1 = router.route("rollback to previous checkpoint");
		expect(decision1.primaryTool).toBe("transactional_engine");
		expect(decision1.confidence).toBe(0.99);

		const decision2 = router.route("anything", { intentType: "rollback", filePath: "src/auth.ts" });
		expect(decision2.primaryTool).toBe("transactional_engine");
		expect(decision2.optimizedParams.targetPath).toBe("src/auth.ts");
	});

	it("TDD 5: should route test execution and verification intents to test_runner", () => {
		const decision1 = router.route("run test suite for authentication");
		expect(decision1.primaryTool).toBe("test_runner");
		expect(decision1.confidence).toBeGreaterThan(0.95);

		const decision2 = router.route("verify tests", { intentType: "test" });
		expect(decision2.primaryTool).toBe("test_runner");
		expect(decision2.secondaryFallback).toBe("grep");
	});

	it("TDD 6: should route security review queries to sec_review and large files to progressive_read", () => {
		const secDecision = router.route("security audit of endpoint vulnerabilities");
		expect(secDecision.primaryTool).toBe("sec_review");
		expect(secDecision.confidence).toBe(0.97);

		const largeFileDecision = router.route("read code", {
			intentType: "inspect",
			filePath: "big-file.ts",
			fileSizeLines: 250,
		});
		expect(largeFileDecision.primaryTool).toBe("progressive_read");
		expect(largeFileDecision.optimizedParams.level).toBe(2);

		const outlineDecision = router.route("give me outline of file", {
			filePath: "component.ts",
		});
		expect(outlineDecision.primaryTool).toBe("progressive_read");
		expect(outlineDecision.optimizedParams.level).toBe(1);
	});
});
