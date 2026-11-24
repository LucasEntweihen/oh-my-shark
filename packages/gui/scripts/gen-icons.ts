/**
 * Generate the OhMyShark (OMSK) app icons from resources/omsk-logo.png:
 * - 1024px master PNG (`resources/icon.png`)
 * - 256px renderer favicon/logo (`src/renderer/public/omsk-logo.png`)
 * - Cross-platform macOS `.icns` (`resources/icon.icns`) using PNG-compressed icon chunks
 * - Linux `resources/icons/*.png` set
 * - Windows multi-resolution `resources/icon.ico`
 *
 * Run: `bun run scripts/gen-icons.ts` (from packages/gui).
 */

import { existsSync, writeFileSync } from "node:fs";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import sharp from "sharp";

const guiRoot = path.join(import.meta.dir, "..");
const resources = path.join(guiRoot, "resources");
const logoPngPath = path.join(resources, "omsk-logo.png");
const fallbackSvgPath = path.join(resources, "icon-source.svg");
const rendererPublicLogo = path.join(guiRoot, "src", "renderer", "public", "omsk-logo.png");

const ICNS_CHUNKS: ReadonlyArray<readonly [type: string, px: number]> = [
	["icp4", 16],
	["icp5", 32],
	["icp6", 64],
	["ic07", 128],
	["ic08", 256],
	["ic09", 512],
	["ic10", 1024],
];
const LINUX_SIZES = [16, 32, 48, 64, 128, 256, 512, 1024] as const;
const ICO_SIZES = [16, 32, 48, 64, 128, 256] as const;

function roundedMaskSvg(size: number): Buffer {
	const radius = Math.round(size * 0.22);
	return Buffer.from(
		`<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}"><rect x="0" y="0" width="${size}" height="${size}" rx="${radius}" ry="${radius}" fill="#ffffff"/></svg>`,
	);
}

async function renderSquare(source: Buffer, size: number, rounded: boolean): Promise<Buffer> {
	const base = sharp(source).resize(size, size, { fit: "cover", position: "centre" }).ensureAlpha();
	if (!rounded) {
		return base.png().toBuffer();
	}
	return base
		.composite([{ input: roundedMaskSvg(size), blend: "dest-in" }])
		.png()
		.toBuffer();
}

function writeIcns(chunks: ReadonlyArray<{ type: string; data: Buffer }>, outPath: string): void {
	const payload = chunks.map(({ type, data }) => {
		const header = Buffer.alloc(8);
		header.write(type, 0, 4, "ascii");
		header.writeUInt32BE(8 + data.length, 4);
		return Buffer.concat([header, data]);
	});
	const body = Buffer.concat(payload);
	const fileHeader = Buffer.alloc(8);
	fileHeader.write("icns", 0, 4, "ascii");
	fileHeader.writeUInt32BE(8 + body.length, 4);
	writeFileSync(outPath, Buffer.concat([fileHeader, body]));
}

function writeIco(frames: { size: number; data: Buffer }[], outPath: string): void {
	const header = Buffer.alloc(6);
	header.writeUInt16LE(0, 0);
	header.writeUInt16LE(1, 2);
	header.writeUInt16LE(frames.length, 4);
	const entries = Buffer.alloc(16 * frames.length);
	const blobs: Buffer[] = [];
	let offset = header.length + entries.length;
	for (const [index, frame] of frames.entries()) {
		const width = frame.size >= 256 ? 0 : frame.size;
		entries.writeUInt8(width, index * 16);
		entries.writeUInt8(width, index * 16 + 1);
		entries.writeUInt16LE(1, index * 16 + 4);
		entries.writeUInt16LE(32, index * 16 + 6);
		entries.writeUInt32LE(frame.data.length, index * 16 + 8);
		entries.writeUInt32LE(offset, index * 16 + 12);
		blobs.push(frame.data);
		offset += frame.data.length;
	}
	writeFileSync(outPath, Buffer.concat([header, entries, ...blobs]));
}

async function main(): Promise<void> {
	const sourcePath = existsSync(logoPngPath) ? logoPngPath : fallbackSvgPath;
	const source = await fs.readFile(sourcePath);

	// Master 1024px rounded squircle PNG for macOS dock & app bundle
	await Bun.write(path.join(resources, "icon.png"), await renderSquare(source, 1024, true));

	// 256px crisp rounded icon for renderer UI and HTML favicon
	await fs.mkdir(path.dirname(rendererPublicLogo), { recursive: true });
	await Bun.write(rendererPublicLogo, await renderSquare(source, 256, true));

	// Cross-platform Apple .icns (PNG chunks inside icns container)
	const icnsChunks = await Promise.all(
		ICNS_CHUNKS.map(async ([type, px]) => ({
			type,
			data: await renderSquare(source, px, true),
		})),
	);
	writeIcns(icnsChunks, path.join(resources, "icon.icns"));

	// Linux PNG set
	const linuxDir = path.join(resources, "icons");
	await fs.mkdir(linuxDir, { recursive: true });
	for (const px of LINUX_SIZES) {
		await Bun.write(path.join(linuxDir, `${px}x${px}.png`), await renderSquare(source, px, true));
	}

	// Windows multi-resolution .ico (rounded squircle with transparent outer corners)
	const icoFrames = await Promise.all(
		ICO_SIZES.map(async size => ({ size, data: await renderSquare(source, size, true) })),
	);
	writeIco(icoFrames, path.join(resources, "icon.ico"));

	console.log("Generated OMSK icon.png, icon.icns, icon.ico, resources/icons/*.png, and renderer omsk-logo.png");
}

await main();
