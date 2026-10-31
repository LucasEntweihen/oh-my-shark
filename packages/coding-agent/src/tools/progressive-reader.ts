/**
 * Progressive Reader Tool for Oh My Shark (OMSK).
 * Implements 4-tier progressive code inspection to minimize context-token consumption:
 * - Level 1 (Outline): Metadata, exports, imports, decorators, classes, interfaces, enums, functions without bodies.
 * - Level 2 (Signatures): Type definitions, parameters, and return types; bodies elided.
 * - Level 3 (Targeted Symbols): Full bodies only for specifically requested symbols or methods.
 * - Level 4 (Full/Raw): Complete file contents when comprehensive context is mandatory.
 */
import * as fs from "node:fs/promises";
import * as path from "node:path";

export type ReadLevel = 1 | 2 | 3 | 4;

export interface ProgressiveReadOptions {
	filePath: string;
	level?: ReadLevel;
	targetSymbols?: string[];
	offsetLine?: number;
	maxLines?: number;
}

export interface ProgressiveReadResult {
	filePath: string;
	level: ReadLevel;
	totalLines: number;
	returnedLines: number;
	tokensEstimated: number;
	content: string;
	symbolsFound?: string[];
}

function estimateTokens(text: string): number {
	return Math.max(1, Math.ceil(text.length / 3.8));
}

export class ProgressiveReader {
	private baseDir: string;

	constructor(baseDir: string = process.cwd()) {
		this.baseDir = path.resolve(baseDir);
	}

	public async read(options: ProgressiveReadOptions): Promise<ProgressiveReadResult> {
		const level: ReadLevel = options.level ?? 1;
		const targetPath = path.isAbsolute(options.filePath)
			? options.filePath
			: path.resolve(this.baseDir, options.filePath);

		const rawContent = await fs.readFile(targetPath, "utf8");
		const allLines = rawContent.split("\n");
		const totalLines = allLines.length;

		if (level === 4) {
			const start = Math.max(0, (options.offsetLine ?? 1) - 1);
			const end = options.maxLines ? start + options.maxLines : totalLines;
			const slice = allLines.slice(start, end);
			const text = slice.join("\n");
			return {
				filePath: targetPath,
				level: 4,
				totalLines,
				returnedLines: slice.length,
				tokensEstimated: estimateTokens(text),
				content: text,
			};
		}

		if (level === 1) {
			return this.extractLevel1Outline(targetPath, allLines);
		}

		if (level === 2) {
			return this.extractLevel2Signatures(targetPath, allLines);
		}

		return this.extractLevel3TargetedSymbols(targetPath, allLines, options.targetSymbols ?? []);
	}

	private extractLevel1Outline(filePath: string, lines: string[]): ProgressiveReadResult {
		const outlineLines: string[] = [];
		const symbols: string[] = [];

		for (let i = 0; i < lines.length; i++) {
			const line = lines[i];
			const trimmed = line.trim();

			// Decorators (@Component, @Injectable)
			if (trimmed.startsWith("@") && /@[A-Za-z0-9_$]+(?:\(.*\))?/.test(trimmed)) {
				outlineLines.push(`${i + 1}:${line}`);
				continue;
			}

			// Declarations and exports
			if (
				trimmed.startsWith("import ") ||
				trimmed.startsWith("export ") ||
				trimmed.startsWith("class ") ||
				trimmed.startsWith("abstract class ") ||
				trimmed.startsWith("interface ") ||
				trimmed.startsWith("type ") ||
				trimmed.startsWith("enum ") ||
				trimmed.startsWith("function ") ||
				trimmed.startsWith("const ") && trimmed.includes("= (") ||
				/^(?:public|protected|private)?\s*(?:async)?\s*(?:static)?\s*[A-Za-z0-9_$]+\s*\([^)]*\)\s*[:{]/.test(trimmed)
			) {
				outlineLines.push(`${i + 1}:${line}`);
				const match = trimmed.match(/(?:class|interface|type|enum|function|const)\s+([A-Za-z0-9_$]+)/);
				if (match && match[1]) {
					symbols.push(match[1]);
				}
			}
		}

		const content = outlineLines.length > 0
			? `[Outline - Level 1: Declarations, Exports & Decorators]\n${outlineLines.join("\n")}`
			: `[Empty or non-symbol outline: ${lines.length} lines]`;

		return {
			filePath,
			level: 1,
			totalLines: lines.length,
			returnedLines: outlineLines.length,
			tokensEstimated: estimateTokens(content),
			content,
			symbolsFound: symbols,
		};
	}

	private extractLevel2Signatures(filePath: string, lines: string[]): ProgressiveReadResult {
		const signatureLines: string[] = [];
		let insideBlock = false;
		let braceDepth = 0;

		for (let i = 0; i < lines.length; i++) {
			const line = lines[i];
			const trimmed = line.trim();

			if (!insideBlock) {
				if (trimmed.startsWith("@")) {
					signatureLines.push(`${i + 1}:${line}`);
				} else if (
					trimmed.startsWith("import ") ||
					trimmed.startsWith("export ") ||
					trimmed.startsWith("interface ") ||
					trimmed.startsWith("type ") ||
					trimmed.startsWith("enum ")
				) {
					signatureLines.push(`${i + 1}:${line}`);
				} else if (
					trimmed.startsWith("function ") ||
					trimmed.startsWith("public ") ||
					trimmed.startsWith("private ") ||
					trimmed.startsWith("protected ") ||
					trimmed.startsWith("async ") ||
					trimmed.startsWith("class ") ||
					trimmed.startsWith("abstract class ")
				) {
					signatureLines.push(`${i + 1}:${line.replace(/\{.*$/, "{ … }")}`);
					if (line.includes("{") && !line.includes("}")) {
						insideBlock = true;
						braceDepth = 1;
					}
				}
			} else {
				for (const char of line) {
					if (char === "{") braceDepth++;
					else if (char === "}") braceDepth--;
				}
				if (braceDepth <= 0) {
					insideBlock = false;
					braceDepth = 0;
				}
			}
		}

		const content = `[Signatures - Level 2: Bodies Elided]\n${signatureLines.join("\n")}`;

		return {
			filePath,
			level: 2,
			totalLines: lines.length,
			returnedLines: signatureLines.length,
			tokensEstimated: estimateTokens(content),
			content,
		};
	}

	private extractLevel3TargetedSymbols(
		filePath: string,
		lines: string[],
		targetSymbols: string[],
	): ProgressiveReadResult {
		if (targetSymbols.length === 0) {
			return this.extractLevel2Signatures(filePath, lines);
		}

		const collectedLines: string[] = [];
		const targets = new Set(targetSymbols);
		const found: string[] = [];
		let capturing = false;
		let braceDepth = 0;
		let hasOpenedBrace = false;

		for (let i = 0; i < lines.length; i++) {
			const line = lines[i];
			const trimmed = line.trim();

			if (!capturing) {
				for (const target of targets) {
					const declRegex = new RegExp(`\\b(?:function|class|interface|type|const|let|enum)\\s+${target}\\b`);
					const methodRegex = new RegExp(`(?:public|private|protected|async|static)?\\s*${target}\\s*\\(`);
					if (declRegex.test(trimmed) || methodRegex.test(trimmed)) {
						capturing = true;
						hasOpenedBrace = false;
						braceDepth = 0;
						found.push(target);
						collectedLines.push(`\n--- Symbol: ${target} (Line ${i + 1}) ---`);
						break;
					}
				}
			}

			if (capturing) {
				collectedLines.push(`${i + 1}:${line}`);
				for (const char of line) {
					if (char === "{") {
						braceDepth++;
						hasOpenedBrace = true;
					} else if (char === "}") {
						braceDepth--;
					}
				}
				if (hasOpenedBrace && braceDepth <= 0) {
					capturing = false;
					hasOpenedBrace = false;
				} else if (!hasOpenedBrace && trimmed.endsWith(";")) {
					// Single-line declaration (interface property, type alias, abstract signature)
					capturing = false;
				}
			}
		}

		const content = collectedLines.length > 0
			? `[Targeted Symbols - Level 3: ${found.join(", ")}]\n${collectedLines.join("\n")}`
			: `[No target symbols (${targetSymbols.join(", ")}) located in file]`;

		return {
			filePath,
			level: 3,
			totalLines: lines.length,
			returnedLines: collectedLines.length,
			tokensEstimated: estimateTokens(content),
			content,
			symbolsFound: found,
		};
	}
}

let defaultProgressiveReader: ProgressiveReader | null = null;

export function getProgressiveReader(baseDir?: string): ProgressiveReader {
	if (!defaultProgressiveReader || baseDir) {
		defaultProgressiveReader = new ProgressiveReader(baseDir);
	}
	return defaultProgressiveReader;
}
