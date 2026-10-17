/**
 * Oh My Shark — Plan Approval Flow
 * Fluxo de leitura do plano e autorização estruturada para execução de tarefas.
 * Implementa rigorosamente os 3 caminhos de decisão do usuário:
 * - Opção A: Executar todas as tarefas
 * - Opção B: Selecionar tarefas específicas (com validação de dependências)
 * - Opção C: Ignorar o plano (continua conversa sem descartar histórico)
 */

import type { ManagedTask, SelectivePlanResult, TaskPlanEngine } from "./plan-engine";

export type PlanApprovalDecisionType = "execute_all" | "select_tasks" | "reject_plan";

export interface PlanApprovalDecision {
	type: PlanApprovalDecisionType;
	/** Lista de IDs de tarefas autorizadas para execução (para execute_all ou select_tasks) */
	selectedTaskIds: string[];
	/** Se dependências faltantes foram incluídas automaticamente na Opção B */
	autoIncludedDependencies?: string[];
	/** Feedback ou instrução fornecida pelo usuário na Opção C ou B */
	feedback?: string;
	/** Timestamp da decisão */
	timestamp: number;
}

export interface PlanOptionChoice {
	label: string;
	description: string;
	type: PlanApprovalDecisionType;
	recommended?: boolean;
}

export class PlanApprovalFlow {
	readonly #engine: TaskPlanEngine;

	constructor(engine: TaskPlanEngine) {
		this.#engine = engine;
	}

	/**
	 * Prepara a apresentação estruturada das opções do plano para a interface interativa (ask).
	 */
	buildApprovalQuestion(planTitle = "Plano de Trabalho"): {
		id: string;
		question: string;
		options: { label: string; description: string; preview?: string }[];
		recommended: number;
	} {
		const allTasks = this.#engine.getAllTasks();
		const order = this.#engine.getTopologicalOrder();

		let previewText = `Plano: ${planTitle} (${allTasks.length} tarefas detectadas)\n`;
		for (let i = 0; i < order.length; i++) {
			const task = this.#engine.getTask(order[i]!);
			if (!task) continue;
			const depText = task.dependencies.length > 0 ? ` [requer: ${task.dependencies.join(", ")}]` : "";
			previewText += `${i + 1}. [${task.id}] ${task.title}${depText}\n`;
		}

		return {
			id: "plan_approval_choice",
			question: `Como deseja proceder com o plano "${planTitle}"?`,
			options: [
				{
					label: "Opção A: Executar todas as tarefas",
					description: "Aprova e executa todas as tarefas na ordem topológica ideal de dependências.",
					preview: previewText,
				},
				{
					label: "Opção B: Selecionar tarefas específicas",
					description: "Escolha um subconjunto de tarefas. O sistema validará dependências e avisará se pré-requisitos forem necessários.",
				},
				{
					label: "Opção C: Ignorar o plano",
					description: "Rejeita o plano sem perder o histórico de conversa. Permite enviar novas instruções.",
				},
			],
			recommended: 0,
		};
	}

	/**
	 * Processa a Opção A: Executar todas as tarefas.
	 */
	executeAll(): PlanApprovalDecision {
		const order = this.#engine.getTopologicalOrder();
		const allTasks = this.#engine.getAllTasks();

		// Assegurar que todas as tarefas fiquem com status pending (ou completed se já estavam)
		for (const task of allTasks) {
			if (task.status !== "completed") {
				this.#engine.updateTaskStatus(task.id, "pending", { force: true });
			}
		}

		// A primeira tarefa da ordem topológica se torna a candidata ativa
		const first = this.#engine.getNextExecutableTask();
		if (first) {
			this.#engine.updateTaskStatus(first.id, "in_progress", { force: true });
		}

		this.#engine.saveToStorage();

		return {
			type: "execute_all",
			selectedTaskIds: order,
			timestamp: Date.now(),
		};
	}

	/**
	 * Processa a Opção B: Selecionar tarefas específicas.
	 * Se autoIncludeDependencies for true, dependências não selecionadas que estejam pendentes
	 * são incluídas automaticamente na lista de execução para garantir integridade.
	 */
	selectTasks(
		selectedTaskIds: string[],
		options?: { autoIncludeDependencies?: boolean },
	): {
		decision: PlanApprovalDecision;
		planResult: SelectivePlanResult;
	} {
		const selectiveResult = this.#engine.planSelectiveExecution(selectedTaskIds);
		const autoInclude = options?.autoIncludeDependencies ?? true;

		let finalTaskIds = [...selectedTaskIds];
		const autoIncluded: string[] = [];

		if (autoInclude && !selectiveResult.isSelfContained) {
			for (const missing of selectiveResult.missingPrerequisites) {
				if (!finalTaskIds.includes(missing.id)) {
					finalTaskIds.push(missing.id);
					autoIncluded.push(missing.id);
				}
			}
		}

		// Atualizar status: apenas as tarefas aprovadas para execução permanecem ativas
		const approvedSet = new Set(finalTaskIds);
		const allTasks = this.#engine.getAllTasks();

		for (const task of allTasks) {
			if (approvedSet.has(task.id)) {
				if (task.status !== "completed") {
					this.#engine.updateTaskStatus(task.id, "pending", { force: true });
				}
			} else {
				// Tarefas não selecionadas são marcadas como abandoned nesta rodada de execução
				if (task.status !== "completed") {
					this.#engine.updateTaskStatus(task.id, "abandoned", {
						force: true,
						blocker: "Não selecionada na execução seletiva de plano",
					});
				}
			}
		}

		// Iniciar a primeira tarefa da ordem topológica aprovada
		const first = this.#engine.getNextExecutableTask();
		if (first) {
			this.#engine.updateTaskStatus(first.id, "in_progress", { force: true });
		}

		this.#engine.saveToStorage();

		return {
			decision: {
				type: "select_tasks",
				selectedTaskIds: finalTaskIds,
				autoIncludedDependencies: autoIncluded.length > 0 ? autoIncluded : undefined,
				timestamp: Date.now(),
			},
			planResult: selectiveResult,
		};
	}

	/**
	 * Processa a Opção C: Ignorar o plano.
	 * Não descarta histórico nem remove dados silenciosamente.
	 */
	rejectPlan(feedback?: string): PlanApprovalDecision {
		return {
			type: "reject_plan",
			selectedTaskIds: [],
			feedback,
			timestamp: Date.now(),
		};
	}

	/**
	 * Extrai tarefas de um texto markdown de plano (como PLAN.md) com heurística estruturada.
	 */
	extractTasksFromMarkdown(markdownContent: string): ManagedTask[] {
		const tasks: ManagedTask[] = [];
		const lines = markdownContent.split(/\r?\n/);
		let currentPhase = "Geral";
		let taskCounter = 1;

		const taskPattern = /^(?:[-*+]|\d+[.)])\s+(?:\[([ xX])\]\s+)?(.+)$/;
		const depPattern = /\[(?:depende de|requer|dep|requires|needs):\s*([^\]]+)\]/i;
		const filePattern = /`([^`]+)`/g;

		for (const line of lines) {
			const trimmed = line.trim();
			if (trimmed.startsWith("# ") || trimmed.startsWith("## ")) {
				currentPhase = trimmed.replace(/^#+\s*/, "").trim();
				continue;
			}

			const match = trimmed.match(taskPattern);
			if (match) {
				const isChecked = match[1]?.toLowerCase() === "x";
				let taskTitle = match[2]?.trim() || "";

				// Extrair dependências marcadas explicitamente no texto da tarefa
				const depMatch = taskTitle.match(depPattern);
				const dependencies: string[] = [];
				if (depMatch && depMatch[1]) {
					const depNames = depMatch[1].split(/[,;]/).map(d => d.trim()).filter(Boolean);
					dependencies.push(...depNames);
					taskTitle = taskTitle.replace(depPattern, "").trim();
				}

				// Extrair referências a arquivos entre backticks
				const files: string[] = [];
				let fileMatch: RegExpExecArray | null;
				while ((fileMatch = filePattern.exec(taskTitle)) !== null) {
					const possiblePath = fileMatch[1];
					if (possiblePath && (possiblePath.includes(".") || possiblePath.includes("/"))) {
						files.push(possiblePath);
					}
				}

				const taskId = `task-${taskCounter++}`;
				const managed: ManagedTask = {
					id: taskId,
					title: taskTitle,
					status: isChecked ? "completed" : "pending",
					priority: "normal",
					dependencies,
					files: files.length > 0 ? files : undefined,
					phase: currentPhase,
					createdAt: Date.now(),
					updatedAt: Date.now(),
				};

				tasks.push(managed);
				this.#engine.addTask(managed);
			}
		}

		return tasks;
	}
}
