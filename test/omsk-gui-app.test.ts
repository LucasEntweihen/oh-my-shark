import { describe, expect, it } from "bun:test";
import * as fs from "node:fs";
import * as path from "node:path";

describe("OMSK GUI Native Application Architecture (TDD)", () => {
  const rootDir = path.resolve(__dirname, "..");
  const omskGuiDir = path.resolve(rootDir, "..", "OMSK-gui");
  const appExePath = path.join(rootDir, "apps", "omsk-gui", "OMSK GUI.exe");
  const appPackageJson = path.join(omskGuiDir, "package.json");
  const electronMainJs = path.join(omskGuiDir, "electron", "dist", "main.js");

  it("1. OMSK GUI packaged executable exists in apps/omsk-gui", () => {
    expect(fs.existsSync(appExePath)).toBe(true);
    const stats = fs.statSync(appExePath);
    expect(stats.size).toBeGreaterThan(50 * 1024 * 1024); // Standalone executable > 50MB
  });

  it("2. electron main bundle uses strict CommonJS (no bare ES import statement)", () => {
    expect(fs.existsSync(electronMainJs)).toBe(true);
    const mainContent = fs.readFileSync(electronMainJs, "utf-8");
    expect(mainContent.startsWith("import ")).toBe(false);
    expect(mainContent.includes("\"use strict\";")).toBe(true);
    expect(mainContent.includes("require(\"electron\")")).toBe(true);
  });

  it("3. package.json in OMSK-gui specifies main.js and commonjs compatibility", () => {
    expect(fs.existsSync(appPackageJson)).toBe(true);
    const pkg = JSON.parse(fs.readFileSync(appPackageJson, "utf-8"));
    expect(pkg.main).toBe("electron/dist/main.js");
    expect(pkg.productName).toBe("OMSK GUI");
    expect(pkg.type).toBe("commonjs");
  });

  it("4. Shortcut 'OMSK GUI.lnk' exists in root repository", () => {
    const lnkPath = path.join(rootDir, "OMSK GUI.lnk");
    expect(fs.existsSync(lnkPath)).toBe(true);
  });

  it("5. Root package.json has 'gui:app' script to launch the app", () => {
    const rootPkg = JSON.parse(fs.readFileSync(path.join(rootDir, "package.json"), "utf-8"));
    expect(typeof rootPkg.scripts["gui:app"]).toBe("string");
    expect(rootPkg.scripts["gui:app"]).toContain("OMSK GUI.exe");
  });

  it("6. Website landing page has prominent OMSK GUI Download button", () => {
    const siteAppTsx = fs.readFileSync(path.join(rootDir, "site", "src", "App.tsx"), "utf-8");
    expect(siteAppTsx).toContain("heroDownloadGui");
    expect(siteAppTsx).toContain("OMSK-GUI-Windows-x64.zip");
  });
});
