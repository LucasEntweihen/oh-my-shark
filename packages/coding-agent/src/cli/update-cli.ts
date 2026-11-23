/**
 * Update CLI command handler.
 *
 * Handles `omsk update` / `ohms update` to check for and install updates.
 * OhMyShark ships a standalone binary only: the updater resolves the latest
 * stable `omsk-v<semver>` / `ohms-v<semver>` GitHub release of the fork and replaces
 * the PATH-resolved launcher in place. There are no npm, Homebrew, or Mise
 * channels and no upstream fallback.
 */
import { createHash, randomUUID } from "node:crypto";
import * as fs from "node:fs";
import * as path from "node:path";
import chalk from "@oh-my-pi/pi-utils/chalk";
import { APP_NAME, PRODUCT_VERSION } from "@oh-my-pi/pi-utils/dirs";
import { $env, isCompiledBinary } from "@oh-my-pi/pi-utils/env";
import { isEnoent } from "@oh-my-pi/pi-utils/fs-error";
import { compareVersions } from "@oh-my-pi/pi-utils/version";
import { $which } from "@oh-my-pi/pi-utils/which";
import { $ } from "bun";
import {
	isTimeoutError,
	isUnsupportedProxyError,
	unsupportedProxyMessage,
	withTimeoutSignal,
} from "../utils/fetch-timeout";

const UPDATE_LOCK_RETRIES = 1_200;
const UPDATE_LOCK_DELAY_MS = 100;
const INCOMPLETE_LOCK_STALE_MS = 5_000;

function updateLockOwnerIsAlive(pid: number): boolean {
	try {
		process.kill(pid, 0);
		return true;
	} catch (error) {
		return (error as NodeJS.ErrnoException).code !== "ESRCH";
	}
}

async function removeStaleUpdateLock(lockPath: string): Promise<void> {
	try {
		const [contents, stats] = await Promise.all([fs.promises.readFile(lockPath, "utf8"), fs.promises.stat(lockPath)]);
		let owner: { pid?: unknown } = {};
		try {
			owner = JSON.parse(contents) as { pid?: unknown };
		} catch {
			if (Date.now() - stats.mtimeMs < INCOMPLETE_LOCK_STALE_MS) return;
		}

		if (typeof owner.pid === "number" && owner.pid > 0 && updateLockOwnerIsAlive(owner.pid)) return;
		if (contents !== (await fs.promises.readFile(lockPath, "utf8"))) return;
		await fs.promises.unlink(lockPath).catch(() => {});
	} catch (error) {
		if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
	}
}

async function releaseUpdateFileLock(lockPath: string, token: string): Promise<void> {
	try {
		const owner = JSON.parse(await fs.promises.readFile(lockPath, "utf8")) as { token?: unknown };
		if (owner.token === token) await fs.promises.unlink(lockPath);
	} catch (error) {
		if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
	}
}

/** @internal Atomic cross-process lock used by binary and shim replacement. */
export async function withUpdateFileLock<T>(
	filePath: string,
	fn: () => Promise<T>,
	onContention?: () => void,
): Promise<T> {
	const lockPath = `${filePath}.update-lock`;
	const token = randomUUID();
	const deadline = Date.now() + UPDATE_LOCK_RETRIES * UPDATE_LOCK_DELAY_MS;
	while (Date.now() < deadline) {
		let handle: fs.promises.FileHandle;
		try {
			handle = await fs.promises.open(lockPath, "wx");
		} catch (error) {
			if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error;
			await removeStaleUpdateLock(lockPath);
			onContention?.();
			await Bun.sleep(UPDATE_LOCK_DELAY_MS);
			continue;
		}

		try {
			await handle.writeFile(JSON.stringify({ pid: process.pid, token }), "utf8");
			await handle.close();
		} catch (error) {
			await handle.close().catch(() => {});
			await releaseUpdateFileLock(lockPath, token);
			throw error;
		}

		try {
			return await fn();
		} finally {
			await releaseUpdateFileLock(lockPath, token);
		}
	}
	throw new Error(`Timed out acquiring update lock for ${filePath}`);
}

const REPO = "LucasEntweihen/oh-my-shark";
/** Release tag prefix: OhMyShark publishes `omsk-v<semver>` and `ohms-v<semver>` tags. */
const TAG_PREFIX = "ohms-v";
const GITHUB_API = "https://api.github.com";
const RELEASE_METADATA_TIMEOUT_MS = 30_000;
const BINARY_DOWNLOAD_TIMEOUT_MS = 15 * 60_000;

/**
 * Live progress of an install, for callers that display it (the auto-update banner).
 */
export type UpdateProgress =
	| { phase: "downloading"; version: string; received: number; total: number }
	| { phase: "installing"; version: string };

/** Receives {@link UpdateProgress} while an update installs. */
export type UpdateProgressListener = (progress: UpdateProgress) => void;

/** OhMyShark releases ship as standalone binaries; stable is the only channel. */
export type ReleaseDist = "binary";
export type UpdateChannel = "stable" | "canary";

export interface ReleaseInfo {
	tag: string;
	version: string;
	/** OhMyShark releases are always binary-distributed. */
	dist: ReleaseDist;
}

export interface ReleaseBinaryAsset {
	url: string;
	size: number;
	digest: string;
}

/** Options for {@link runUpdateCommand}. */
export interface UpdateOptions {
	force: boolean;
	check: boolean;
	channel?: UpdateChannel;
	onProgress?: UpdateProgressListener;
}

/** How {@link runUpdateCommand} ended without an error. */
export type UpdateOutcome =
	| { kind: "current" }
	| { kind: "available"; version: string }
	| { kind: "unsupported"; reason: string }
	| { kind: "installed"; version: string };

type Fetch = (input: string | URL | Request, init?: RequestInit) => Promise<Response>;

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null;
}

/**
 * Whether this build runs from a source checkout (dev launcher or bun link)
 * rather than a compiled binary or packaged install.
 */
export function isSourceCheckout(): boolean {
	return !isCompiledBinary() && !import.meta.dir.split(path.sep).includes("node_modules");
}

/**
 * Whether the running build may install its own updates.
 */
export async function canSelfUpdate(): Promise<boolean> {
	if (isSourceCheckout()) return false;
	const { managedInstallName } = await import("./managed-install");
	return (await managedInstallName(process.execPath)) === undefined;
}

/**
 * Resolves GitHub token from explicit options, environment variables, or GitHub CLI (`gh auth token`).
 */
export function resolveGitHubToken(explicitToken?: string): string | undefined {
	const explicit = explicitToken?.trim();
	if (explicit) return explicit;
	const envToken = $env.GITHUB_TOKEN?.trim() || $env.GH_TOKEN?.trim();
	if (envToken) return envToken;
	try {
		const proc = Bun.spawnSync(["gh", "auth", "token"], { stdout: "pipe", stderr: "pipe" });
		if (proc.exitCode === 0) {
			const token = proc.stdout.toString("utf-8").trim();
			if (token) return token;
		}
	} catch {
		// gh CLI unavailable or failed
	}
	return undefined;
}

/**
 * Select and validate the binary asset from GitHub release metadata.
 *
 * Draft releases are always rejected. Prereleases are rejected unless
 * `options.allowPrerelease` is set, which the canary channel passes: canary
 * GitHub releases are published as prereleases, and the exact-tag match below
 * still pins the download to the specific requested version.
 */
export function resolveReleaseBinaryAsset(
	release: unknown,
	expectedTag: string,
	binaryName: string,
	options: { allowPrerelease?: boolean } = {},
): ReleaseBinaryAsset {
	if (!isRecord(release)) {
		throw new Error("Invalid GitHub release metadata");
	}
	if (release.tag_name !== expectedTag) {
		throw new Error(`GitHub release tag mismatch: expected ${expectedTag}`);
	}
	if (release.draft !== false) {
		throw new Error(`GitHub release ${expectedTag} is a draft, not a published release`);
	}
	if (release.prerelease !== false && !options.allowPrerelease) {
		throw new Error(`GitHub release ${expectedTag} is a prerelease; only canary updates install prerelease assets`);
	}
	if (!Array.isArray(release.assets)) {
		throw new Error(`GitHub release ${expectedTag} has no asset list`);
	}

	const matches = release.assets.filter(asset => isRecord(asset) && asset.name === binaryName);
	if (matches.length !== 1) {
		throw new Error(`GitHub release ${expectedTag} has ${matches.length} assets named ${binaryName}`);
	}

	const asset = matches[0];
	if (!isRecord(asset) || asset.state !== "uploaded") {
		throw new Error(`GitHub release asset ${binaryName} is not fully uploaded`);
	}
	if (typeof asset.size !== "number" || !Number.isSafeInteger(asset.size) || asset.size <= 0) {
		throw new Error(`GitHub release asset ${binaryName} has an invalid size`);
	}
	if (typeof asset.digest !== "string") {
		throw new Error(`GitHub release asset ${binaryName} has no digest`);
	}
	const digest = /^sha256:([0-9a-f]{64})$/i.exec(asset.digest)?.[1];
	if (!digest) {
		throw new Error(`GitHub release asset ${binaryName} has an unsupported digest`);
	}

	const expectedUrl = `https://github.com/${REPO}/releases/download/${expectedTag}/${binaryName}`;
	if (asset.browser_download_url !== expectedUrl) {
		throw new Error(`GitHub release asset ${binaryName} has an unexpected download URL`);
	}

	return {
		url: expectedUrl,
		size: asset.size,
		digest: `sha256:${digest.toLowerCase()}`,
	};
}

const TRANSIENT_NETWORK_CODES = new Set([
	"ENOTFOUND",
	"EAI_AGAIN",
	"EAI_FAIL",
	"ECONNRESET",
	"ETIMEDOUT",
	"ECONNREFUSED",
	"UND_ERR_CONNECT_TIMEOUT",
]);

function isTransientNetworkError(err: unknown): boolean {
	if (isTimeoutError(err) || isUnsupportedProxyError(err)) return false;
	const queue: unknown[] = [err];
	while (queue.length > 0) {
		const current = queue.shift();
		if (current && typeof current === "object") {
			const record = current as { code?: unknown; message?: unknown; cause?: unknown };
			if (typeof record.code === "string" && TRANSIENT_NETWORK_CODES.has(record.code)) {
				return true;
			}
			if (
				typeof record.message === "string" &&
				/\b(ENOTFOUND|EAI_AGAIN|EAI_FAIL|ECONNRESET|ETIMEDOUT|ECONNREFUSED|getaddrinfo)\b|Unable to connect/i.test(
					record.message,
				)
			) {
				return true;
			}
			if (record.cause !== undefined) queue.push(record.cause);
		}
	}
	return false;
}

async function fetchWithNetworkRetry(
	url: string,
	init: RequestInit,
	timeoutMs: number,
	fetchImpl: Fetch,
	maxAttempts = 3,
): Promise<Response> {
	let lastError: unknown;
	for (let attempt = 0; attempt < maxAttempts; attempt++) {
		try {
			return await fetchImpl(url, {
				...init,
				signal: init.signal ?? withTimeoutSignal(timeoutMs),
			});
		} catch (err) {
			lastError = err;
			if (!isTransientNetworkError(err) || attempt + 1 >= maxAttempts) {
				throw err;
			}
			await Bun.sleep(50 * (attempt + 1));
		}
	}
	throw lastError;
}

async function resolveLatestReleaseViaWebRedirect(timeoutMs: number, fetchImpl: Fetch): Promise<ReleaseInfo | null> {
	try {
		const webResponse = await fetchWithNetworkRetry(
			`https://github.com/${REPO}/releases/latest`,
			{
				method: "HEAD",
				redirect: "manual",
			},
			timeoutMs,
			fetchImpl,
		);
		const location = webResponse.headers.get("location");
		if (!location) return null;
		const tagMatch = location.match(/\/releases\/tag\/([^/?#]+)/);
		if (!tagMatch?.[1]) return null;
		const tag = decodeURIComponent(tagMatch[1]);
		const version = parseProductTag(tag);
		return version ? { tag, version, dist: "binary" } : null;
	} catch {
		return null;
	}
}

async function resolveBinaryAssetViaDirectDownload(
	tag: string,
	binaryName: string,
	timeoutMs: number,
	fetchImpl: Fetch,
): Promise<ReleaseBinaryAsset | null> {
	try {
		const sumsUrl = `https://github.com/${REPO}/releases/download/${encodeURIComponent(tag)}/SHA256SUMS.txt`;
		const sumsResponse = await fetchWithNetworkRetry(sumsUrl, {}, timeoutMs, fetchImpl);
		if (!sumsResponse.ok) return null;
		const sumsText = await sumsResponse.text();
		let foundDigest: string | undefined;
		for (const line of sumsText.split("\n")) {
			const parts = line.trim().split(/\s+/);
			if (parts.length >= 2 && parts[1] === binaryName) {
				foundDigest = parts[0]?.toLowerCase();
				break;
			}
		}
		if (!foundDigest || !/^[0-9a-f]{64}$/i.test(foundDigest)) return null;
		const binaryUrl = `https://github.com/${REPO}/releases/download/${encodeURIComponent(tag)}/${binaryName}`;
		const headResponse = await fetchWithNetworkRetry(
			binaryUrl,
			{ method: "HEAD", redirect: "follow" },
			timeoutMs,
			fetchImpl,
		);
		const contentLength = headResponse.headers.get("content-length");
		const size = contentLength ? parseInt(contentLength, 10) : 0;
		if (headResponse.ok && size > 0) {
			return {
				url: binaryUrl,
				size,
				digest: `sha256:${foundDigest}`,
			};
		}
	} catch {
		// direct fallback failed
	}
	return null;
}

async function getReleaseBinaryAsset(
	expectedVersion: string,
	binaryName: string,
	fetchImpl: Fetch = fetch,
	githubToken?: string,
	allowPrerelease = false,
	expectedTag?: string,
): Promise<ReleaseBinaryAsset> {
	let tag =
		expectedTag ??
		(expectedVersion.startsWith("omsk-v") || expectedVersion.startsWith("ohms-v")
			? expectedVersion
			: `${TAG_PREFIX}${expectedVersion}`);
	const resolvedToken = resolveGitHubToken(githubToken);
	const headers: Record<string, string> = {
		Accept: "application/vnd.github+json",
		"X-GitHub-Api-Version": "2022-11-28",
	};
	if (resolvedToken) headers.Authorization = `Bearer ${resolvedToken}`;

	let response: Response;
	try {
		response = await fetchWithNetworkRetry(
			`${GITHUB_API}/repos/${REPO}/releases/tags/${encodeURIComponent(tag)}`,
			{ headers },
			RELEASE_METADATA_TIMEOUT_MS,
			fetchImpl,
		);
	} catch (err) {
		if (isTimeoutError(err)) {
			throw new Error("Timed out fetching GitHub release metadata after 30s", { cause: err });
		}
		if (isUnsupportedProxyError(err)) throw new Error(unsupportedProxyMessage(), { cause: err });
		const directFallback = await resolveBinaryAssetViaDirectDownload(
			tag,
			binaryName,
			RELEASE_METADATA_TIMEOUT_MS,
			fetchImpl,
		);
		if (directFallback) return directFallback;
		throw err;
	}
	if (response.status === 403 || response.status === 429) {
		// Attempt resolution via gh CLI if installed
		try {
			const proc = Bun.spawnSync(
				["gh", "release", "view", tag, "--repo", REPO, "--json", "assets,tag_name,draft,prerelease"],
				{ stdout: "pipe", stderr: "pipe" },
			);
			if (proc.exitCode === 0) {
				const releaseData: unknown = JSON.parse(proc.stdout.toString("utf-8"));
				return resolveReleaseBinaryAsset(releaseData, tag, binaryName, { allowPrerelease });
			}
		} catch {
			// gh fallback failed
		}

		// Fallback: resolve directly from public SHA256SUMS.txt and HEAD binary request
		const directFallback = await resolveBinaryAssetViaDirectDownload(
			tag,
			binaryName,
			RELEASE_METADATA_TIMEOUT_MS,
			fetchImpl,
		);
		if (directFallback) return directFallback;

		throw new Error(
			"GitHub API rate limit exceeded while fetching release metadata; retry later or set GITHUB_TOKEN or GH_TOKEN",
		);
	}
	if (response.status === 404 && !expectedTag && tag.startsWith("ohms-v")) {
		const fallbackTag = `omsk-v${expectedVersion}`;
		try {
			const fallbackResponse = await fetchImpl(
				`${GITHUB_API}/repos/${REPO}/releases/tags/${encodeURIComponent(fallbackTag)}`,
				{
					headers,
					signal: withTimeoutSignal(RELEASE_METADATA_TIMEOUT_MS),
				},
			);
			if (fallbackResponse.ok) {
				tag = fallbackTag;
				response = fallbackResponse;
			}
		} catch {
			// ignore fallback error and preserve original response
		}
	}
	if (!response.ok) {
		throw new Error(`Failed to fetch GitHub release metadata: ${response.statusText}`);
	}

	return resolveReleaseBinaryAsset(await response.json(), tag, binaryName, { allowPrerelease });
}

export interface VerifiedBinaryDownloadOptions {
	url: string;
	targetPath: string;
	expectedSize: number;
	expectedDigest: string;
	fetchImpl?: Fetch;
	onProgress?: (received: number, total: number) => void;
}

class NonRetriableDownloadError extends Error {}

/**
 * Download a binary and verify its GitHub-reported size and SHA-256 digest.
 */
export async function downloadVerifiedBinary(options: VerifiedBinaryDownloadOptions): Promise<void> {
	const fetchImpl = options.fetchImpl ?? fetch;
	const maxRetries = 6;
	const partPath = `${options.targetPath}.part`;

	let lastError: unknown;

	for (let attempt = 1; attempt <= maxRetries; attempt++) {
		try {
			let currentBytes = 0;
			try {
				if (fs.existsSync(partPath)) {
					currentBytes = fs.statSync(partPath).size;
				}
			} catch {
				currentBytes = 0;
			}

			if (currentBytes >= options.expectedSize) {
				await unlinkIfExists(partPath);
				currentBytes = 0;
			}

			const headers: Record<string, string> = {};
			if (currentBytes > 0) {
				headers.Range = `bytes=${currentBytes}-`;
			}

			const response = await fetchImpl(options.url, {
				headers,
				redirect: "follow",
				signal: withTimeoutSignal(BINARY_DOWNLOAD_TIMEOUT_MS),
			});

			if (!response.ok || !response.body) {
				if (response.status === 416) {
					await unlinkIfExists(partPath);
					continue;
				}
				throw new Error(`Download failed: HTTP ${response.status} ${response.statusText}`);
			}

			const isPartial = response.status === 206;
			if (!isPartial && currentBytes > 0) {
				await unlinkIfExists(partPath);
				currentBytes = 0;
			}

			const writeStream = fs.createWriteStream(partPath, {
				flags: isPartial ? "a" : "w",
				mode: 0o600,
			});

			const reader = response.body.getReader();
			try {
				while (true) {
					const { done, value } = await reader.read();
					if (done) break;
					if (value) {
						currentBytes += value.byteLength;
						if (currentBytes > options.expectedSize) {
							await reader.cancel().catch(() => {});
							throw new NonRetriableDownloadError(
								`Downloaded binary size mismatch: expected ${options.expectedSize} bytes, received at least ${currentBytes}`,
							);
						}
						if (!writeStream.write(value)) {
							await new Promise(resolve => writeStream.once("drain", resolve));
						}
						options.onProgress?.(currentBytes, options.expectedSize);
					}
				}
			} finally {
				writeStream.end();
				await new Promise(resolve => writeStream.once("finish", resolve));
			}

			if (currentBytes === options.expectedSize) {
				break;
			}

			const contentLengthHeader = response.headers.get("content-length");
			const advertisedLength = contentLengthHeader ? Number(contentLengthHeader) : undefined;
			if (
				!isPartial &&
				response.status === 200 &&
				(advertisedLength === undefined || advertisedLength === currentBytes)
			) {
				throw new NonRetriableDownloadError(
					`Downloaded binary size mismatch: expected ${options.expectedSize} bytes, received ${currentBytes}`,
				);
			}

			throw new Error(`Incomplete download: received ${currentBytes} of ${options.expectedSize} bytes`);
		} catch (err) {
			lastError = err;
			if (isTimeoutError(err)) {
				await unlinkIfExists(partPath);
				throw new Error("Timed out downloading release binary after 15 minutes", { cause: err });
			}
			if (isUnsupportedProxyError(err)) {
				await unlinkIfExists(partPath);
				throw new Error(unsupportedProxyMessage(), { cause: err });
			}
			if (err instanceof NonRetriableDownloadError) {
				await unlinkIfExists(partPath);
				throw err;
			}

			if (attempt < maxRetries) {
				const delayMs = Math.min(1000 * Math.pow(2, attempt - 1), 8000);
				console.log(
					chalk.dim(
						`Network interrupted, resuming download (attempt ${attempt + 1}/${maxRetries} in ${(delayMs / 1000).toFixed(1)}s)…`,
					),
				);
				await new Promise(resolve => setTimeout(resolve, delayMs));
			}
		}
	}

	let finalSize = 0;
	try {
		if (fs.existsSync(partPath)) {
			finalSize = fs.statSync(partPath).size;
		}
	} catch {}

	if (finalSize !== options.expectedSize) {
		const curlBinary = $which("curl");
		if (curlBinary) {
			try {
				console.log(chalk.dim("Resuming download via native curl fallback…"));
				const proc = Bun.spawnSync([
					curlBinary,
					"-fL",
					"-C",
					"-",
					"--retry",
					"5",
					"--retry-delay",
					"2",
					"-o",
					partPath,
					options.url,
				]);
				if (proc.exitCode === 0 && fs.existsSync(partPath)) {
					finalSize = fs.statSync(partPath).size;
				}
			} catch {
				// curl fallback failed, propagate lastError
			}
		}
	}

	if (finalSize !== options.expectedSize) {
		await unlinkIfExists(partPath);
		throw (
			lastError ??
			new Error(`Downloaded binary size mismatch: expected ${options.expectedSize} bytes, received ${finalSize}`)
		);
	}

	const hash = createHash("sha256");
	const fileStream = fs.createReadStream(partPath);
	for await (const chunk of fileStream) {
		hash.update(chunk);
	}
	const digest = `sha256:${hash.digest("hex")}`;

	if (digest !== options.expectedDigest) {
		await unlinkIfExists(partPath);
		throw new Error(`Downloaded binary digest mismatch: expected ${options.expectedDigest}, received ${digest}`);
	}

	await unlinkIfExists(options.targetPath);
	await fs.promises.rename(partPath, options.targetPath);
	await fs.promises.chmod(options.targetPath, 0o755);
}

/** Result from running the installed binary and parsing its reported version. */
export interface InstalledVersionVerification {
	ok: boolean;
	actual?: string;
	path?: string;
}

/** Paths and verifier used while replacing a downloaded binary update. */
export interface BinaryReplacementOptions {
	targetPath: string;
	tempPath: string;
	backupPath: string;
	expectedVersion: string;
	verifyInstalledVersion: (expectedVersion: string) => Promise<InstalledVersionVerification>;
}

/**
 * Parse update subcommand arguments.
 * Returns undefined if not an update command.
 */
export function parseUpdateArgs(
	args: string[],
): { force: boolean; check: boolean; plugins: boolean; channel?: UpdateChannel } | undefined {
	if (args.length === 0 || args[0] !== "update") {
		return undefined;
	}

	const canary = args.includes("--canary");
	const stable = args.includes("--stable");
	if (canary && stable) throw new Error("--canary and --stable are mutually exclusive");

	return {
		force: args.includes("--force") || args.includes("-f"),
		check: args.includes("--check") || args.includes("-c"),
		plugins: args.includes("--plugins") || args.includes("-l"),
		channel: canary ? "canary" : stable ? "stable" : undefined,
	};
}

/** Windows script shims (npm's launchers) that a native executable cannot overwrite. */
function isWindowsScriptLauncherPath(launcherPath: string): boolean {
	const extension = path.extname(launcherPath).toLowerCase();
	return extension === ".cmd" || extension === ".ps1" || extension === ".bat";
}

/** OhMyShark ships a standalone binary only, so every install updates in place. */
export type UpdateMethod = "binary";

export interface UpdateTarget {
	method: "binary";
	path: string;
}

/**
 * Test seam preserving the old `resolveUpdateMethodForTest(ompPath, bunBinDir)`
 * call shape. The classification inputs are ignored: without npm, Homebrew, or
 * Mise channels there is nothing to distinguish.
 */
export function resolveUpdateMethodForTest(_ompPath: string, _bunBinDir?: string): UpdateMethod {
	return "binary";
}

/**
 * Resolve the binary to replace: the `omsk`/`ohms` launcher on PATH, updated in place.
 */
async function resolveUpdateTarget(): Promise<UpdateTarget> {
	const launcherPath = resolveOmpPath();
	if (!launcherPath) throw new Error(`Could not resolve ${APP_NAME} binary path in PATH`);
	return { method: "binary", path: launcherPath };
}

/** Product tag pattern: `omsk-v<semver>` or `ohms-v<semver>`, with an optional prerelease suffix. */
const TAG_PATTERN = /^(?:omsk|ohms)-v(\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?)$/;

/**
 * Parse an `omsk-v<semver>` or `ohms-v<semver>` tag into its product version.
 * Returns undefined for anything else so foreign tags are never installed.
 */
export function parseProductTag(tag: unknown): string | undefined {
	if (typeof tag !== "string") return undefined;
	return tag.match(TAG_PATTERN)?.[1];
}

/**
 * Get the latest stable OhMyShark release from the fork's GitHub releases.
 *
 * Stable is the only channel: a canary request reports that no canary channel
 * exists instead of falling back to anything upstream. Only tags matching
 * `omsk-v<semver>` or `ohms-v<semver>` are accepted.
 */
export async function getLatestRelease(
	options: { timeoutMs?: number; channel?: UpdateChannel; fetchImpl?: Fetch; githubToken?: string } = {},
): Promise<ReleaseInfo> {
	const timeoutMs = options.timeoutMs ?? RELEASE_METADATA_TIMEOUT_MS;
	const channel = options.channel ?? "stable";
	if (channel === "canary") {
		throw new Error(`No canary channel exists for ${APP_NAME}; stable is the only update channel.`);
	}
	const fetchImpl = options.fetchImpl ?? fetch;
	const githubToken = resolveGitHubToken(options.githubToken);
	const headers: Record<string, string> = {
		Accept: "application/vnd.github+json",
		"X-GitHub-Api-Version": "2022-11-28",
	};
	if (githubToken) headers.Authorization = `Bearer ${githubToken}`;

	let response: Response;
	try {
		response = await fetchWithNetworkRetry(
			`${GITHUB_API}/repos/${REPO}/releases/latest`,
			{ headers },
			timeoutMs,
			fetchImpl,
		);
	} catch (err) {
		if (isTimeoutError(err)) {
			throw new Error(`Timed out fetching release info for ${REPO} after ${Math.round(timeoutMs / 1000)}s`, {
				cause: err,
			});
		}
		if (isUnsupportedProxyError(err)) throw new Error(unsupportedProxyMessage(), { cause: err });
		const webRelease = await resolveLatestReleaseViaWebRedirect(timeoutMs, fetchImpl);
		if (webRelease) return webRelease;
		throw err;
	}
	if (response.status === 403 || response.status === 429) {
		// Rate limit fallback: resolve latest release tag via GitHub web redirect (rate-limit immune)
		const webRelease = await resolveLatestReleaseViaWebRedirect(timeoutMs, fetchImpl);
		if (webRelease) return webRelease;
		throw new Error(
			"GitHub API rate limit exceeded while fetching release metadata; retry later or set GITHUB_TOKEN or GH_TOKEN",
		);
	}
	if (!response.ok) {
		throw new Error(`Failed to fetch release info for ${REPO}: ${response.statusText}`);
	}

	const rawData: unknown = await response.json();
	const data = Array.isArray(rawData)
		? rawData.find(
				item =>
					isRecord(item) && item.draft === false && item.prerelease === false && parseProductTag(item.tag_name),
			)
		: rawData;
	if (!isRecord(data)) {
		throw new Error(`No stable ${TAG_PREFIX}<semver> release found for ${REPO}`);
	}
	if (data.prerelease === true) {
		throw new Error(`Latest ${REPO} release is a prerelease; refusing to install it on the stable channel`);
	}
	const version = parseProductTag(data.tag_name);
	if (!version) {
		const seen = typeof data.tag_name === "string" ? `"${data.tag_name}"` : "a missing tag";
		throw new Error(`GitHub release with ${seen} is not an ${TAG_PREFIX}<semver> release`);
	}
	return {
		tag:
			typeof data.tag_name === "string" && (data.tag_name.startsWith("omsk-v") || data.tag_name.startsWith("ohms-v"))
				? data.tag_name
				: `${TAG_PREFIX}${version}`,
		version,
		dist: "binary",
	};
}

interface MuslDetectionOptions {
	platform?: NodeJS.Platform;
	alpineRelease?: boolean;
	lddOutput?: string;
}

function detectLddOutput(): string | undefined {
	try {
		const result = Bun.spawnSync(["ldd", "--version"], { stdout: "pipe", stderr: "pipe" });
		return `${result.stdout.toString("utf-8")}\n${result.stderr.toString("utf-8")}`;
	} catch {
		return undefined;
	}
}

function isMuslLinux(options: MuslDetectionOptions = {}): boolean {
	if ((options.platform ?? process.platform) !== "linux") return false;
	if (options.alpineRelease ?? fs.existsSync("/etc/alpine-release")) return true;
	return /\bmusl\b/i.test(options.lddOutput ?? detectLddOutput() ?? "");
}

/** Test seam for libc detection. */
export function isMuslLinuxForTest(options: Required<MuslDetectionOptions>): boolean {
	return isMuslLinux(options);
}

/**
 * Get the appropriate binary name for this platform.
 */
function getBinaryName(): string {
	const platform = process.platform;
	const arch = process.arch;

	let os: string;
	switch (platform) {
		case "linux":
			os = isMuslLinux() ? "linux-musl" : "linux";
			break;
		case "darwin":
			os = "darwin";
			break;
		case "win32":
			os = "windows";
			break;
		default:
			throw new Error(`Unsupported platform: ${platform}`);
	}

	let archName: string;
	switch (arch) {
		case "x64":
			archName = "x64";
			break;
		case "arm64":
			archName = "arm64";
			break;
		default:
			throw new Error(`Unsupported architecture: ${arch}`);
	}

	if (os === "windows") {
		return `ohms-${os}-${archName}.exe`;
	}
	return `ohms-${os}-${archName}`;
}

/**
 * Resolve the path that `omsk` / `ohms` maps to in the user's PATH.
 */
function resolveOmpPath(): string | undefined {
	return $which(APP_NAME) ?? $which("ohms") ?? undefined;
}

/**
 * Parse the version a launcher reports from `omsk --version` / `ohms --version` output.
 */
export function parseReportedVersion(output: string): string | undefined {
	return output.match(/\/(\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?)/)?.[1];
}

/**
 * Run a specific binary and check if it reports the expected version.
 */
async function verifyBinaryAtPath(binaryPath: string, expectedVersion: string): Promise<InstalledVersionVerification> {
	try {
		const result = await $`${binaryPath} --version`.quiet().nothrow();
		if (result.exitCode !== 0) return { ok: false, path: binaryPath };
		const actual = parseReportedVersion(result.text().trim());
		return { ok: actual === expectedVersion, actual, path: binaryPath };
	} catch {
		return { ok: false, path: binaryPath };
	}
}

/**
 * Run the PATH-resolved launcher binary and check if it reports the expected version.
 */
export async function verifyInstalledVersion(expectedVersion: string): Promise<InstalledVersionVerification> {
	const ompPath = resolveOmpPath();
	if (!ompPath) return { ok: false };
	return await verifyBinaryAtPath(ompPath, expectedVersion);
}

/** Publish extension assets from a verified launcher, not from the process that updated it. */
export async function syncRelayAfterVerifiedUpdate(launcher: string | undefined): Promise<void> {
	if (!launcher) return;
	try {
		await $`${launcher} browser-relay sync`.quiet().nothrow();
	} catch {
		// Non-fatal: browser relay extension sync is best-effort after update.
	}
}

function printVerifiedVersion(expectedVersion: string): void {
	console.log(chalk.green(`\n✔ Updated to ${expectedVersion}`));
}

function formatVerificationFailure(result: InstalledVersionVerification, expectedVersion: string): string {
	if (result.actual) {
		return `${APP_NAME} at ${result.path} still reports ${result.actual} (expected ${expectedVersion})`;
	}
	return `could not verify updated version${result.path ? ` at ${result.path}` : ""}`;
}

async function unlinkIfExists(filePath: string): Promise<void> {
	try {
		await fs.promises.unlink(filePath);
	} catch (err) {
		if (!isEnoent(err)) throw err;
	}
}

async function removeBackupBestEffort(filePath: string): Promise<boolean> {
	try {
		await fs.promises.unlink(filePath);
		return true;
	} catch (err) {
		return isEnoent(err);
	}
}

/**
 * Best-effort removal of binary-update leftovers from earlier runs.
 */
export async function sweepStaleUpdateArtifacts(targetPath: string): Promise<void> {
	const dir = path.dirname(targetPath);
	const base = path.basename(targetPath);
	let entries: string[];
	try {
		entries = await fs.promises.readdir(dir);
	} catch {
		return;
	}
	const now = Date.now();
	for (const entry of entries) {
		if (!entry.startsWith(`${base}.`)) continue;
		const suffix = entry.endsWith(".bak") ? ".bak" : entry.endsWith(".new") ? ".new" : undefined;
		if (!suffix) continue;
		const middle = entry.slice(base.length + 1, entry.length - suffix.length);
		if (middle.length > 0 && !/^\d+(\.\d+)*$/.test(middle)) continue;
		const full = path.join(dir, entry);
		if (suffix === ".new") {
			let mtimeMs: number;
			try {
				mtimeMs = (await fs.promises.stat(full)).mtimeMs;
			} catch {
				continue;
			}
			if (now - mtimeMs < BINARY_DOWNLOAD_TIMEOUT_MS) continue;
		}
		await removeBackupBestEffort(full);
	}
}

/**
 * Atomically replace the installed binary and roll back if version verification fails.
 */
export async function replaceBinaryForUpdate(options: BinaryReplacementOptions): Promise<InstalledVersionVerification> {
	let backupReady = false;
	try {
		try {
			await fs.promises.rename(options.targetPath, options.backupPath);
			backupReady = true;
		} catch (err) {
			if (!isEnoent(err)) throw err;
		}
		await fs.promises.rename(options.tempPath, options.targetPath);

		const verification = await options.verifyInstalledVersion(options.expectedVersion);
		if (!verification.ok) {
			throw new Error(
				`${formatVerificationFailure(verification, options.expectedVersion)}; restored previous ${APP_NAME} binary`,
			);
		}

		backupReady = false;
		await removeBackupBestEffort(options.backupPath);
		return verification;
	} catch (err) {
		if (backupReady) {
			await unlinkIfExists(options.targetPath);
			await fs.promises.rename(options.backupPath, options.targetPath);
		}
		await unlinkIfExists(options.tempPath);
		throw err;
	}
}

let updateAttemptSeq = 0;

/**
 * Download a release binary to a target path, replacing an existing file.
 */
export async function updateViaBinaryAt(
	targetPath: string,
	expectedVersion: string,
	options: {
		binaryName?: string;
		fetchImpl?: Fetch;
		githubToken?: string;
		allowPrerelease?: boolean;
		expectedTag?: string;
		verifyInstalledVersion?: typeof verifyInstalledVersion;
		onProgress?: UpdateProgressListener;
	} = {},
): Promise<void> {
	const binaryName = options.binaryName ?? getBinaryName();
	const attempt = `${Date.now()}.${process.pid}.${updateAttemptSeq++}`;
	const tempPath = `${targetPath}.${attempt}.new`;
	const backupPath = `${targetPath}.${attempt}.bak`;
	const asset = await getReleaseBinaryAsset(
		expectedVersion,
		binaryName,
		options.fetchImpl,
		options.githubToken,
		options.allowPrerelease,
		options.expectedTag,
	);
	console.log(chalk.dim(`Downloading ${binaryName}…`));
	await downloadVerifiedBinary({
		url: asset.url,
		targetPath: tempPath,
		expectedSize: asset.size,
		expectedDigest: asset.digest,
		fetchImpl: options.fetchImpl,
		onProgress: (received, total) =>
			options.onProgress?.({ phase: "downloading", version: expectedVersion, received, total }),
	});
	console.log(chalk.dim(`Verified ${asset.digest}`));
	options.onProgress?.({ phase: "installing", version: expectedVersion });

	await withUpdateFileLock(targetPath, async () => {
		console.log(chalk.dim("Installing update..."));
		await replaceBinaryForUpdate({
			targetPath,
			tempPath,
			backupPath,
			expectedVersion,
			verifyInstalledVersion: options.verifyInstalledVersion ?? verifyInstalledVersion,
		});
		await sweepStaleUpdateArtifacts(targetPath);
	});
	await syncRelayAfterVerifiedUpdate(targetPath);
	printVerifiedVersion(expectedVersion);
	console.log(chalk.dim(`Restart ${APP_NAME} to use the new version`));
}

const SHIM_FORWARDERS: Record<string, string> = {
	"": `#!/bin/sh\nexec "$(dirname "$0")/${APP_NAME}.exe" "$@"\n`,
	".cmd": `@"%~dp0${APP_NAME}.exe" %*\r\n`,
	".bat": `@"%~dp0${APP_NAME}.exe" %*\r\n`,
	".ps1": `& "$PSScriptRoot\\${APP_NAME}.exe" @args\nexit $LASTEXITCODE\n`,
};

/**
 * Take over a Windows script-launcher install for a binary-only release.
 */
export async function updateViaShimTakeover(
	shimPath: string,
	expectedVersion: string,
	options: {
		binaryName?: string;
		fetchImpl?: Fetch;
		githubToken?: string;
		allowPrerelease?: boolean;
		expectedTag?: string;
		verifyBinary?: typeof verifyBinaryAtPath;
		onProgress?: UpdateProgressListener;
	} = {},
): Promise<void> {
	const binaryName = options.binaryName ?? getBinaryName();
	const launcherDir = path.dirname(shimPath);
	const exePath = path.join(launcherDir, `${APP_NAME}.exe`);
	const attempt = `${Date.now()}.${process.pid}.${updateAttemptSeq++}`;
	const tempPath = `${exePath}.${attempt}.new`;
	const asset = await getReleaseBinaryAsset(
		expectedVersion,
		binaryName,
		options.fetchImpl,
		options.githubToken,
		options.allowPrerelease,
		options.expectedTag,
	);
	console.log(chalk.dim(`Downloading ${binaryName}…`));
	await downloadVerifiedBinary({
		url: asset.url,
		targetPath: tempPath,
		expectedSize: asset.size,
		expectedDigest: asset.digest,
		fetchImpl: options.fetchImpl,
		onProgress: (received, total) =>
			options.onProgress?.({ phase: "downloading", version: expectedVersion, received, total }),
	});
	console.log(chalk.dim(`Verified ${asset.digest}`));
	options.onProgress?.({ phase: "installing", version: expectedVersion });
	const forwarded: Array<{ launcher: string; original: string }> = [];
	const stuck: string[] = [];
	await withUpdateFileLock(exePath, async () => {
		console.log(chalk.dim(`Installing ${APP_NAME}.exe beside the script launcher...`));
		await fs.promises.rename(tempPath, exePath);
		const backupSuffix = `${attempt}.bak`;
		const retired: Array<{ launcher: string; backup: string }> = [];
		for (const ext of ["", ".cmd", ".ps1", ".bat"]) {
			const launcher = path.join(launcherDir, `${APP_NAME}${ext}`);
			const backup = `${launcher}.${backupSuffix}`;
			try {
				await fs.promises.rename(launcher, backup);
				retired.push({ launcher, backup });
			} catch (err) {
				if (isEnoent(err)) continue;
				try {
					const original = await Bun.file(launcher).text();
					await Bun.write(launcher, SHIM_FORWARDERS[ext]);
					forwarded.push({ launcher, original });
				} catch {
					stuck.push(launcher);
				}
			}
		}

		const verify = options.verifyBinary ?? verifyBinaryAtPath;
		const verification = await verify(exePath, expectedVersion);
		if (!verification.ok) {
			for (const { launcher, backup } of retired) {
				try {
					await fs.promises.rename(backup, launcher);
				} catch {}
			}
			for (const { launcher, original } of forwarded) {
				try {
					await Bun.write(launcher, original);
				} catch {}
			}
			await unlinkIfExists(exePath);
			throw new Error(
				`${formatVerificationFailure(verification, expectedVersion)}; restored previous ${APP_NAME} launcher`,
			);
		}
		for (const { backup } of retired) {
			await removeBackupBestEffort(backup);
		}
		for (const ext of [".exe", "", ".cmd", ".ps1", ".bat"]) {
			await sweepStaleUpdateArtifacts(path.join(launcherDir, `${APP_NAME}${ext}`));
		}
	});
	for (const { launcher } of forwarded) {
		console.log(chalk.dim(`Converted ${launcher} to a forwarder (it could not be removed).`));
	}
	for (const launcher of stuck) {
		console.log(
			chalk.yellow(
				`Could not retire ${launcher}; shells that prefer it may keep launching the old version until it is deleted manually.`,
			),
		);
	}
	await syncRelayAfterVerifiedUpdate(exePath);
	printVerifiedVersion(expectedVersion);
	console.log(chalk.dim(`Restart ${APP_NAME} to use the new version`));
}

function installerHint(): string {
	return process.platform === "win32"
		? "& ([scriptblock]::Create((irm https://ohmyshark.vercel.app/install.ps1))) -Binary"
		: "curl -fsSL https://ohmyshark.vercel.app/install | sh -s -- --binary";
}

/**
 * Run the update command.
 *
 * Binary-only: the release is always the fork's latest stable `omsk-v<semver>` or
 * `ohms-v<semver>` GitHub release, compared against PRODUCT_VERSION, and the
 * PATH-resolved launcher is replaced in place.
 */
export async function runUpdateCommand(opts: UpdateOptions): Promise<UpdateOutcome> {
	console.log(chalk.dim(`Current version: ${PRODUCT_VERSION}`));
	const channel = opts.channel ?? "stable";
	if (channel === "canary") {
		throw new Error(`No canary channel exists for ${APP_NAME}; stable is the only update channel.`);
	}

	let release: ReleaseInfo;
	try {
		release = await getLatestRelease({ channel: "stable" });
	} catch (err) {
		throw new Error(`Failed to check for updates: ${err instanceof Error ? err.message : String(err)}`, {
			cause: err,
		});
	}

	const comparison = compareVersions(release.version, PRODUCT_VERSION);

	if (comparison <= 0 && !opts.force) {
		console.log(chalk.green("✔ Already up to date"));
		return { kind: "current" };
	}

	if (comparison > 0) {
		console.log(chalk.cyan(`New version available: ${release.version}`));
	} else {
		console.log(chalk.yellow(`Forcing reinstall of ${release.version}`));
	}

	if (opts.check) {
		return { kind: "available", version: release.version };
	}

	const target = await resolveUpdateTarget();
	if (process.platform === "win32" && isWindowsScriptLauncherPath(target.path)) {
		console.log(chalk.dim("This release ships as a standalone binary; replacing the script launcher."));
		await updateViaShimTakeover(target.path, release.version, {
			expectedTag: release.tag,
			onProgress: opts.onProgress,
		});
		console.log(
			chalk.yellow(
				`This install is no longer managed by a package manager. If the launcher breaks, reinstall with: ${installerHint()}`,
			),
		);
	} else {
		await updateViaBinaryAt(target.path, release.version, {
			expectedTag: release.tag,
			onProgress: opts.onProgress,
		});
	}
	return { kind: "installed", version: release.version };
}

/**
 * Print update command help.
 */
export function printUpdateHelp(): void {
	console.log(`${chalk.bold(`${APP_NAME} update`)} - Check for and install updates

${chalk.bold("Usage:")}
  ${APP_NAME} update [options]

${chalk.bold("Options:")}
  -c, --check     Check for updates without installing
  -f, --force     Force reinstall even if up to date
  -l, --plugins   Update installed plugins
  --canary        Switch to the canary channel and update
  --stable        Switch back to the stable channel

${chalk.bold("Examples:")}
  ${APP_NAME} update              Update to latest version
  ${APP_NAME} update --check      Check if updates are available
  ${APP_NAME} update --force      Force reinstall
  ${APP_NAME} update -l           Update installed plugins
  ${APP_NAME} update --canary    Switch to the canary channel and update
`);
}
