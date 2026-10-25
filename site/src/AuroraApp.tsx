import { useState, useRef, useEffect, useMemo } from "react";
import "./styles/aurora-tokens.css";
import { ChatHeader } from "./components/chat/ChatHeader";
import { ChatSidebar, type ChatSession } from "./components/chat/ChatSidebar";
import { MessageItem, type Message } from "./components/chat/MessageItem";
import { MessageComposer, type AttachedFile } from "./components/chat/MessageComposer";
import { ChatWelcome } from "./components/chat/ChatWelcome";
import { WorkspaceFolderManager, type WorkspaceFolder } from "./components/modals/WorkspaceFolderManager";
import { SystemPromptModal } from "./components/modals/SystemPromptModal";
import { DownloadAppModal } from "./components/modals/DownloadAppModal";
import { ConfigureProviderModal } from "./components/modals/ConfigureProviderModal";
import { ReasoningLevelSelector } from "./components/ui/ReasoningLevelSelector";
import { TopCommandMenuBar } from "./components/astral/TopCommandMenuBar";
import { TopMemoryStrip12 } from "./components/astral/TopMemoryStrip12";
import { InferenceOscilloscope } from "./components/astral/InferenceOscilloscope";
import { ModelCartridgeSlots } from "./components/astral/ModelCartridgeSlots";
import { SubroutineKeypad21 } from "./components/astral/SubroutineKeypad21";
import { FractalAndBiosphere } from "./components/astral/FractalAndBiosphere";
import { ExoplanetCodebaseDome } from "./components/astral/ExoplanetCodebaseDome";
import { OrbitalCompassAndPioneers } from "./components/astral/OrbitalCompassAndPioneers";
import { PromptGrimoireBook } from "./components/astral/PromptGrimoireBook";
import { MainCRTViewport } from "./components/astral/MainCRTViewport";
import { mechanicalSynth } from "./audio/mechanicalSynth";
import {
  fetchOmskModels,
  selectOmskModel,
  streamOmskChat,
  abortOmskChat,
  fetchSystemStats,
  respondToAsk,
  type OmskModel,
  type SystemStats,
} from "./lib/omsk-api";

const INITIAL_FOLDERS: WorkspaceFolder[] = [
  { id: "f1", name: "oh-my-shark", path: "C:/Users/guerr/Downloads/oh-my-shark/oh-my-shark", isDefault: true },
  { id: "f2", name: "backend-core", path: "C:/Projetos/backend-core" },
  { id: "f3", name: "landing-page", path: "C:/Projetos/landing-page" },
];

const INITIAL_SESSIONS: ChatSession[] = [
  {
    id: "sess-1",
    title: "Sessão Ativa OMSK",
    updatedAt: "Agora",
    modelId: "",
    thinkingLevelId: "high",
    systemPrompt: "",
    folderId: "f1",
    messageCount: 0,
  },
];

export function AuroraApp() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sessions, setSessions] = useState<ChatSession[]>(INITIAL_SESSIONS);
  const [activeSessionId, setActiveSessionId] = useState<string>("sess-1");
  const [messagesMap, setMessagesMap] = useState<Record<string, Message[]>>({ "sess-1": [] });

  const [models, setModels] = useState<OmskModel[]>([]);
  const [providers, setProviders] = useState<string[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<string>("all");
  const [currentModel, setCurrentModel] = useState<OmskModel | null>(null);
  const [currentThinkingLevel, setCurrentThinkingLevel] = useState<string>("high");
  const [isLoadingModels, setIsLoadingModels] = useState(true);

  // Telemetria dinâmica real
  const [systemStats, setSystemStats] = useState<SystemStats | null>(null);
  const [tps, setTps] = useState<number>(0);
  const [activeSubagents, setActiveSubagents] = useState<Array<{ agentId: string; task: string; persona: string; beaconColor: string }>>([
    { agentId: "sa-1", task: "Sincronização TUI <-> GUI Bridge", persona: "permissivo", beaconColor: "#10B981" },
    { agentId: "sa-2", task: "Auditoria Cética de Invariantes", persona: "critico", beaconColor: "#EF4444" },
    { agentId: "sa-3", task: "Design System & Zero Mocks", persona: "criativo", beaconColor: "#8B5CF6" },
  ]);
  const [pendingAsk, setPendingAsk] = useState<{ question: string; options: string[] } | null>(null);

  // Diretórios locais
  const [folders, setFolders] = useState<WorkspaceFolder[]>(INITIAL_FOLDERS);
  const [activeFolderId, setActiveFolderId] = useState<string>("f1");
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);

  // Prompt de Sistema
  const [isPromptModalOpen, setIsPromptModalOpen] = useState(false);
  const [globalPrompt, setGlobalPrompt] = useState("");

  // Modais de Download e Configuração de Provedor
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);
  const [isConfigureProviderOpen, setIsConfigureProviderOpen] = useState(false);

  // Estados do Astral Codex Starbridge
  const [astralMode, setAstralMode] = useState<1 | 2 | 3 | 4>(1);
  const [temperature, setTemperature] = useState<number>(0.7);
  const [topP, setTopP] = useState<number>(0.95);
  const [isAudioMuted, setIsAudioMuted] = useState<boolean>(false);

  const handleMacroExecution = (macroId: string, label: string) => {
    const prefix = macroId.split("_")[0];
    switch (prefix) {
      case "doomania":
        handleSendMessage("/doomania", []);
        break;
      case "cleanup":
        handleSendMessage("/cleanup", []);
        break;
      case "gen":
        handleSendMessage("Gere uma suíte completa de testes unitários para o código recente.", []);
        break;
      case "ast":
        handleSendMessage("Extraia o resumo estrutural da arquitetura AST dos arquivos principais.", []);
        break;
      case "rg":
        handleSendMessage("Execute busca de referências e definições no repositório com pi-builtins rg.", []);
        break;
      case "sec":
        handleSendMessage("Invoque a auditoria crítica de segurança contra vulnerabilidades.", []);
        break;
      case "diff":
        handleSendMessage("Exiba e revise as alterações pendentes no git diff.", []);
        break;
      case "ps":
        handleSendMessage("Liste os processos em execução e status de jobs no sistema.", []);
        break;
      case "git":
        handleSendMessage("Sincronize as branches locais via git pull.", []);
        break;
      case "bld":
        handleSendMessage("Execute a compilação e validação sintática do projeto.", []);
        break;
      case "ctx":
        handleSendMessage("Execute a compressão semântica de contexto para compactar o histórico.", []);
        break;
      case "sys":
        handleNewSession();
        break;
      default:
        handleSendMessage(`Executar macro [${label}] na estação orbital OMSK.`, []);
    }
  };

  // Estados de Geração
  const [isGenerating, setIsGenerating] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeSession =
    sessions.find((s) => s.id === activeSessionId) || sessions[0];
  const activeMessages = messagesMap[activeSessionId] || [];
  const activeFolder =
    folders.find((f) => f.id === activeFolderId) || folders[0];

  // Cálculo de tokens acumulados na sessão ativa
  const sessionTokens = useMemo(() => {
    return activeMessages.reduce((acc, m) => {
      const textLen = m.content ? m.content.length : 0;
      const thoughtLen = m.thought ? m.thought.length : 0;
      return acc + Math.max(1, Math.round((textLen + thoughtLen) / 4));
    }, 0);
  }, [activeMessages]);

  // Carrega os modelos reais do backend OMSK
  const loadModels = async () => {
    setIsLoadingModels(true);
    const data = await fetchOmskModels();
    setIsLoadingModels(false);

    if (data.ok && data.models.length > 0) {
      setModels(data.models);
      setProviders(data.providers);

      if (!currentModel) {
        const defaultModel = data.models[0];
        setCurrentModel(defaultModel);
        if (defaultModel.thinking.length > 0) {
          setCurrentThinkingLevel(defaultModel.thinking[defaultModel.thinking.length - 1]);
        }
      }
    }
  };

  // Carrega telemetria real periodicamente
  useEffect(() => {
    loadModels();

    const fetchStats = async () => {
      const res = await fetchSystemStats();
      if (res.ok && res.stats) {
        setSystemStats(res.stats);
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 4000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeMessages, isGenerating]);

  // Criação de Nova Sessão
  const handleNewSession = () => {
    const newId = `sess-${Date.now()}`;
    const newSession: ChatSession = {
      id: newId,
      title: "Nova Conversa",
      updatedAt: "Agora",
      modelId: currentModel?.id || "",
      thinkingLevelId: currentThinkingLevel,
      systemPrompt: "",
      folderId: activeFolderId,
      messageCount: 0,
    };
    setSessions((prev) => [newSession, ...prev]);
    setActiveSessionId(newId);
    setMessagesMap((prev) => ({ ...prev, [newId]: [] }));
  };

  const handleDeleteSession = (id: string) => {
    if (sessions.length <= 1) return;
    const remaining = sessions.filter((s) => s.id !== id);
    setSessions(remaining);
    if (activeSessionId === id) {
      setActiveSessionId(remaining[0].id);
    }
  };

  // Seleciona modelo no frontend e notifica o backend OMSK
  const handleModelSelect = async (model: OmskModel) => {
    setCurrentModel(model);
    const nextThinking = model.thinking.length > 0 ? model.thinking[model.thinking.length - 1] : "off";
    setCurrentThinkingLevel(nextThinking);
    await selectOmskModel(model.provider, model.id, nextThinking);
  };

  const handleThinkingLevelSelect = async (levelId: string) => {
    setCurrentThinkingLevel(levelId);
    if (currentModel) {
      await selectOmskModel(currentModel.provider, currentModel.id, levelId);
    }
  };

  const handleSelectAskOption = async (option: string) => {
    await respondToAsk(option);
    setPendingAsk(null);
    handleSendMessage(`[Decisão Ask Autorizada: ${option}]`, []);
  };

  // Envio de Mensagem com Streaming SSE REAL do OMSK
  const handleSendMessage = async (content: string, attachments: AttachedFile[]) => {
    const userMsgId = `user-${Date.now()}`;
    const userMsg: Message = {
      id: userMsgId,
      sender: "user",
      content,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      attachments,
    };

    if (activeMessages.length === 0) {
      const newTitle = content.slice(0, 32) || "Conversa";
      setSessions((prev) =>
        prev.map((s) => (s.id === activeSessionId ? { ...s, title: newTitle } : s))
      );
    }

    const aiMsgId = `ai-${Date.now()}`;
    const initialAiMsg: Message = {
      id: aiMsgId,
      sender: "assistant",
      content: "",
      thought: "",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      modelName: currentModel ? `${currentModel.name} (${currentModel.provider})` : "OMSK Model",
      isGenerating: true,
    };

    setMessagesMap((prev) => ({
      ...prev,
      [activeSessionId]: [...(prev[activeSessionId] || []), userMsg, initialAiMsg],
    }));

    setIsGenerating(true);

    let accumulatedText = "";
    let accumulatedThought = "";
    let totalStreamedTokens = 0;
    const streamStartTime = performance.now();
    let rafId: number | null = null;

    const flushUpdates = () => {
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
      const textSnapshot = accumulatedText;
      const thoughtSnapshot = accumulatedThought;
      setMessagesMap((prev) => ({
        ...prev,
        [activeSessionId]: (prev[activeSessionId] || []).map((m) =>
          m.id === aiMsgId ? { ...m, content: textSnapshot, thought: thoughtSnapshot } : m
        ),
      }));
    };

    const scheduleUpdate = () => {
      if (rafId === null) {
        rafId = requestAnimationFrame(() => {
          rafId = null;
          flushUpdates();
        });
      }
    };

    const historyPayload = activeMessages.map((m) => ({
      sender: m.sender,
      content: m.content,
    }));

    await streamOmskChat(
      content,
      {
        onThinkingDelta: (delta) => {
          accumulatedThought += delta;
          totalStreamedTokens += Math.max(1, Math.round(delta.length / 4));
          const elapsed = Math.max(0.1, (performance.now() - streamStartTime) / 1000);
          setTps(totalStreamedTokens / elapsed);
          scheduleUpdate();
        },
        onTextDelta: (delta) => {
          accumulatedText += delta;
          totalStreamedTokens += Math.max(1, Math.round(delta.length / 4));
          const elapsed = Math.max(0.1, (performance.now() - streamStartTime) / 1000);
          setTps(totalStreamedTokens / elapsed);
          scheduleUpdate();
        },
        onToolStart: (toolName) => {
          accumulatedText += `\n> ⚙️ *Executando ferramenta:* \`${toolName}\`...\n\n`;
          flushUpdates();
        },
        onToolResult: (toolName, output) => {
          accumulatedText += `\n> ✅ *Resultado da ferramenta* \`${toolName}\`:\n\`\`\`\n${output.slice(0, 300)}\n\`\`\`\n\n`;
          flushUpdates();
        },
        onSubagentSpawn: (agent) => {
          setActiveSubagents((prev) => [
            ...prev.filter((a) => a.agentId !== agent.agentId),
            agent,
          ]);
        },
        onAskUser: (ask) => {
          setPendingAsk(ask);
        },
        onDone: () => {
          flushUpdates();
          setIsGenerating(false);
          setMessagesMap((prev) => ({
            ...prev,
            [activeSessionId]: (prev[activeSessionId] || []).map((m) =>
              m.id === aiMsgId ? { ...m, isGenerating: false } : m
            ),
          }));
        },
        onError: (err) => {
          if (rafId !== null) {
            cancelAnimationFrame(rafId);
            rafId = null;
          }
          setIsGenerating(false);
          setMessagesMap((prev) => ({
            ...prev,
            [activeSessionId]: (prev[activeSessionId] || []).map((m) =>
              m.id === aiMsgId
                ? {
                    ...m,
                    content: accumulatedText ? `${accumulatedText}\n\n❌ Erro: ${err}` : `❌ Erro do OMSK: ${err}`,
                    thought: accumulatedThought,
                    isGenerating: false,
                  }
                : m
            ),
          }));
        },
      },
      {
        model: currentModel ? { provider: currentModel.provider, id: currentModel.id } : undefined,
        thinkingLevel: currentThinkingLevel,
        systemPrompt: activeSession.systemPrompt || globalPrompt || undefined,
        history: historyPayload,
      }
    );
  };

  const handleStopGeneration = async () => {
    await abortOmskChat();
    setIsGenerating(false);
    setPendingAsk(null);
    setMessagesMap((prev) => ({
      ...prev,
      [activeSessionId]: (prev[activeSessionId] || []).map((m) =>
        m.isGenerating ? { ...m, isGenerating: false } : m
      ),
    }));
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#020307] text-[var(--texto-principal)] font-sans antialiased select-none">
      {/* 1. Barra de Menu Superior Estelar (24px) */}
      <TopCommandMenuBar
        workspaceName={activeFolder.name}
        gitBranch="main*"
        activeModelName={currentModel?.name || "OMSK-Core"}
        isAudioMuted={isAudioMuted}
        onToggleAudio={() => setIsAudioMuted(mechanicalSynth.toggleMute())}
        onOpenSettings={() => setIsConfigureProviderOpen(true)}
        onOpenHelp={() => setAstralMode(4)}
        onNewSession={handleNewSession}
        activeMode={`Deck ${astralMode}`}
        onSelectMode={(m) => setAstralMode(m)}
      />

      {/* 2. Faixa de Telemetria de Missão (12 Células Douradas) Dinâmica */}
      <TopMemoryStrip12
        tps={tps || 38.4}
        latencyMs={Math.max(6, Math.round(tps > 0 ? 1000 / tps : 12))}
        memoryKb={systemStats ? Math.round(systemStats.heapUsed / 1024) : 48200}
        activeSubagentsCount={activeSubagents.length}
        compressionRatio={42}
        isGenerating={isGenerating}
      />

      {/* 3. Área Central da Estação Orbital (Divisão em 2 Decks) */}
      <div className="flex-1 flex overflow-hidden">
        {/* Barra Lateral de Sessões (Recolhível) */}
        <ChatSidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          sessions={sessions}
          activeSessionId={activeSessionId}
          onSelectSession={setActiveSessionId}
          onNewSession={handleNewSession}
          onDeleteSession={handleDeleteSession}
          onOpenFolderManager={() => setIsFolderModalOpen(true)}
          onOpenDownloadModal={() => setIsDownloadModalOpen(true)}
          activeFolderName={activeFolder.name}
        />

        {/* Deck Esquerdo: Monitor CRT Multimodo + Chassi Bege com 21 Teclas (55% de largura) */}
        <div className="w-[55%] flex flex-col border-r-2 border-[#968244] bg-[#05070E] p-2 space-y-2 overflow-hidden">
          {/* Monitor CRT Principal Multimodo com Moldura Bege Industrial */}
          <MainCRTViewport activeMode={astralMode} onSelectMode={setAstralMode}>
            {astralMode === 1 && <FractalAndBiosphere />}
            {astralMode === 2 && <ExoplanetCodebaseDome />}
            {astralMode === 3 && (
              <OrbitalCompassAndPioneers
                tps={tps || 42.5}
                onSpawnSubagent={(persona) => handleSendMessage(`/doomania persona ${persona}`, [])}
              />
            )}
            {astralMode === 4 && (
              <PromptGrimoireBook
                onAcceptMission={(p) => handleSendMessage(p, [])}
                onClose={() => setAstralMode(1)}
              />
            )}
          </MainCRTViewport>

          {/* Base do Gabinete: Teclado Mecânico de 21 Macros e Sliders */}
          <SubroutineKeypad21
            onExecuteMacro={handleMacroExecution}
            temperature={temperature}
            onChangeTemperature={setTemperature}
            topP={topP}
            onChangeTopP={setTopP}
          />
        </div>

        {/* Deck Direito: Telemetria + Stream de Missão Estilo Codex (45% de largura) */}
        <div className="w-[45%] flex flex-col bg-[#05070E] overflow-hidden relative">
          {/* Cabeçalho do Chat com Seletor de Modelo */}
          <ChatHeader
            onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
            currentModel={currentModel}
            models={models}
            providers={providers}
            selectedProvider={selectedProvider}
            onSelectProvider={setSelectedProvider}
            onSelectModel={handleModelSelect}
            onConfigureProvider={() => setIsConfigureProviderOpen(true)}
            onRefreshModels={loadModels}
            isLoadingModels={isLoadingModels}
            onOpenSystemPrompt={() => setIsPromptModalOpen(true)}
            onOpenFolderManager={() => setIsFolderModalOpen(true)}
            onOpenDownloadModal={() => setIsDownloadModalOpen(true)}
            onNewSession={handleNewSession}
            activeFolderName={activeFolder.name}
            hasCustomPrompt={Boolean(activeSession.systemPrompt)}
            isGenerating={isGenerating}
          />

          {/* Painel Tático Superior: Osciloscópio CRT Dinâmico + Cartuchos LLM */}
          <div className="grid grid-cols-2 gap-2 p-2 border-b border-[#968244]/40 bg-[#071E42]/20">
            <InferenceOscilloscope tps={tps || 42.5} isGenerating={isGenerating} tokenCount={sessionTokens || 120} />
            <ModelCartridgeSlots currentModelName={currentModel?.name || "OMSK-Core"} />
          </div>

          {/* Barra de Nível de Raciocínio (se suportado pelo modelo) */}
          {currentModel && currentModel.reasoning && (
            <div className="px-3 py-1.5 bg-[#0B0F1F] border-b border-[#968244]/40">
              <ReasoningLevelSelector
                model={currentModel}
                currentLevelId={currentThinkingLevel}
                onSelectLevel={handleThinkingLevelSelect}
              />
            </div>
          )}

          {/* Stream de Conversa e Ações */}
          <div className="flex-1 overflow-y-auto px-4 py-4 scrollbar-styled bg-[#020307]/50">
            <div className="max-w-3xl mx-auto min-h-full flex flex-col justify-between">
              {/* Painel Live de Subagentes Ativos (Doomania Triad) */}
              {activeSubagents.length > 0 && (
                <div className="mb-4 p-2.5 rounded-xl border border-[#968244]/40 bg-[#071E42]/40 backdrop-blur-md">
                  <div className="flex items-center justify-between text-[10px] font-mono text-[#D4B85E] pb-1.5 mb-1.5 border-b border-[#968244]/30">
                    <span className="font-bold uppercase tracking-wider flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#00F0FF] animate-pulse" />
                      Frota de Subagentes OMSK // Doomania Active
                    </span>
                    <span className="text-[#5CE1E6] font-mono">{activeSubagents.length} AGENTES ATIVOS</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {activeSubagents.map((ag) => (
                      <div
                        key={ag.agentId}
                        className="p-1.5 rounded-lg border border-white/10 bg-black/40 flex flex-col justify-between"
                      >
                        <div className="flex items-center gap-1 text-[9px] font-mono font-bold truncate">
                          <span
                            className="w-1.5 h-1.5 rounded-full shrink-0"
                            style={{ backgroundColor: ag.beaconColor }}
                          />
                          <span className="truncate text-white">{ag.persona.toUpperCase()}</span>
                        </div>
                        <span className="text-[8px] text-[var(--texto-terciario)] truncate mt-0.5">
                          {ag.task}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Diálogo Interativo Ask User (Protocolo de Autorização A/B/C) */}
              {pendingAsk && (
                <div className="mb-4 p-3 rounded-2xl border-2 border-[#5CE1E6] bg-[#071E42]/80 shadow-[0_0_20px_rgba(0,229,255,0.25)] backdrop-blur-lg animate-in fade-in">
                  <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#5CE1E6] mb-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#5CE1E6] animate-ping" />
                    <span>SOLICITAÇÃO DE DECISÃO // ASK PROTOCOL</span>
                  </div>
                  <p className="text-sm text-white mb-3 leading-relaxed font-sans font-medium">
                    {pendingAsk.question}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {pendingAsk.options.map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => handleSelectAskOption(opt)}
                        className="px-3 py-1.5 rounded-xl border border-[#00F0FF]/60 bg-[#00F0FF]/15 hover:bg-[#00F0FF]/30 text-white font-mono text-xs transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm"
                      >
                        <span className="text-[#00F0FF] font-bold">▶</span>
                        <span>{opt}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {activeMessages.length === 0 ? (
                <ChatWelcome
                  onSelectPrompt={(text) => handleSendMessage(text, [])}
                  onOpenFolderManager={() => setIsFolderModalOpen(true)}
                  onOpenDownloadModal={() => setIsDownloadModalOpen(true)}
                  activeFolderName={activeFolder.name}
                />
              ) : (
                <div className="space-y-4">
                  {activeMessages.map((msg) => (
                    <MessageItem
                      key={msg.id}
                      message={msg}
                      onRetry={() => handleSendMessage(msg.content, [])}
                    />
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>
          </div>

          {/* Compositor de Mensagens no Rodapé */}
          <div className="p-3 bg-[#0B0F1F] border-t border-[#968244]/50 shrink-0">
            <MessageComposer
              onSendMessage={handleSendMessage}
              isGenerating={isGenerating}
              onStopGeneration={handleStopGeneration}
              activeFolderName={activeFolder.name}
              onOpenFolderManager={() => setIsFolderModalOpen(true)}
            />
          </div>
        </div>
      </div>

      {/* Modal de Gerenciamento de Pastas Locais */}
      <WorkspaceFolderManager
        isOpen={isFolderModalOpen}
        onClose={() => setIsFolderModalOpen(false)}
        folders={folders}
        activeFolderId={activeFolderId}
        onSelectFolder={(id) => {
          setActiveFolderId(id);
          setIsFolderModalOpen(false);
        }}
        onAddFolder={(name, path) => {
          const newF: WorkspaceFolder = { id: `f-${Date.now()}`, name, path };
          setFolders((prev) => [...prev, newF]);
          setActiveFolderId(newF.id);
        }}
        onRemoveFolder={(id) => {
          setFolders((prev) => prev.filter((f) => f.id !== id));
        }}
      />

      {/* Modal de Configuração de Prompt de Sistema */}
      <SystemPromptModal
        isOpen={isPromptModalOpen}
        onClose={() => setIsPromptModalOpen(false)}
        chatTitle={activeSession.title}
        globalPrompt={globalPrompt}
        sessionPrompt={activeSession.systemPrompt}
        onSave={(newGlobal, newSession) => {
          setGlobalPrompt(newGlobal);
          setSessions((prev) =>
            prev.map((s) => (s.id === activeSessionId ? { ...s, systemPrompt: newSession } : s))
          );
        }}
      />

      {/* Modal para Configurar Provedores e Chaves de API Reais */}
      <ConfigureProviderModal
        isOpen={isConfigureProviderOpen}
        onClose={() => setIsConfigureProviderOpen(false)}
        onSuccess={loadModels}
        existingProviders={providers}
      />

      {/* Modal de Download do CLI Windows (.EXE) */}
      <DownloadAppModal
        isOpen={isDownloadModalOpen}
        onClose={() => setIsDownloadModalOpen(false)}
      />
    </div>
  );
}
