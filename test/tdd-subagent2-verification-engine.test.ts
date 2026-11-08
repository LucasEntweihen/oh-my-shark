import { describe, expect, it } from "bun:test";
import { IndependentVerifier } from "../packages/execution-engine/src/index";

describe("Subagent 2 TDD: Independent Verification Engine", () => {
  const verifier = new IndependentVerifier({ maxLinesPerFile: 350 });

  it("1. Verifies balanced syntax for TypeScript and valid JSON structures", () => {
    const contentMap = new Map<string, string>([
      ["src/valid.ts", "export function hello() { return 'world'; }"],
      ["config.json", JSON.stringify({ name: "ohmyshark", version: "0.0.51" })],
    ]);

    const res = verifier.verifySyntax(contentMap);
    expect(res.passed).toBe(true);
    expect(res.evidence.length).toBe(2);
  });

  it("2. Catches syntax errors (unbalanced braces/parens) and malformed JSON", () => {
    const contentMap = new Map<string, string>([
      ["src/broken.ts", "export function hello() { return 'world'; "], // missing closing brace
    ]);

    const res = verifier.verifySyntax(contentMap);
    expect(res.passed).toBe(false);
    expect(res.failureReason).toContain("Unbalanced syntax");
  });

  it("3. Enforces strict typing and flags prohibited @ts-ignore annotations", () => {
    const cleanMap = new Map<string, string>([
      ["src/clean.ts", "export const PI: number = 3.14159;"],
    ]);
    const cleanRes = verifier.verifyTyping(cleanMap);
    expect(cleanRes.passed).toBe(true);

    const dirtyMap = new Map<string, string>([
      ["src/dirty.ts", "// @ts-ignore\nconst x: any = 42;"],
    ]);
    const dirtyRes = verifier.verifyTyping(dirtyMap);
    expect(dirtyRes.passed).toBe(false);
    expect(dirtyRes.failureReason).toContain("Prohibited type suppression");
  });

  it("4. Enforces 350-line quality gate and identifies violating files", () => {
    const smallContent = Array.from({ length: 50 }, () => "console.log('line');").join("\n");
    const largeContent = Array.from({ length: 400 }, () => "console.log('line');").join("\n");

    const contentMap = new Map<string, string>([
      ["src/small.ts", smallContent],
      ["src/large.ts", largeContent],
    ]);

    const res = verifier.verifyQualityGates(contentMap);
    expect(res.passed).toBe(false);
    expect(res.failureReason).toContain("File size quality gate exceeded");
    expect(res.failureReason).toContain("400 lines");
  });

  it("5. Validates workspace confinement and catches path traversal escape attempts", () => {
    const workspaceRoot = "C:/projects/oh-my-shark";
    const safeFiles = ["src/index.ts", "packages/kernel/src/index.ts"];
    const safeRes = verifier.verifySafety(safeFiles, workspaceRoot);
    expect(safeRes.passed).toBe(true);

    const escapeFiles = ["src/index.ts", "../../windows/system32/cmd.exe"];
    const escapeRes = verifier.verifySafety(escapeFiles, workspaceRoot);
    expect(escapeRes.passed).toBe(false);
    expect(escapeRes.failureReason).toContain("Confinement violation");
  });

  it("6. Produces comprehensive multi-layer verification report with overall verdict", () => {
    const report = verifier.verifyAll({
      files: ["src/app.ts"],
      contentMap: new Map<string, string>([
        ["src/app.ts", "export function run(): void { console.log('ok'); }"],
      ]),
      workspaceRoot: process.cwd(),
    });

    expect(report.verdict).toBe("APPROVED");
    expect(report.layersChecked.length).toBeGreaterThanOrEqual(3);
    expect(report.blockingFailures.length).toBe(0);
    expect(report.summary).toContain("passed");
  });
});
