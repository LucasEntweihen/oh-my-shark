/**
 * Oh My Shark — Task Plan Engine
 * Motor de gerenciamento de tarefas avançado, grafo de dependências (DAG),
 * ordenação topológica e validação de prontidão de execução.
 *
 * Implementado sob rigor de Code Architect: tipagem exata, zero-overhead, sem any,
 * usando APIs nativas do Bun e node:fs/node:path.
 */

import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";

export type TaskStatus = "pending" | "in_progress" | "blocked" | "completed" | "abandoned";
export type TaskPriority = "low" | "normal" | "high" | "critical";

export interface ManagedTask {
	/** Identificador único e estável da tarefa (ex: "task-1", "core-auth") */
	id: string;
	/** Título conciso da tarefa */
	title: string;
	/** Descrição detalhada do trabalho */
	description?: string;
	/** Objetivo mensurável e critérios de aceitação */
	objective?: string;
	/** Critérios específicos de conclusão */
	completionCriteria?: string[];
	/** Estado atual do ciclo de vida da tarefa */
	status: TaskStatus;
	/** Nível de prioridade */
	priority: TaskPriority;
	/** IDs de tarefas que devem ser concluídas antes desta iniciar */
	dependencies: string[];
	/** Subtarefas menores */
	subtasks?: string[];
	/** Arquivos ou componentes envolvidos */
	files?: string[];
	/** Decisões arquiteturais ou notas registradas */
	notes?: string[];
	/** Evidências verificáveis de conclusão (testes, logs, commits) */
	evidence?: string[];
	/** Resultados concretos produzidos */
	results?: string[];
	/** Motivo do bloqueio caso status === "blocked" */
	blocker?: string;
	/** Número de tentativas de execução */
	attempts?: number;
	/** Último erro encontrado durante a execução */
	lastError?: string;
	/** Fase de agrupamento da tarefa (ex: "Foundation", "Implementation") */
	phase?: string;
	/** Timestamp de criação */
	createdAt: number;
	/** Timestamp da última atualização */
	updatedAt: number;
}

export interface TaskValidationResult {
	valid: boolean;
	hasCycles: boolean;
	cyclePath?: string[];
	missingDependencies: { taskId: string; missingId: string }[];
	unreachableTasks: string[];
}

export interface SelectivePlanResult {
	/** Tarefas selecionadas para execução */
	tasksToExecute: ManagedTask[];
	/** Dependências pré-requisito que faltavam na seleção original e foram identificadas */
	missingPrerequisites: ManagedTask[];
	/** Ordem topológica de execução recomendada */
	executionOrder: string[];
	/** Se a seleção original é auto-suficiente sem dependências externas pendentes */
	isSelfContained: boolean;
}

/**
 * TaskPlanEngine gerencia o grafo de dependências entre tarefas, garante
 * execução determinística e persistência em ~/.omsk/tarefas.json.
 */
export class TaskPlanEngine {
	readonly #tasks = new Map<string, ManagedTask>();
	readonly #storagePath: string;

	constructor(customStoragePath?: string) {
		if (customStoragePath) {
			this.#storagePath = customStoragePath;
		} else {
			const configDir = path.join(os.homedir(), ".omsk");
			try {
				if (!fs.existsSync(configDir)) {
					fs.mkdirSync(configDir, { recursive: true });
				}
			} catch {
				// Falha silenciosa se não puder criar diretório no host
			}
			this.#storagePath = path.join(configDir, "tarefas.json");
		}
	}

	get storagePath(): string {
		return this.#storagePath;
	}

	/** Quantidade de tarefas no motor */
	get size(): number {
		return this.#tasks.size;
	}

	/** Adiciona ou atualiza uma tarefa no motor */
	addTask(task: Omit<ManagedTask, "createdAt" | "updatedAt"> & { createdAt?: number; updatedAt?: number }): ManagedTask {
		const now = Date.now();
		const normalizedId = task.id.trim();
		if (!normalizedId) {
			throw new Error("TaskPlanEngine: Task ID cannot be empty");
		}

		const existing = this.#tasks.get(normalizedId);
		const managed: ManagedTask = {
			...task,
			id: normalizedId,
			dependencies: Array.from(new Set(task.dependencies || [])).filter(dep => dep !== normalizedId),
			createdAt: existing ? existing.createdAt : (task.createdAt ?? now),
			updatedAt: now,
		};

		this.#tasks.set(normalizedId, managed);
		return managed;
	}

	/** Obtém uma tarefa pelo ID */
	getTask(id: string): ManagedTask | undefined {
		return this.#tasks.get(id);
	}

	/** Retorna todas as tarefas registradas */
	getAllTasks(): ManagedTask[] {
		return Array.from(this.#tasks.values());
	}

	/** Remove uma tarefa pelo ID e limpa dependências órfãs */
	removeTask(id: string): boolean {
		const removed = this.#tasks.delete(id);
		if (removed) {
			for (const task of this.#tasks.values()) {
				if (task.dependencies.includes(id)) {
					task.dependencies = task.dependencies.filter(d => d !== id);
					task.updatedAt = Date.now();
				}
			}
		}
		return removed;
	}

	/** Limpa todas as tarefas em memória */
	clear(): void {
		this.#tasks.clear();
	}

	/**
	 * Verifica se uma tarefa está pronta para execução.
	 * Uma tarefa está PRONTA apenas se:
	 * 1. Seu status for "pending"
	 * 2. TODAS as suas dependências possuírem status "completed"
	 */
	isTaskReady(id: string): boolean {
		const task = this.#tasks.get(id);
		if (!task) return false;
		if (task.status !== "pending") return false;

		for (const depId of task.dependencies) {
			const dep = this.#tasks.get(depId);
			if (!dep || dep.status !== "completed") {
				return false;
			}
		}
		return true;
	}

	/**
	 * Atualiza o status de uma tarefa respeitando as regras de transição:
	 * - Não permite transição para "in_progress" se houver dependências incompletas,
	 *   a menos que forceUpdate seja explicitamente verdadeiro.
	 */
	updateTaskStatus(
		id: string,
		status: TaskStatus,
		options?: { blocker?: string; force?: boolean; evidence?: string[]; result?: string; error?: string },
	): { success: boolean; reason?: string; task?: ManagedTask } {
		const task = this.#tasks.get(id);
		if (!task) {
			return { success: false, reason: `Task with ID "${id}" not found` };
		}

		if (status === "in_progress" && !options?.force) {
			const unresolved = this.getUnresolvedDependencies(id);
			if (unresolved.length > 0) {
				return {
					success: false,
					reason: `Cannot start task "${id}": unresolved dependencies [${unresolved.map(t => t.id).join(", ")}]`,
				};
			}
		}

		task.status = status;
		task.updatedAt = Date.now();

		if (options?.blocker !== undefined) {
			task.blocker = options.blocker;
		} else if (status !== "blocked") {
			task.blocker = undefined;
		}

		if (options?.evidence) {
			task.evidence = [...(task.evidence || []), ...options.evidence];
		}

		if (options?.result) {
			task.results = [...(task.results || []), options.result];
		}

		if (options?.error) {
			task.lastError = options.error;
			task.attempts = (task.attempts || 0) + 1;
		}

		return { success: true, task };
	}

	/**
	 * Retorna a lista de tarefas dependências que ainda não foram concluídas
	 */
	getUnresolvedDependencies(id: string): ManagedTask[] {
		const task = this.#tasks.get(id);
		if (!task) return [];

		const unresolved: ManagedTask[] = [];
		for (const depId of task.dependencies) {
			const dep = this.#tasks.get(depId);
			if (!dep || dep.status !== "completed") {
				if (dep) {
					unresolved.push(dep);
				} else {
					// Dependência desconhecida também conta como não resolvida
					unresolved.push({
						id: depId,
						title: `[Missing prerequisite: ${depId}]`,
						status: "pending",
						priority: "normal",
						dependencies: [],
						createdAt: 0,
						updatedAt: 0,
					});
				}
			}
		}
		return unresolved;
	}

	/**
	 * Valida o grafo de dependências completo:
	 * - Detecta ciclos (loops direcionados)
	 * - Identifica dependências ausentes
	 */
	validateGraph(): TaskValidationResult {
		const missingDependencies: { taskId: string; missingId: string }[] = [];
		const adj = new Map<string, string[]>();

		for (const task of this.#tasks.values()) {
			adj.set(task.id, [...task.dependencies]);
			for (const depId of task.dependencies) {
				if (!this.#tasks.has(depId)) {
					missingDependencies.push({ taskId: task.id, missingId: depId });
				}
			}
		}

		// Detecção de ciclo com DFS
		const visited = new Map<string, number>(); // 0=unvisited, 1=visiting, 2=visited
		let hasCycles = false;
		let cyclePath: string[] | undefined;
		const stack: string[] = [];

		const dfs = (node: string): boolean => {
			visited.set(node, 1);
			stack.push(node);

			const neighbors = adj.get(node) || [];
			for (const neighbor of neighbors) {
				const state = visited.get(neighbor) || 0;
				if (state === 1) {
					// Ciclo encontrado!
					const cycleStartIndex = stack.indexOf(neighbor);
					cyclePath = stack.slice(cycleStartIndex).concat(neighbor);
					return true;
				}
				if (state === 0) {
					if (dfs(neighbor)) return true;
				}
			}

			stack.pop();
			visited.set(node, 2);
			return false;
		};

		for (const taskId of this.#tasks.keys()) {
			if ((visited.get(taskId) || 0) === 0) {
				if (dfs(taskId)) {
					hasCycles = true;
					break;
				}
			}
		}

		return {
			valid: !hasCycles && missingDependencies.length === 0,
			hasCycles,
			cyclePath,
			missingDependencies,
			unreachableTasks: [],
		};
	}

	/**
	 * Retorna a ordem topológica de execução das tarefas usando o algoritmo de Kahn.
	 * Tarefas sem dependências aparecem primeiro.
	 * Se houver ciclo, lança erro explicativo.
	 */
	getTopologicalOrder(): string[] {
		const validation = this.validateGraph();
		if (validation.hasCycles) {
			throw new Error(
				`TaskPlanEngine: Dependency cycle detected in task graph: ${validation.cyclePath?.join(" -> ")}`,
			);
		}

		// In-degree computation: in-degree(u) = quantas tarefas 'u' PRECISA antes de si mesma
		const inDegree = new Map<string, number>();
		const dependents = new Map<string, string[]>(); // dep -> tasks that depend on dep

		for (const task of this.#tasks.values()) {
			inDegree.set(task.id, task.dependencies.length);
			for (const dep of task.dependencies) {
				const list = dependents.get(dep) || [];
				list.push(task.id);
				dependents.set(dep, list);
			}
		}

		// Fila com todas as tarefas que têm in-degree 0 (sem dependências)
		const queue: string[] = [];
		for (const [id, deg] of inDegree.entries()) {
			if (deg === 0) {
				queue.push(id);
			}
		}

		// Ordenar a fila inicial por prioridade para desempate previsível
		this.#sortTaskIdsByPriority(queue);

		const result: string[] = [];
		while (queue.length > 0) {
			const current = queue.shift()!;
			result.push(current);

			const affected = dependents.get(current) || [];
			for (const next of affected) {
				const currentDeg = inDegree.get(next) || 0;
				const newDeg = Math.max(0, currentDeg - 1);
				inDegree.set(next, newDeg);
				if (newDeg === 0) {
					queue.push(next);
				}
			}
			this.#sortTaskIdsByPriority(queue);
		}

		// Adicionar eventuais nós desconexos
		for (const id of this.#tasks.keys()) {
			if (!result.includes(id)) {
				result.push(id);
			}
		}

		return result;
	}

	#sortTaskIdsByPriority(ids: string[]): void {
		const priorityWeight: Record<TaskPriority, number> = {
			critical: 4,
			high: 3,
			normal: 2,
			low: 1,
		};

		ids.sort((a, b) => {
			const pA = priorityWeight[this.#tasks.get(a)?.priority || "normal"];
			const pB = priorityWeight[this.#tasks.get(b)?.priority || "normal"];
			return pB - pA;
		});
	}

	/**
	 * Planejamento Seletivo (Opção B):
	 * Dado um subconjunto de IDs selecionados pelo usuário, analisa o fechamento de dependências.
	 * Identifica quais dependências faltam e produz o plano determinístico.
	 */
	planSelectiveExecution(selectedTaskIds: string[]): SelectivePlanResult {
		const selectedSet = new Set(selectedTaskIds);
		const tasksToExecute: ManagedTask[] = [];
		const missingPrerequisites: ManagedTask[] = [];
		const missingPrereqIds = new Set<string>();

		// Coletar tarefas selecionadas válidas
		for (const id of selectedTaskIds) {
			const task = this.#tasks.get(id);
			if (task) {
				tasksToExecute.push(task);
			}
		}

		// Mapear todas as dependências transitivas
		const visited = new Set<string>();
		const findDependencies = (taskId: string) => {
			if (visited.has(taskId)) return;
			visited.add(taskId);

			const t = this.#tasks.get(taskId);
			if (!t) return;

			for (const depId of t.dependencies) {
				if (!selectedSet.has(depId)) {
					const depTask = this.#tasks.get(depId);
					if (depTask && depTask.status !== "completed") {
						if (!missingPrereqIds.has(depId)) {
							missingPrereqIds.add(depId);
							missingPrerequisites.push(depTask);
						}
					}
				}
				findDependencies(depId);
			}
		};

		for (const id of selectedTaskIds) {
			findDependencies(id);
		}

		// Calcular ordem topológica restrita aos selecionados + pré-requisitos faltantes
		const allRelevantIds = new Set([...selectedTaskIds, ...missingPrereqIds]);
		let fullOrder: string[] = [];
		try {
			fullOrder = this.getTopologicalOrder().filter(id => allRelevantIds.has(id));
		} catch {
			fullOrder = Array.from(allRelevantIds);
		}

		return {
			tasksToExecute,
			missingPrerequisites,
			executionOrder: fullOrder,
			isSelfContained: missingPrerequisites.length === 0,
		};
	}

	/**
	 * Encontra a próxima tarefa recomendada a ser executada no plano.
	 * Retorna a primeira tarefa com status 'in_progress', ou a primeira tarefa
	 * com status 'pending' cujas dependências estejam 100% resolvidas.
	 */
	getNextExecutableTask(): ManagedTask | undefined {
		const order = this.getTopologicalOrder();

		// 1. Já existe tarefa em progresso?
		for (const id of order) {
			const task = this.#tasks.get(id);
			if (task && task.status === "in_progress") {
				return task;
			}
		}

		// 2. Primeira tarefa pendente pronta (com dependências satisfeitas)
		for (const id of order) {
			const task = this.#tasks.get(id);
			if (task && task.status === "pending" && this.isTaskReady(id)) {
				return task;
			}
		}

		return undefined;
	}

	/**
	 * Persiste todas as tarefas gerenciadas em formato JSON no caminho de armazenamento.
	 */
	saveToStorage(): void {
		try {
			const dir = path.dirname(this.#storagePath);
			if (!fs.existsSync(dir)) {
				fs.mkdirSync(dir, { recursive: true });
			}
			const data = Array.from(this.#tasks.values());
			fs.writeFileSync(this.#storagePath, JSON.stringify(data, null, 2), "utf-8");
		} catch (err) {
			console.error(`TaskPlanEngine: Failed to save tasks to ${this.#storagePath}:`, err);
		}
	}

	/**
	 * Carrega tarefas previamente salvas do arquivo JSON.
	 */
	loadFromStorage(): boolean {
		try {
			if (!fs.existsSync(this.#storagePath)) {
				return false;
			}
			const content = fs.readFileSync(this.#storagePath, "utf-8");
			const parsed = JSON.parse(content);
			if (!Array.isArray(parsed)) return false;

			this.#tasks.clear();
			for (const item of parsed) {
				if (typeof item === "object" && item !== null && typeof item.id === "string" && typeof item.title === "string") {
					this.addTask(item as ManagedTask);
				}
			}
			return true;
		} catch (err) {
			console.error(`TaskPlanEngine: Failed to load tasks from ${this.#storagePath}:`, err);
			return false;
		}
	}

	/**
	 * Exporta o plano para Markdown estruturado legível por humanos e modelos.
	 */
	exportToMarkdown(title = "Plano de Execução"): string {
		const lines: string[] = [`# ${title}\n`];
		const order = this.getTopologicalOrder();

		lines.push(`Total de tarefas: ${this.#tasks.size}\n`);
		lines.push("| ID | Título | Status | Prioridade | Dependências | Arquivos |");
		lines.push("|---|---|---|---|---|---|");

		for (const id of order) {
			const task = this.#tasks.get(id);
			if (!task) continue;
			const deps = task.dependencies.length > 0 ? task.dependencies.join(", ") : "-";
			const files = task.files && task.files.length > 0 ? task.files.join(", ") : "-";
			lines.push(`| \`${task.id}\` | ${task.title} | **${task.status}** | ${task.priority} | ${deps} | ${files} |`);
		}

		lines.push("\n## Detalhes das Tarefas\n");
		for (const id of order) {
			const task = this.#tasks.get(id);
			if (!task) continue;
			lines.push(`### \`${task.id}\`: ${task.title}`);
			if (task.description) lines.push(`- **Descrição:** ${task.description}`);
			if (task.objective) lines.push(`- **Objetivo:** ${task.objective}`);
			if (task.completionCriteria && task.completionCriteria.length > 0) {
				lines.push("- **Critérios de Aceitação:**");
				for (const crit of task.completionCriteria) {
					lines.push(`  - [ ] ${crit}`);
				}
			}
			if (task.evidence && task.evidence.length > 0) {
				lines.push("- **Evidências Registradas:**");
				for (const ev of task.evidence) {
					lines.push(`  - ✓ ${ev}`);
				}
			}
			if (task.blocker) lines.push(`- **Bloqueio Atual:** ⚠️ ${task.blocker}`);
			lines.push("");
		}

		return lines.join("\n");
	}
}
