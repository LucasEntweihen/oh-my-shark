export interface OmskModel {
  provider: string;
  id: string;
  selector: string;
  name: string;
  contextWindow: number;
  maxTokens: number;
  reasoning: boolean;
  thinking: string[];
  input: string[];
}

export interface OmskModelsResponse {
  ok: boolean;
  providers: string[];
  models: OmskModel[];
  currentModel: {
    provider: string;
    id: string;
    selector: string;
    name: string;
  } | null;
  currentThinkingLevel: string;
  error?: string;
}

export interface SystemStats {
  heapUsed: number;
  heapTotal: number;
  rss: number;
  uptime: number;
  activeStreams: number;
  modelsCount: number;
  cwd: string;
}

export interface SlashCommandInfo {
  name: string;
  description: string;
  icon?: string;
  subcommands: Array<{ name: string; description: string; usage?: string }>;
}

const API_BASE = window.location.origin;

/**
 * Busca a lista REAL de provedores e modelos configurados no OMSK
 */
export async function fetchOmskModels(): Promise<OmskModelsResponse> {
  try {
    const res = await fetch(`${API_BASE}/api/models`);
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }
    return (await res.json()) as OmskModelsResponse;
  } catch (err) {
    console.error("Falha ao buscar modelos do OMSK:", err);
    return {
      ok: false,
      providers: [],
      models: [],
      currentModel: null,
      currentThinkingLevel: "high",
      error: String(err),
    };
  }
}

/**
 * Busca estatísticas reais de telemetria do sistema OMSK
 */
export async function fetchSystemStats(): Promise<{ ok: boolean; stats?: SystemStats; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/api/system/stats`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return (await res.json()) as { ok: boolean; stats: SystemStats };
  } catch (err) {
    return { ok: false, error: String(err) };
  }
}

/**
 * Busca catálogo completo de slash commands reais do OMSK
 */
export async function fetchAvailableCommands(): Promise<{ ok: boolean; commands: SlashCommandInfo[] }> {
  try {
    const res = await fetch(`${API_BASE}/api/commands`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return (await res.json()) as { ok: boolean; commands: SlashCommandInfo[] };
  } catch {
    return { ok: false, commands: [] };
  }
}

/**
 * Configura um novo provider ou salva API Key no AuthStorage real do OMSK
 */
export async function configureOmskProvider(provider: string, apiKey: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/api/providers/configure`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ provider, apiKey }),
    });
    return (await res.json()) as { ok: boolean; error?: string };
  } catch (err) {
    return { ok: false, error: String(err) };
  }
}

/**
 * Seleciona o modelo e/ou nível de raciocínio ativo no backend OMSK
 */
export async function selectOmskModel(provider: string, id: string, thinkingLevel?: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/api/models/select`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ provider, id, thinkingLevel }),
    });
    return (await res.json()) as { ok: boolean; error?: string };
  } catch (err) {
    return { ok: false, error: String(err) };
  }
}

/**
 * Responde ao protocolo interativo Ask User (escolha de plano A/B/C)
 */
export async function respondToAsk(selectedOption: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/api/ask/respond`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ selectedOption }),
    });
    return (await res.json()) as { ok: boolean; error?: string };
  } catch (err) {
    return { ok: false, error: String(err) };
  }
}

/**
 * Inicia nova sessão real no SessionManager do OMSK
 */
export async function createOmskSession(): Promise<{ ok: boolean; sessionId?: string; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/api/sessions/new`, { method: "POST" });
    return (await res.json()) as { ok: boolean; sessionId?: string; error?: string };
  } catch (err) {
    return { ok: false, error: String(err) };
  }
}

/**
 * Interrompe a geração atual
 */
export async function abortOmskChat(): Promise<void> {
  try {
    await fetch(`${API_BASE}/api/chat/abort`, { method: "POST" });
  } catch {}
}

export interface StreamChatHandlers {
  onThinkingDelta?: (delta: string) => void;
  onTextDelta?: (delta: string) => void;
  onToolStart?: (toolName: string, args: unknown) => void;
  onToolResult?: (toolName: string, output: string) => void;
  onToolEnd?: (toolCallId: string, isError: boolean) => void;
  onSubagentSpawn?: (agent: { agentId: string; task: string; persona: string; beaconColor: string }) => void;
  onAskUser?: (ask: { question: string; options: string[] }) => void;
  onDone?: () => void;
  onError?: (error: string) => void;
}

/**
 * Envia uma mensagem e consome a resposta com streaming SSE real do motor OMSK
 */
export async function streamOmskChat(
  text: string,
  handlers: StreamChatHandlers,
  options?: {
    model?: { provider: string; id: string };
    thinkingLevel?: string;
    systemPrompt?: string;
    history?: Array<{ sender: "user" | "assistant"; content: string }>;
  }
): Promise<void> {
  try {
    const res = await fetch(`${API_BASE}/api/chat/stream`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text,
        model: options?.model,
        thinkingLevel: options?.thinkingLevel,
        systemPrompt: options?.systemPrompt,
        history: options?.history,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      handlers.onError?.(`HTTP ${res.status}: ${errText}`);
      return;
    }

    const reader = res.body?.getReader();
    if (!reader) {
      handlers.onError?.("Sem stream de resposta do servidor");
      return;
    }

    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const parts = buffer.split("\n\n");
      buffer = parts.pop() ?? "";

      for (const part of parts) {
        const lines = part.split("\n");
        let event = "";
        let data = "";

        for (const line of lines) {
          if (line.startsWith("event: ")) {
            event = line.slice(7).trim();
          } else if (line.startsWith("data: ")) {
            data = line.slice(6).trim();
          }
        }

        if (event && data) {
          try {
            const parsed = JSON.parse(data) as Record<string, unknown>;
            if (event === "thinking_delta" && typeof parsed.delta === "string") {
              handlers.onThinkingDelta?.(parsed.delta);
            } else if (event === "text_delta" && typeof parsed.delta === "string") {
              handlers.onTextDelta?.(parsed.delta);
            } else if (event === "tool_start") {
              handlers.onToolStart?.(String(parsed.toolName), parsed.args);
            } else if (event === "tool_result") {
              handlers.onToolResult?.(String(parsed.toolName), String(parsed.output));
            } else if (event === "tool_end") {
              handlers.onToolEnd?.(String(parsed.toolCallId), Boolean(parsed.isError));
            } else if (event === "subagent_spawn") {
              handlers.onSubagentSpawn?.({
                agentId: String(parsed.agentId),
                task: String(parsed.task),
                persona: String(parsed.persona),
                beaconColor: String(parsed.beaconColor),
              });
            } else if (event === "ask_user") {
              handlers.onAskUser?.({
                question: String(parsed.question),
                options: Array.isArray(parsed.options) ? (parsed.options as string[]) : [],
              });
            } else if (event === "done") {
              handlers.onDone?.();
            } else if (event === "error") {
              handlers.onError?.(String(parsed.message));
            }
          } catch {}
        }
      }
    }

    handlers.onDone?.();
  } catch (err) {
    handlers.onError?.(String(err));
  }
}
