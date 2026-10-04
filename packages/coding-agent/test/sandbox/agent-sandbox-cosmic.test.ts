import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { interpretAgentFromNaturalLanguage, interpretVisualProfile } from "../../src/avatar/interpreter";
import { DEFAULT_AGENT_PROFILES } from "../../src/avatar/presets";
import { compileAgentsMarkdown } from "../../src/sandbox/agents-storage";
import { type SandboxServerInstance, startAgentSandboxServer } from "../../src/sandbox/server";

describe("Cosmic Agent Sandbox & Bible Strong Avatar Studio", () => {
	let server: SandboxServerInstance;

	beforeAll(async () => {
		server = await startAgentSandboxServer(process.cwd());
	});

	afterAll(() => {
		server.stop();
	});

	describe("Visual Profile Interpretation Engine", () => {
		it("interprets technical code architect correctly", () => {
			const visual = interpretVisualProfile({
				role: "Engenheiro de Implementação",
				title: "Especialista em Engenharia & TypeScript",
				tone: "Técnico, rigoroso e refinado",
				description: "Arquiteto de código limpo com Bun e zero-overhead",
				traits: ["Precisão", "Taste apurado"],
			});

			expect(visual.surface).toBe("cube");
			expect(visual.colors.body).toBe("#10B981");
			expect(visual.fullBody.style).toBe("minimalist");
			expect(visual.fullBody.clothing).toBe("suit");
			expect(visual.fullBody.posture).toBe("upright");
			expect(visual.fullBody.limbs?.armsPosition).toBe("folded");
		});

		it("interprets security sentinel correctly", () => {
			const visual = interpretVisualProfile({
				role: "Auditor de Segurança",
				title: "Auditor de Segurança & Vulnerabilidades",
				tone: "Cético, vigilante e detalhista",
				description: "Auditoria contínua de segurança e defesa",
				traits: ["Inflexibilidade", "Vigilância"],
			});

			expect(visual.surface).toBe("cylinder");
			expect(visual.colors.body).toBe("#EF4444");
			expect(visual.fullBody.style).toBe("tactical");
			expect(visual.fullBody.clothing).toBe("armor");
			expect(visual.fullBody.posture).toBe("tactical");
			expect(visual.fullBody.limbs?.armsPosition).toBe("ready");
		});

		it("interprets theological scholar correctly", () => {
			const visual = interpretVisualProfile({
				role: "Pesquisador e Teólogo",
				title: "Pesquisador Lexicográfico & Teológico",
				tone: "Acadêmico, reverente e profundo",
				description: "Especialista em textos originais hebraico e grego e numeração de Strong",
				traits: ["Erudição", "Rigor filológico"],
			});

			expect(visual.surface).toBe("capsule");
			expect(visual.colors.body).toBe("#D4AF37");
			expect(visual.fullBody.style).toBe("scholar");
			expect(visual.fullBody.clothing).toBe("robe");
			expect(visual.fullBody.posture).toBe("scholarly");
			expect(visual.fullBody.accessories).toContain("glasses");
		});
	});

	describe("Natural Language Agent Interpreter", () => {
		it("extracts complete agent profile from natural prompt", () => {
			const prompt = "Quero um professor paciente de programação que explique conceitos com clareza e exemplos práticos.";
			const agent = interpretAgentFromNaturalLanguage(prompt);

			expect(agent.name).toBeDefined();
			expect(agent.id).toBeDefined();
			expect(agent.personality.tone).toContain("Paciente");
			expect(agent.avatar.schema).toBe("bible-strong/avatar-definition");
			expect(agent.avatar.fullBody).toBeDefined();
			expect(agent.avatar.fullBody?.posture).toBe("scholarly");
			expect(agent.functions).toContain("read");
			expect(agent.functions).toContain("write");
		});
	});

	describe("AGENTS.md Compilation with Full Body Metadata", () => {
		it("compiles AGENTS.md containing enhanced avatar specs", () => {
			const md = compileAgentsMarkdown(DEFAULT_AGENT_PROFILES);
			expect(md).toContain("# Regras e Diretrizes dos Agentes (AGENTS.md)");
			expect(md).toContain("Code Architect");
			expect(md).toContain("Shark Lead Orchestrator");
			expect(md).toContain("Avatar Bible Strong");
			expect(md).toContain("Vestimenta `suit`");
		});
	});

	describe("Server Endpoints & Cosmic UI Integration", () => {
		it("serves the Cosmic Refraction HTML at root and /chat", async () => {
			const resRoot = await fetch(`http://localhost:${server.port}/`);
			expect(resRoot.status).toBe(200);
			const html = await resRoot.text();
			expect(html).toContain("Cosmic Agent Studio & Bible Strong Avatars");
			expect(html).toContain("cosmic-viewport");
			expect(html).toContain("SECTOR // SHARK-PRIME");
			expect(html).toContain("viewStudio");
			expect(html).toContain("viewChat");

			const resChat = await fetch(`http://localhost:${server.port}/chat`);
			expect(resChat.status).toBe(200);
		});

		it("interprets prompt via POST /api/interpret-agent", async () => {
			const res = await fetch(`http://localhost:${server.port}/api/interpret-agent`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ prompt: "Auditor tático de cibersegurança militar" }),
			});
			expect(res.status).toBe(200);
			const data = (await res.json()) as { ok: boolean; agent: { id: string; avatar: { colors: { body: string } } } };
			expect(data.ok).toBe(true);
			expect(data.agent).toBeDefined();
			expect(data.agent.avatar.colors.body).toBe("#EF4444");
		});

		it("interacts in real-time via POST /api/chat with dynamic avatar telemetry", async () => {
			const res = await fetch(`http://localhost:${server.port}/api/chat`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					agentId: "code-architect",
					message: "Como otimizar a estrutura de dados sem alocação desnecessária?",
				}),
			});
			expect(res.status).toBe(200);
			const data = (await res.json()) as {
				ok: boolean;
				reply: string;
				expression: string;
				posture: string;
				telemetry: { model: string; thinkingLevel: string; latencyMs: number };
			};
			expect(data.ok).toBe(true);
			expect(data.reply).toContain("Code Architect");
			expect(data.expression).toBe("talking");
			expect(data.posture).toBe("upright");
			expect(data.telemetry.latencyMs).toBeGreaterThan(0);
		});
	});
});
