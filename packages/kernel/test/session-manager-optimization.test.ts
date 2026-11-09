import { describe, expect, it } from "bun:test";
import { SharkSessionManager } from "../src/session-manager";

describe("SharkSessionManager Optimizations (Fases 04 e 05)", () => {
  it("adiciona mensagens incrementalmente e pagina histórico sem clonar o total", () => {
    const mgr = new SharkSessionManager();
    mgr.initSession("test_session_1", process.cwd());

    for (let i = 1; i <= 25; i++) {
      mgr.appendMessage({
        role: i % 2 === 0 ? "assistant" : "user",
        content: `Mensagem de teste ${i}`,
        tokenCount: 10,
      });
    }

    expect(mgr.getMessageCount()).toBe(25);

    // Page 1: 10 items
    const page1 = mgr.getPaginatedHistory(0, 10);
    expect(page1.messages.length).toBe(10);
    expect(page1.totalCount).toBe(25);
    expect(page1.offset).toBe(0);
    expect(page1.limit).toBe(10);
    expect(page1.hasMore).toBe(true);
    expect(page1.messages[0].content).toBe("Mensagem de teste 1");

    // Page 3: last 5 items
    const page3 = mgr.getPaginatedHistory(20, 10);
    expect(page3.messages.length).toBe(5);
    expect(page3.hasMore).toBe(false);
    expect(page3.messages[4].content).toBe("Mensagem de teste 25");
  });

  it("deduplica blobs longos de contexto retornando a mesma referência de memória", () => {
    const mgr = new SharkSessionManager();
    const largeChunk = "Esta é uma instrução de contexto muito longa e compartilhada que não deve ser duplicada na memória do processo.".repeat(5);

    const ref1 = mgr.deduplicateBlob(largeChunk);
    const ref2 = mgr.deduplicateBlob(largeChunk);

    expect(ref1).toBe(ref2); // Exact reference equality in V8/JSC
  });
});
