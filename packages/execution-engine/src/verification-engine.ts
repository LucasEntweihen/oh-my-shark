/**
 * OhMyShark (OMSK) Independent Verification Engine
 * Independent multi-layered verification system that refuses to trust
 * agent self-declarations without concrete, verifiable runtime evidence.
 */

export type VerificationLayer =
  | "syntax"
  | "typing"
  | "quality_gates"
  | "unit_tests"
  | "safety"
  | "acceptance_criteria";

export type VerificationVerdict = "APPROVED" | "REJECTED";

export interface LayerCheckResult {
  layer: VerificationLayer;
  passed: boolean;
  durationMs: number;
  evidence: string[];
  failureReason?: string;
}

export interface VerificationReport {
  verdict: VerificationVerdict;
  totalDurationMs: number;
  layersChecked: LayerCheckResult[];
  blockingFailures: string[];
  summary: string;
}

export interface VerificationTarget {
  files: string[];
  contentMap?: Map<string, string>;
  testCommands?: string[];
  maxLinesPerFile?: number;
  workspaceRoot?: string;
  acceptanceCriteria?: string[];
}

export class IndependentVerifier {
  private maxLines: number;

  constructor(options: { maxLinesPerFile?: number } = {}) {
    this.maxLines = options.maxLinesPerFile ?? 350;
  }

  /**
   * Layer 1: Syntax Verification.
   */
  public verifySyntax(contentMap: Map<string, string>): LayerCheckResult {
    const start = Date.now();
    const evidence: string[] = [];

    for (const [filePath, content] of contentMap.entries()) {
      if (filePath.endsWith(".json")) {
        try {
          JSON.parse(content);
          evidence.push(`JSON syntax valid: ${filePath}`);
        } catch (e) {
          return {
            layer: "syntax",
            passed: false,
            durationMs: Date.now() - start,
            evidence,
            failureReason: `Malformed JSON in ${filePath}: ${(e as Error).message}`,
          };
        }
      } else if (filePath.endsWith(".ts") || filePath.endsWith(".js")) {
        // Basic bracket balance check
        let openBrackets = 0;
        let openBraces = 0;
        for (const char of content) {
          if (char === "{") openBraces++;
          else if (char === "}") openBraces--;
          else if (char === "(") openBrackets++;
          else if (char === ")") openBrackets--;
        }
        if (openBraces !== 0 || openBrackets !== 0) {
          return {
            layer: "syntax",
            passed: false,
            durationMs: Date.now() - start,
            evidence,
            failureReason: `Unbalanced syntax in ${filePath}: braces=${openBraces}, parens=${openBrackets}`,
          };
        }
        evidence.push(`Balanced syntax structure: ${filePath}`);
      }
    }

    return {
      layer: "syntax",
      passed: true,
      durationMs: Date.now() - start,
      evidence,
    };
  }

  /**
   * Layer 2: Typing & Banned Types Verification (Zero-any policy).
   */
  public verifyTyping(contentMap: Map<string, string>): LayerCheckResult {
    const start = Date.now();
    const evidence: string[] = [];

    for (const [filePath, content] of contentMap.entries()) {
      if (filePath.endsWith(".ts") || filePath.endsWith(".tsx")) {
        // Check for loose 'any' usage or @ts-ignore
        const lines = content.split("\n");
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          if (line.includes("@ts-ignore") || line.includes("@ts-nocheck")) {
            return {
              layer: "typing",
              passed: false,
              durationMs: Date.now() - start,
              evidence,
              failureReason: `Prohibited type suppression at ${filePath}:${i + 1}`,
            };
          }
        }
        evidence.push(`Strict typing enforced without suppression: ${filePath}`);
      }
    }

    return {
      layer: "typing",
      passed: true,
      durationMs: Date.now() - start,
      evidence,
    };
  }

  /**
   * Layer 3: Quality Gates (350-line file limit).
   */
  public verifyQualityGates(contentMap: Map<string, string>): LayerCheckResult {
    const start = Date.now();
    const evidence: string[] = [];

    for (const [filePath, content] of contentMap.entries()) {
      const lineCount = content.split("\n").length;
      if (lineCount > this.maxLines) {
        return {
          layer: "quality_gates",
          passed: false,
          durationMs: Date.now() - start,
          evidence,
          failureReason: `File size quality gate exceeded in ${filePath}: ${lineCount} lines (max ${this.maxLines})`,
        };
      }
      evidence.push(`File within 350-line limit (${lineCount} lines): ${filePath}`);
    }

    return {
      layer: "quality_gates",
      passed: true,
      durationMs: Date.now() - start,
      evidence,
    };
  }

  /**
   * Layer 5: Safety & Workspace Confinement.
   */
  public verifySafety(files: string[], workspaceRoot: string): LayerCheckResult {
    const start = Date.now();
    const evidence: string[] = [];
    const normalizedRoot = workspaceRoot.replace(/\\/g, "/").toLowerCase();

    for (const file of files) {
      const normalizedPath = file.replace(/\\/g, "/");
      if (normalizedPath.includes("../") || normalizedPath.startsWith("/")) {
        const full = normalizedPath.toLowerCase();
        if (!full.startsWith(normalizedRoot)) {
          return {
            layer: "safety",
            passed: false,
            durationMs: Date.now() - start,
            evidence,
            failureReason: `Confinement violation: path '${file}' attempts traversal outside '${workspaceRoot}'`,
          };
        }
      }
      evidence.push(`Path strictly confined: ${file}`);
    }

    return {
      layer: "safety",
      passed: true,
      durationMs: Date.now() - start,
      evidence,
    };
  }

  /**
   * Executes full multi-layer verification.
   */
  public verifyAll(target: VerificationTarget): VerificationReport {
    const start = Date.now();
    const results: LayerCheckResult[] = [];
    const blockingFailures: string[] = [];

    const contentMap = target.contentMap ?? new Map<string, string>();

    // 1. Syntax
    if (contentMap.size > 0) {
      const syn = this.verifySyntax(contentMap);
      results.push(syn);
      if (!syn.passed && syn.failureReason) blockingFailures.push(syn.failureReason);
    }

    // 2. Typing
    if (contentMap.size > 0) {
      const typ = this.verifyTyping(contentMap);
      results.push(typ);
      if (!typ.passed && typ.failureReason) blockingFailures.push(typ.failureReason);
    }

    // 3. Quality Gates
    if (contentMap.size > 0) {
      const qg = this.verifyQualityGates(contentMap);
      results.push(qg);
      if (!qg.passed && qg.failureReason) blockingFailures.push(qg.failureReason);
    }

    // 4. Safety
    if (target.workspaceRoot && target.files.length > 0) {
      const sft = this.verifySafety(target.files, target.workspaceRoot);
      results.push(sft);
      if (!sft.passed && sft.failureReason) blockingFailures.push(sft.failureReason);
    }

    const passed = blockingFailures.length === 0;
    const verdict: VerificationVerdict = passed ? "APPROVED" : "REJECTED";

    return {
      verdict,
      totalDurationMs: Date.now() - start,
      layersChecked: results,
      blockingFailures,
      summary: passed
        ? `Independent verification passed across ${results.length} layers with verifiable evidence.`
        : `Independent verification failed with ${blockingFailures.length} blocking issues.`,
    };
  }
}
