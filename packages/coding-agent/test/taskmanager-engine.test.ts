import { describe, expect, it } from "bun:test";
import { startTaskManagerServer } from "../src/taskmanager/server";
import { launchTaskManagerGui } from "../src/taskmanager/launcher";

describe("TaskManager Native Engine & Server", () => {
	it("starts HTTP server, serves HTML, and handles REST endpoints", async () => {
		const dummyHtml = "<!DOCTYPE html><html><head><title>Test</title></head><body><h1>Kanban</h1></body></html>";
		const { port, close } = await startTaskManagerServer(dummyHtml);
		expect(port).toBeGreaterThan(0);

		try {
			// 1. GET / -> Deve retornar o HTML
			const resHtml = await fetch(`http://127.0.0.1:${port}/`);
			expect(resHtml.status).toBe(200);
			const textHtml = await resHtml.text();
			expect(textHtml).toContain("Kanban");

			// 2. GET /api/tasks -> Deve retornar lista de tarefas (JSON)
			const resTasks = await fetch(`http://127.0.0.1:${port}/api/tasks`);
			expect(resTasks.status).toBe(200);
			const tasks = await resTasks.json();
			expect(Array.isArray(tasks)).toBe(true);

			// 3. POST /api/opacity -> Deve aceitar controle de opacidade
			const resOpacity = await fetch(`http://127.0.0.1:${port}/api/opacity`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ opacity: 0.85 }),
			});
			expect(resOpacity.status).toBe(200);
			const jsonOpacity = await resOpacity.json();
			expect(typeof jsonOpacity === "object" && jsonOpacity !== null && "ok" in jsonOpacity && jsonOpacity.ok === true).toBe(true);
		} finally {
			close();
		}
	});

	it("exports launchTaskManagerGui with proper function signature", () => {
		expect(typeof launchTaskManagerGui).toBe("function");
	});
});
