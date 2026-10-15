import { useState, useRef, useEffect } from "react";
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
import { mechanicalSynth } from "./audio/mechanicalSynth";
import {
  fetchOmskModels,
  selectOmskModel,
  streamOmskChat,
  abortOmskChat,
  type OmskModel,
} from "./lib/omsk-api";

const INITIAL_FOLDERS: WorkspaceFolder[] = [
  { id: "f1", name: "oh-my-shark", path: "C:/Users/guerr/Downloads/oh-my-shark/oh-my-shark", isDefault: true },
  { id: "f2", name: "backend-core", path: "C:/Projetos/backend-core" },
  { id: "f3", name: "landing-page", path: "C:/Projetos/landing-page" },
];

const INITIAL_SESSIONS: ChatSession[] = [
  {
    id: "sess-1",
    title: "Sessão Ativa CosmoSky",
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
  const [tps] = useState<number>(45.2);

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

  // Carrega os modelos reais do backend OMSK
  const loadModels = async () => {
    setIsLoadingModels(true);
    const data = await fetchOmskModels();
    setIsLoadingModels(false);

    if (data.ok && data.models.length > 0) {
      setModels(data.models);
      setProviders(data.providers);

      // Define modelo padrão real
      if (!currentModel) {
        const defaultModel = data.models[0];
        setCurrentModel(defaultModel);
        if (defaultModel.thinking.length > 0) {
          setCurrentThinkingLevel(defaultModel.thinking[defaultModel.thinking.length - 1]);
        }
      }
    }
  };

  useEffect(() => {
    loadModels();
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

    await streamOmskChat(
      content,
      {
        onThinkingDelta: (delta) => {
          accumulatedThought += delta;
          scheduleUpdate();
        },
        onTextDelta: (delta) => {
          accumulatedText += delta;
          scheduleUpdate();
        },
        onToolStart: (toolName) => {
          accumulatedText += `\n> ⚙️ *Executando ferramenta:* \`${toolName}\`...\n\n`;
          flushUpdates();
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
      }
    );
  };

  const handleStopGeneration = async () => {
    await abortOmskChat();
    setIsGenerating(false);
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

      {/* 2. Faixa de Telemetria de Missão (12 Células Douradas) */}
      <TopMemoryStrip12
        tps={tps}
        latencyMs={12}
        memoryKb={48200}
        activeSubagentsCount={3}
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
          {/* Monitor CRT Multimodo com Moldura Bege Industrial */}
          <div className="flex-1 flex flex-col bg-[#C8C4B8] border-2 border-[#ECEAE2] p-2 rounded-[6px] shadow-[inset_2px_2px_0px_#ECEAE2,inset_-2px_-2px_0px_#7A7669,0px_4px_8px_rgba(0,0,0,0.5)] overflow-hidden">
            {/* Seletor de Modos do CRT no Topo */}
            <div className="flex justify-between items-center mb-1 text-[10px] font-mono font-bold text-[#3A3832]">
              <span className="flex items-center gap-1.5">
                <span>ASTRA-IA</span>
                <span className="text-[8px] bg-[#9E9A8C] text-[#ECEAE2] px-1 py-0.2 rounded">CRT-MULTIMODO</span>
              </span>

              <div className="flex space-x-1">
                {[
                  { id: 1 as const, label: "1. FRACTAL" },
                  { id: 2 as const, label: "2. PLANETA" },
                  { id: 3 as const, label: "3. BÚSSOLA" },
                  { id: 4 as const, label: "4. GRIMÓRIO" },
                ].map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => {
                      setAstralMode(m.id);
                      mechanicalSynth.playKeyClick();
                    }}
                    className={`px-1.5 py-0.5 rounded text-[8px] font-bold border transition-colors ${
                      astralMode === m.id
                        ? "bg-[#2B2D2F] text-[#00F0FF] border-[#00F0FF]"
                        : "bg-[#D6D2C4] text-[#3A3832] border-[#7A7669] hover:bg-[#ECEAE2]"
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Área de Visualização do Tubo CRT */}
            <div className="flex-1 bg-[#020307] border-2 border-[#2B2D2F] rounded-[4px] overflow-hidden relative shadow-[inset_0_0_16px_rgba(0,0,0,0.8)]">
              {astralMode === 1 && <FractalAndBiosphere />}
              {astralMode === 2 && <ExoplanetCodebaseDome />}
              {astralMode === 3 && (
                <OrbitalCompassAndPioneers
                  tps={tps}
                  onSpawnSubagent={(persona) => handleSendMessage(`/doomania persona ${persona}`, [])}
                />
              )}
              {astralMode === 4 && (
                <PromptGrimoireBook
                  onAcceptMission={(p) => handleSendMessage(p, [])}
                  onClose={() => setAstralMode(1)}
                />
              )}
            </div>
          </div>

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

          {/* Painel Tático Superior: Osciloscópio CRT + Cartuchos LLM */}
          <div className="grid grid-cols-2 gap-2 p-2 border-b border-[#968244]/40 bg-[#071E42]/20">
            <InferenceOscilloscope tps={tps} isGenerating={isGenerating} tokenCount={1240} />
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

      {/* Modal de Download da Aplicação Desktop (.EXE) */}
      <DownloadAppModal
        isOpen={isDownloadModalOpen}
        onClose={() => setIsDownloadModalOpen(false)}
      />
    </div>
  );
}
