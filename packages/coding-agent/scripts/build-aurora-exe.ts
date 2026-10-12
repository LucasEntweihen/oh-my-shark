import * as path from "node:path";
import * as fs from "node:fs/promises";
import { compileCodingAgent } from "./compile-binary";

const packageDir = path.resolve(import.meta.dir, "..");
const repoRoot = path.resolve(packageDir, "..", "..");
const launcherEntrypoint = path.join(packageDir, "src", "aurora", "launcher.ts");

const outfileCosmoSky = path.join(repoRoot, "CosmoSky-windows-x64.exe");
const outfileOmsk = path.join(repoRoot, "omsk-windows-x64.exe");

async function buildCosmoSkyExe() {
	console.log(`Compilando executável CosmoSky em ${outfileCosmoSky}...`);
	await compileCodingAgent({
		repoRoot,
		entrypoint: launcherEntrypoint,
		outfile: outfileCosmoSky,
		transformersVersion: "3.2.4",
	});
	console.log(`CosmoSky compilado com sucesso: ${outfileCosmoSky}`);

	// Copia também como omsk-windows-x64.exe para garantir compatibilidade total com os downloads existentes
	await fs.copyFile(outfileCosmoSky, outfileOmsk);
	console.log(`Copiado com sucesso para ${outfileOmsk}`);
}

await buildCosmoSkyExe();
