import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { checkFileSizes, type FileSizeScanResult } from "./file-size-checker";
import { validateManifest, type ManifestValidationResult } from "./manifest-validator";

export interface HarnessCheckItem {
	name: string;
	passed: boolean;
	details: string;
	durationMs: number;
}

export interface HarnessReport {
	timestamp: string;
	passed: boolean;
	targetDir: string;
	checks: HarnessCheckItem[];
	manifest: ManifestValidationResult;
	fileSizes: FileSizeScanResult;
	summary: {
		totalChecks: number;
		passedChecks: number;
		failedChecks: number;
		totalDurationMs: number;
	};
}

/**
 * Runs a complete harness evaluation against the target directory.
 */
export function evaluateHarness(targetDir: string): HarnessReport {
	const startTime = Date.now();
	const checks: HarnessCheckItem[] = [];

	// Check 1: Directory exists and is readable
	const c1Start = Date.now();
	let dirReadable = false;
	try {
		const stat = fs.statSync(targetDir);
		dirReadable = stat.isDirectory();
	} catch {
		dirReadable = false;
	}
	checks.push({
		name: "target-directory-access",
		passed: dirReadable,
		details: dirReadable ? `Target directory exists: ${targetDir}` : `Cannot access directory: ${targetDir}`,
		durationMs: Date.now() - c1Start,
	});

	// Check 2: File write/read/delete roundtrip (access test)
	const c2Start = Date.now();
	let accessPassed = false;
	let accessMsg = "";
	const probeFile = path.join(targetDir, `.harness-probe-${Date.now()}.tmp`);
	try {
		fs.writeFileSync(probeFile, "harness-probe-ok", "utf-8");
		const readBack = fs.readFileSync(probeFile, "utf-8");
		fs.unlinkSync(probeFile);
		accessPassed = readBack === "harness-probe-ok";
		accessMsg = accessPassed ? "Read/write roundtrip verified." : "Read content mismatch.";
	} catch (err) {
		accessPassed = false;
		accessMsg = `Write test failed: ${err instanceof Error ? err.message : String(err)}`;
		try {
			if (fs.existsSync(probeFile)) fs.unlinkSync(probeFile);
		} catch {
			// Ignore cleanup error
		}
	}
	checks.push({
		name: "filesystem-write-roundtrip",
		passed: accessPassed,
		details: accessMsg,
		durationMs: Date.now() - c2Start,
	});

	// Check 3: Runtime verification
	const c3Start = Date.now();
	const bunAvailable = typeof Bun !== "undefined";
	checks.push({
		name: "runtime-bun-native",
		passed: bunAvailable,
		details: bunAvailable ? `Bun runtime active: ${Bun.version} on ${os.platform()}` : "Node/fallback runtime detected.",
		durationMs: Date.now() - c3Start,
	});

	// Check 4: Manifest validation (the 9 canonical files)
	const c4Start = Date.now();
	const manifestResult = validateManifest(targetDir);
	checks.push({
		name: "canonical-manifest-presence",
		passed: manifestResult.existingCount > 0,
		details: `Found ${manifestResult.existingCount}/${manifestResult.totalExpected} canonical files. Missing: ${manifestResult.missingCount}.`,
		durationMs: Date.now() - c4Start,
	});

	// Check 5: File size limits (350 lines gate)
	const c5Start = Date.now();
	const fileSizeResult = checkFileSizes(targetDir);
	checks.push({
		name: "file-size-limit-350",
		passed: fileSizeResult.pass,
		details: fileSizeResult.pass
			? `All ${fileSizeResult.totalFilesScanned} scanned code files adhere to <= ${fileSizeResult.maxLinesAllowed} lines.`
			: `${fileSizeResult.violatingFiles.length} files exceed ${fileSizeResult.maxLinesAllowed} lines. Top violation: ${fileSizeResult.violatingFiles[0]?.relativePath} (${fileSizeResult.violatingFiles[0]?.lines} lines).`,
		durationMs: Date.now() - c5Start,
	});

	const passedChecks = checks.filter(c => c.passed).length;
	const failedChecks = checks.length - passedChecks;

	return {
		timestamp: new Date().toISOString(),
		passed: failedChecks === 0,
		targetDir,
		checks,
		manifest: manifestResult,
		fileSizes: fileSizeResult,
		summary: {
			totalChecks: checks.length,
			passedChecks,
			failedChecks,
			totalDurationMs: Date.now() - startTime,
		},
	};
}
