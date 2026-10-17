import { describe, expect, it, beforeEach } from "bun:test";
import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";
import { TaskPlanEngine } from "../src/task/plan-engine";
import { PlanApprovalFlow } from "../src/task/plan-approval-flow";
import { FileReadCache, ToolResultCompactor, ContextOptimizer } from "../src/optimization/context-optimizer";

describe("Oh My Shark — TaskPlanEngine (DAG & Dependency Management)", () => {
	let engine: TaskPlanEngine;
	const tempStorage = path.join(os.tmpdir(), `omsk-test-tasks-${Date.now()}.json`);

	beforeEach(() => {
		engine = new TaskPlanEngine(tempStorage);
	});

	it("adds, retrieves and manages tasks with priorities and dependencies", () => {
		const t1 = engine.addTask({
			id: "auth-db",
			title: "Criar schemas de banco de dados",
			priority: "high",
			status: "pending",
			dependencies: [],
			files: ["src/db/schema.ts"],
		});
		expect(t1.id).toBe("auth-db");
		expect(t1.status).toBe("pending");
		expect(engine.size).toBe(1);

		const t2 = engine.addTask({
			id: "auth-routes",
			title: "Endpoints de autenticacao",
			priority: "normal",
			status: "pending",
			dependencies: ["auth-db"],
			files: ["src/routes/auth.ts"],
		});
		expect(t2.dependencies).toEqual(["auth-db"]);
		expect(engine.size).toBe(2);
	});

	it("detects dependency readiness: t2 cannot start before t1 completes", () => {
		engine.addTask({ id: "t1", title: "Task 1", priority: "normal", status: "pending", dependencies: [] });
		engine.addTask({ id: "t2", title: "Task 2", priority: "normal", status: "pending", dependencies: ["t1"] });

		expect(engine.isTaskReady("t1")).toBe(true);
		expect(engine.isTaskReady("t2")).toBe(false);

		// Tentar iniciar t2 diretamente sem forçar deve falhar
		const updateResult = engine.updateTaskStatus("t2", "in_progress");
		expect(updateResult.success).toBe(false);
		expect(updateResult.reason).toContain("unresolved dependencies");

		// Completar t1
		engine.updateTaskStatus("t1", "completed");
		expect(engine.isTaskReady("t2")).toBe(true);

		// Agora t2 pode iniciar
		const updateResult2 = engine.updateTaskStatus("t2", "in_progress");
		expect(updateResult2.success).toBe(true);
		expect(engine.getTask("t2")?.status).toBe("in_progress");
	});

	it("computes topological execution order respecting prerequisites", () => {
		engine.addTask({ id: "deploy", title: "Deploy final", priority: "critical", status: "pending", dependencies: ["build", "test"] });
		engine.addTask({ id: "test", title: "Executar testes", priority: "high", status: "pending", dependencies: ["build"] });
		engine.addTask({ id: "build", title: "Compilar binarios", priority: "normal", status: "pending", dependencies: ["lint"] });
		engine.addTask({ id: "lint", title: "Verificar codigo", priority: "low", status: "pending", dependencies: [] });

		const order = engine.getTopologicalOrder();
		expect(order.indexOf("lint")).toBeLessThan(order.indexOf("build"));
		expect(order.indexOf("build")).toBeLessThan(order.indexOf("test"));
		expect(order.indexOf("test")).toBeLessThan(order.indexOf("deploy"));
	});

	it("detects circular dependency cycles and throws descriptive error", () => {
		engine.addTask({ id: "node-a", title: "A", priority: "normal", status: "pending", dependencies: ["node-b"] });
		engine.addTask({ id: "node-b", title: "B", priority: "normal", status: "pending", dependencies: ["node-c"] });
		engine.addTask({ id: "node-c", title: "C", priority: "normal", status: "pending", dependencies: ["node-a"] });

		const validation = engine.validateGraph();
		expect(validation.hasCycles).toBe(true);
		expect(() => engine.getTopologicalOrder()).toThrow("Dependency cycle detected");
	});

	it("plans selective execution (Option B) identifying missing dependencies", () => {
		engine.addTask({ id: "setup", title: "Setup", priority: "normal", status: "pending", dependencies: [] });
		engine.addTask({ id: "core", title: "Core", priority: "normal", status: "pending", dependencies: ["setup"] });
		engine.addTask({ id: "feature", title: "Feature", priority: "normal", status: "pending", dependencies: ["core"] });

		// Usuário selecionou apenas 'feature'
		const plan = engine.planSelectiveExecution(["feature"]);
		expect(plan.isSelfContained).toBe(false);
		expect(plan.missingPrerequisites.map(p => p.id)).toContain("core");
		expect(plan.missingPrerequisites.map(p => p.id)).toContain("setup");

		// Ordem gerada contém os pré-requisitos antes da feature
		expect(plan.executionOrder.indexOf("setup")).toBeLessThan(plan.executionOrder.indexOf("core"));
		expect(plan.executionOrder.indexOf("core")).toBeLessThan(plan.executionOrder.indexOf("feature"));
	});

	it("exports clean markdown and persists to storage", () => {
		engine.addTask({ id: "doc", title: "Escrever docs", priority: "normal", status: "pending", dependencies: [], files: ["README.md"] });
		const md = engine.exportToMarkdown("Roadmap");
		expect(md).toContain("# Roadmap");
		expect(md).toContain("`doc`");

		engine.saveToStorage();
		expect(fs.existsSync(tempStorage)).toBe(true);

		const restoredEngine = new TaskPlanEngine(tempStorage);
		const loaded = restoredEngine.loadFromStorage();
		expect(loaded).toBe(true);
		expect(restoredEngine.getTask("doc")?.title).toBe("Escrever docs");

		try {
			fs.unlinkSync(tempStorage);
		} catch {}
	});
});

describe("Oh My Shark — PlanApprovalFlow (Paths A, B, C)", () => {
	it("executes Option A (all tasks in topological order)", () => {
		const engine = new TaskPlanEngine();
		engine.addTask({ id: "a", title: "Passo A", priority: "normal", status: "pending", dependencies: [] });
		engine.addTask({ id: "b", title: "Passo B", priority: "normal", status: "pending", dependencies: ["a"] });

		const flow = new PlanApprovalFlow(engine);
		const decision = flow.executeAll();

		expect(decision.type).toBe("execute_all");
		expect(decision.selectedTaskIds).toEqual(["a", "b"]);
		// Passo A (primeiro executável) deve estar in_progress
		expect(engine.getTask("a")?.status).toBe("in_progress");
		expect(engine.getTask("b")?.status).toBe("pending");
	});

	it("executes Option B (selective tasks with auto-dependency inclusion)", () => {
		const engine = new TaskPlanEngine();
		engine.addTask({ id: "dep1", title: "Prereq 1", priority: "normal", status: "pending", dependencies: [] });
		engine.addTask({ id: "mainTask", title: "Target", priority: "high", status: "pending", dependencies: ["dep1"] });
		engine.addTask({ id: "unrelated", title: "Outro", priority: "low", status: "pending", dependencies: [] });

		const flow = new PlanApprovalFlow(engine);
		const { decision } = flow.selectTasks(["mainTask"], { autoIncludeDependencies: true });

		expect(decision.type).toBe("select_tasks");
		expect(decision.selectedTaskIds).toContain("mainTask");
		expect(decision.selectedTaskIds).toContain("dep1");
		expect(decision.autoIncludedDependencies).toContain("dep1");

		// unrelated deve ser marcado como abandoned
		expect(engine.getTask("unrelated")?.status).toBe("abandoned");
	});

	it("executes Option C (reject plan gracefully)", () => {
		const engine = new TaskPlanEngine();
		engine.addTask({ id: "x", title: "X", priority: "normal", status: "pending", dependencies: [] });

		const flow = new PlanApprovalFlow(engine);
		const decision = flow.rejectPlan("Quero mudar a abordagem para SQLite");

		expect(decision.type).toBe("reject_plan");
		expect(decision.feedback).toBe("Quero mudar a abordagem para SQLite");
		expect(decision.selectedTaskIds.length).toBe(0);
	});

	it("extracts tasks and dependencies from markdown", () => {
		const md = `
# Fase 1: Arquitetura
- [ ] Configurar TypeScript \`tsconfig.json\`
- [ ] Criar routers [requer: task-1]
- [x] Inicializar repo
`;
		const engine = new TaskPlanEngine();
		const flow = new PlanApprovalFlow(engine);
		const tasks = flow.extractTasksFromMarkdown(md);

		expect(tasks.length).toBe(3);
		expect(tasks[0]?.title).toContain("Configurar TypeScript");
		expect(tasks[1]?.dependencies).toContain("task-1");
		expect(tasks[2]?.status).toBe("completed");
	});
});

describe("Oh My Shark — Context & Token Optimizer", () => {
	it("FileReadCache caches unmodified files and invalidates correctly", () => {
		const cache = new FileReadCache();
		const tempFile = path.join(os.tmpdir(), `omsk-cache-test-${Date.now()}.txt`);
		fs.writeFileSync(tempFile, "Hello Shark Optimization", "utf-8");

		try {
			// Leitura 1: miss
			const content1 = cache.readTextSync(tempFile);
			expect(content1).toBe("Hello Shark Optimization");
			expect(cache.hits).toBe(0);
			expect(cache.misses).toBe(1);

			// Leitura 2: hit
			const content2 = cache.readTextSync(tempFile);
			expect(content2).toBe("Hello Shark Optimization");
			expect(cache.hits).toBe(1);
			expect(cache.bytesSaved).toBeGreaterThan(0);

			// Modificar arquivo -> invalida automaticamente por mtime/size
			fs.appendFileSync(tempFile, " - Updated content with extra length");
			const content3 = cache.readTextSync(tempFile);
			expect(content3).toContain("Updated content");
			expect(cache.misses).toBe(2);
		} finally {
			try {
				fs.unlinkSync(tempFile);
			} catch {}
		}
	});

	it("ToolResultCompactor compacts massive outputs and tracks saved tokens", () => {
		const compactor = new ToolResultCompactor({ maxRetainedChars: 200, maxRetainedLines: 10 });
		const smallText = "Short output 1\nShort output 2";
		const res1 = compactor.compactOutput("grep", smallText);
		expect(res1.wasCompacted).toBe(false);
		expect(res1.content).toBe(smallText);

		// Texto gigante
		const longLines = Array.from({ length: 100 }, (_, i) => `Log entry number ${i}: detailed operation message`).join("\n");
		const res2 = compactor.compactOutput("bash", longLines);
		expect(res2.wasCompacted).toBe(true);
		expect(res2.content).toContain("Context Optimizer");
		expect(res2.content).toContain("linhas compactadas");
		expect(compactor.tokensSaved).toBeGreaterThan(0);
	});

	it("ContextOptimizer collects telemetry and formats summary", () => {
		const optimizer = new ContextOptimizer();
		const summary = optimizer.formatMetricsSummary();
		expect(summary).toContain("[OMSK Context Optimizer]");
		expect(summary).toContain("Cache Hit Rate:");
		expect(summary).toContain("Tokens Economizados:");
	});
});
