import * as http from "node:http";
import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";

// Arquivo de persistência das tarefas
const DIR_CONFIG = path.join(os.homedir(), ".omsk");
if (!fs.existsSync(DIR_CONFIG)) {
	try {
		fs.mkdirSync(DIR_CONFIG, { recursive: true });
	} catch {}
}
const ARQUIVO_TAREFAS = path.join(DIR_CONFIG, "tarefas.json");

export interface KanbanTask {
	id: number;
	title: string;
	cat: "A" | "B" | "C" | "D";
	status: "DRAFT" | "IN_PROGRESS" | "EDITING" | "DONE";
	desc?: string;
}

function loadTasks(): KanbanTask[] {
	if (fs.existsSync(ARQUIVO_TAREFAS)) {
		try {
			const data = fs.readFileSync(ARQUIVO_TAREFAS, "utf-8");
			return JSON.parse(data) as KanbanTask[];
		} catch {}
	}
	return [
		{ id: 1, title: "Model Routes & Fast Inference", cat: "A", status: "DONE", desc: "Otimização de pipelines de raciocínio profundo." },
		{ id: 2, title: "Subagent Swarm Dispatch", cat: "B", status: "IN_PROGRESS", desc: "Comunicação peer-to-peer via Hub IRC." },
		{ id: 3, title: "Security Invariant Auditor", cat: "C", status: "DRAFT", desc: "Prevenção rigorosa de injeção de comandos e sandbox." },
		{ id: 4, title: "Kernel Workpool Multi-thread", cat: "D", status: "EDITING", desc: "Pool de execução concorrente sem alocações inúteis." },
	];
}

function saveTasks(tasks: KanbanTask[]): void {
	try {
		fs.writeFileSync(ARQUIVO_TAREFAS, JSON.stringify(tasks, null, 2), "utf-8");
	} catch (err) {
		console.error("Failed to save tasks:", err);
	}
}

/**
 * Inicia o servidor HTTP ultra-leve nativo para servir o TaskManager Kanban Board
 */
export async function startTaskManagerServer(htmlContent: string): Promise<{ port: number; close: () => void }> {
	const { promise, resolve, reject } = Promise.withResolvers<{ port: number; close: () => void }>();

	const server = http.createServer((req, res) => {
		const parsedUrl = new URL(req.url ?? "/", "http://127.0.0.1");
		const pathname = parsedUrl.pathname;

		// Servir o painel Kanban Board
		if (pathname === "/" || pathname === "/index.html") {
			res.writeHead(200, {
				"Content-Type": "text/html; charset=utf-8",
				"Cache-Control": "no-cache",
			});
			res.end(htmlContent);
			return;
		}

		// Endpoint REST: Obter / Salvar tarefas
		if (pathname === "/api/tasks") {
			if (req.method === "GET") {
				const tasks = loadTasks();
				res.writeHead(200, { "Content-Type": "application/json" });
				res.end(JSON.stringify(tasks));
				return;
			}
			if (req.method === "POST") {
				let body = "";
				req.on("data", chunk => { body += chunk; });
				req.on("end", () => {
					try {
						const tasks = JSON.parse(body) as KanbanTask[];
						saveTasks(tasks);
						res.writeHead(200, { "Content-Type": "application/json" });
						res.end(JSON.stringify({ ok: true }));
					} catch {
						res.writeHead(400, { "Content-Type": "application/json" });
						res.end(JSON.stringify({ ok: false, error: "Invalid JSON" }));
					}
				});
				return;
			}
		}

		// Endpoint para controle de opacidade
		if (pathname === "/api/opacity" && req.method === "POST") {
			let body = "";
			req.on("data", chunk => { body += chunk; });
			req.on("end", () => {
				res.writeHead(200, { "Content-Type": "application/json" });
				res.end(JSON.stringify({ ok: true }));
			});
			return;
		}

		res.writeHead(404, { "Content-Type": "text/plain" });
		res.end("Not Found");
	});

	server.listen(0, "127.0.0.1", () => {
		const address = server.address();
		if (address && typeof address === "object") {
			resolve({
				port: address.port,
				close: () => server.close(),
			});
		} else {
			reject(new Error("Failed to get server port"));
		}
	});

	server.on("error", reject);
	return promise;
}

// Execução independente via linha de comando se invocado diretamente
if (import.meta.main) {
	const htmlPath = path.join(import.meta.dir, "index.html");
	const html = fs.readFileSync(htmlPath, "utf-8");
	startTaskManagerServer(html).then(({ port }) => {
		console.log(`TASKMANAGER_SERVER_PORT:${port}`);
	}).catch(err => {
		console.error("Failed to start taskmanager server:", err);
		process.exit(1);
	});
}
