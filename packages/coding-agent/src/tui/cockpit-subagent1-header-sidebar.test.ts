import { describe, expect, it } from "bun:test";
import { DeepSeaCockpit, type LspStatusItem, type SessionHistoryItem, stripAnsi } from "./deep-sea-command";

describe("Subagent 1: Header & Sidebar Engine", () => {
	it("TDD 1.1: should omit removed top header bar and expose real model/provider/version in sidebar", () => {
		const cockpit = new DeepSeaCockpit({
			version: "0.1.4",
			modelName: "gemini-2.5-pro",
			providerName: "Google",
		});

		const headerLines = cockpit.renderHeader(120);
		expect(headerLines).toEqual([]);

		const sidebarText = stripAnsi(cockpit.renderSidebar(40, 25).join("\n"));
		expect(sidebarText).toContain("Oh My Shark");
		expect(sidebarText).toContain("v0.1.4");
		expect(sidebarText).toContain("gemini-2.5-pro");
		expect(sidebarText).toContain("Google");
		expect(sidebarText).toContain("●");
	});

	it("TDD 1.2: should render sidebar with pixel shark mark, OMSK wordmark, and live workspace telemetry", () => {
		const cockpit = new DeepSeaCockpit({ workspaceName: "oh-my-shark", gitBranch: "main" });
		const sidebarLines = cockpit.renderSidebar(28, 25);
		expect(sidebarLines.length).toBeGreaterThanOrEqual(10);

		const sidebarText = stripAnsi(sidebarLines.join("\n"));
		expect(sidebarText).toContain("OMSK");
		expect(sidebarText).toContain("Oh My Shark");
		expect(sidebarText).toContain("oh-my-shark (main)");
		// Must include pixel art / shark structure
		expect(sidebarLines.some(l => l.includes("▄") || l.includes("█") || l.includes("■") || l.includes(";"))).toBe(
			true,
		);
	});

	it("TDD 1.3: should render quick tips in sidebar with [NEW] tag highlighted", () => {
		const cockpit = new DeepSeaCockpit({
			quickTips: ["Use [Ctrl+D] to view detailed changes! [NEW]"],
		});

		const sidebarLines = cockpit.renderSidebar(28, 25);
		const sidebarText = stripAnsi(sidebarLines.join("\n"));
		expect(sidebarText).toContain("Quick Tips:");
		expect(sidebarText).toContain("Ctrl+D");
		expect(sidebarText).toContain("[NEW]");
	});

	it("TDD 1.4: should render recent sessions list with relative times", () => {
		const sessions: SessionHistoryItem[] = [
			{ name: "refactor-auth", timeAgo: "2h ago", active: true },
			{ name: "fix-memory-leak", timeAgo: "3h ago" },
			{ name: "add-tests", timeAgo: "1d ago" },
			{ name: "update-docs", timeAgo: "1d ago" },
		];

		const cockpit = new DeepSeaCockpit({
			recentSessions: sessions,
		});

		const sidebarLines = cockpit.renderSidebar(28, 25);
		const sidebarText = stripAnsi(sidebarLines.join("\n"));
		expect(sidebarText).toContain("Recent Sessions:");
		expect(sidebarText).toContain("refactor-auth");
		expect(sidebarText).toContain("2h ago");
		expect(sidebarText).toContain("fix-memory-leak");
		expect(sidebarText).toContain("3h ago");
	});

	it("TDD 1.5: should render LSP servers list with status indicators and associated languages", () => {
		const lspServers: LspStatusItem[] = [
			{ name: "tsserver", language: "TypeScript", status: "ready" },
			{ name: "pyright", language: "Python", status: "ready" },
			{ name: "rust-analyzer", language: "Rust", status: "ready" },
		];

		const cockpit = new DeepSeaCockpit({
			lspServers,
		});

		const sidebarLines = cockpit.renderSidebar(28, 25);
		const sidebarText = stripAnsi(sidebarLines.join("\n"));
		expect(sidebarText).toContain("LSP Servers:");
		expect(sidebarText).toContain("tsserver");
		expect(sidebarText).toContain("TypeScript");
		expect(sidebarText).toContain("pyright");
		expect(sidebarText).toContain("Python");
		expect(sidebarText).toContain("rust-analyzer");
		expect(sidebarText).toContain("Rust");
	});
});
