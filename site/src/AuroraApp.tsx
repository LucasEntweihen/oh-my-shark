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
    <div className="flex h-screen w-screen overflow-hidden bg-[var(--cor-fundo)] text-[var(--texto-principal)] font-sans antialiased select-none">
      {/* Barra Lateral de Sessões e Navegação */}
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

      {/* Janela Principal do Chat */}
      <div className="flex-1 flex flex-col h-full min-w-0 bg-[var(--cor-fundo)] relative">
        {/* Cabeçalho Superior Conectado ao OMSK Real */}
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

        {/* Barra Gráfica de Nível de Raciocínio Real */}
        {currentModel && currentModel.reasoning && (
          <div className="px-4 py-2 bg-[var(--cor-superficie)]/40 border-b border-[var(--cor-borda)]/60">
            <div className="max-w-4xl mx-auto">
              <ReasoningLevelSelector
                model={currentModel}
                currentLevelId={currentThinkingLevel}
                onSelectLevel={handleThinkingLevelSelect}
              />
            </div>
          </div>
        )}

        {/* Área de Mensagens / Conversa */}
        <div className="flex-1 overflow-y-auto px-4 py-6 scrollbar-styled">
          <div className="max-w-4xl mx-auto min-h-full flex flex-col justify-between">
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

        {/* Compositor Fixo na Parte Inferior */}
        <div className="p-4 bg-gradient-to-t from-[var(--cor-fundo)] via-[var(--cor-fundo)] to-transparent pt-6 shrink-0">
          <MessageComposer
            onSendMessage={handleSendMessage}
            isGenerating={isGenerating}
            onStopGeneration={handleStopGeneration}
            activeFolderName={activeFolder.name}
            onOpenFolderManager={() => setIsFolderModalOpen(true)}
          />
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
