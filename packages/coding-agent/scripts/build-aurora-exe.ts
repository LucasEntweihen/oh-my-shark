import * as path from "node:path";
import { compileCodingAgent } from "./compile-binary";

const packageDir = path.resolve(import.meta.dir, "..");
const repoRoot = path.resolve(packageDir, "..", "..");
const launcherEntrypoint = path.join(packageDir, "src", "aurora", "launcher.ts");
const outfile = path.join(repoRoot, "omsk-windows-x64.exe");

async function buildAuroraExe() {
	console.log(`Compilando executável Aurora Desktop em ${outfile}...`);
	await compileCodingAgent({
		repoRoot,
		entrypoint: launcherEntrypoint,
		outfile,
		transformersVersion: "3.2.4",
	});
	console.log(`Executável compilado com sucesso: ${outfile}`);
}

await buildAuroraExe();
