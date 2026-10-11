import { useState, useRef, useEffect } from "react";
import "./styles/aurora-tokens.css";
import { ChatHeader } from "./components/chat/ChatHeader";
import { ChatSidebar, type ChatSession } from "./components/chat/ChatSidebar";
import { MessageItem, type Message } from "./components/chat/MessageItem";
import { MessageComposer, type AttachedFile } from "./components/chat/MessageComposer";
import { ChatWelcome } from "./components/chat/ChatWelcome";
import { WorkspaceFolderManager, type WorkspaceFolder } from "./components/modals/WorkspaceFolderManager";
import { SystemPromptModal } from "./components/modals/SystemPromptModal";
import { ReasoningLevelSelector } from "./components/ui/ReasoningLevelSelector";
import { AVAILABLE_MODELS, type ModelSpec } from "./types/models";

const INITIAL_FOLDERS: WorkspaceFolder[] = [
  { id: "f1", name: "oh-my-shark", path: "C:/Users/guerr/Downloads/oh-my-shark/oh-my-shark", isDefault: true },
  { id: "f2", name: "backend-core", path: "C:/Projetos/backend-core" },
  { id: "f3", name: "landing-page", path: "C:/Projetos/landing-page" },
];

const INITIAL_SESSIONS: ChatSession[] = [
  {
    id: "sess-1",
    title: "Arquitetura e Engenharia de Software",
    updatedAt: "Há pouco",
    modelId: "claude-3-7-sonnet",
    thinkingLevelId: "high",
    systemPrompt: "Foco em tipagem estrita TypeScript sem 'any', elegância e performance nativa.",
    folderId: "f1",
    messageCount: 2,
  },
  {
    id: "sess-2",
    title: "Auditoria de Segurança",
    updatedAt: "Ontem",
    modelId: "o3-mini",
    thinkingLevelId: "medium",
    systemPrompt: "Auditar inputs e fluxo de dados.",
    folderId: "f1",
    messageCount: 0,
  },
];

const INITIAL_MESSAGES: Record<string, Message[]> = {
  "sess-1": [
    {
      id: "m-1",
      sender: "user",
      content: "Como podemos estruturar a interface gráfica da Aurora AI respeitando o DESIGN.md e o ICON_SYSTEM.md?",
      timestamp: "10:42",
    },
    {
      id: "m-2",
      sender: "assistant",
      content:
        "A interface da Aurora AI foi estruturada com base no princípio de 'luz sobre veludo': fundo neutro profundo (#0A0A0C), superfícies discretas (#121216) e refração espectral controlada.\n\nPrincipais pilares implementados:\n1. **Seletor de Modelo Estilo Claude**: Escolha rápida e visual dos modelos disponíveis.\n2. **Seletor Gráfico de Raciocínio**: Barras espectrais que mostram com exatidão a profundidade do pensamento suportada pelo modelo.\n3. **Visualizador de Pensamento**: Traço de reflexão expansível para auditar o raciocínio da IA.\n4. **Prompt de Sistema**: Configuração granular global ou por sessão.\n5. **Pastas Locais & Anexos**: Conexão com diretórios do seu computador e suporte a arquivos e imagens.",
      thought:
        "Analisando requisitos do usuário:\n- Fazer perguntas normalmente: OK (MessageComposer)\n- Criar chats e sessões: OK (ChatSidebar)\n- Ver melhor forma de pensamento da IA: OK (ThoughtViewer com traço expansível)\n- Controlar prompt de sistema da IA global e por chat: OK (SystemPromptModal)\n- Anexar imagens e arquivos: OK (Preview com thumbnails)\n- Referenciar pastas do computador: OK (WorkspaceFolderManager)\n- Chamar comandos, skills, agentes: OK (Autocomplete inteligente)\n- Escolher nível de raciocínio de forma gráfica: OK (ReasoningLevelSelector)\n- Escolher modelo de forma simples como no Claude: OK (ModelSelector)\n- Usar ICON_SYSTEM.md: OK (1.5px stroke, terminadores redondos, Lucide com wrapper Icon)",
      timestamp: "10:43",
      modelName: "Claude 3.7 Sonnet (High Reasoning)",
    },
  ],
};

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sessions, setSessions] = useState<ChatSession[]>(INITIAL_SESSIONS);
  const [activeSessionId, setActiveSessionId] = useState<string>("sess-1");
  const [messagesMap, setMessagesMap] = useState<Record<string, Message[]>>(INITIAL_MESSAGES);

  // Modelos e Raciocínio
  const [currentModel, setCurrentModel] = useState<ModelSpec>(AVAILABLE_MODELS[0]);
  const [currentThinkingLevel, setCurrentThinkingLevel] = useState<string>("high");

  // Diretórios locais
  const [folders, setFolders] = useState<WorkspaceFolder[]>(INITIAL_FOLDERS);
  const [activeFolderId, setActiveFolderId] = useState<string>("f1");
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);

  // Prompt de Sistema
  const [isPromptModalOpen, setIsPromptModalOpen] = useState(false);
  const [globalPrompt, setGlobalPrompt] = useState(
    "Você é a Aurora AI, uma assistente de engenharia de software de alto nível. Responda em português brasileiro com clareza, rigor técnico e elegância."
  );

  // Estados de Geração
  const [isGenerating, setIsGenerating] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeSession =
    sessions.find((s) => s.id === activeSessionId) || sessions[0];
  const activeMessages = messagesMap[activeSessionId] || [];
  const activeFolder =
    folders.find((f) => f.id === activeFolderId) || folders[0];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeMessages, isGenerating]);

  // Criação de Nova Sessão / Chat
  const handleNewSession = () => {
    const newId = `sess-${Date.now()}`;
    const newSession: ChatSession = {
      id: newId,
      title: "Nova Conversa",
      updatedAt: "Agora",
      modelId: currentModel.id,
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

  // Envio de Mensagem com Simulação de Raciocínio e Resposta
  const handleSendMessage = (content: string, attachments: AttachedFile[]) => {
    const userMsgId = `user-${Date.now()}`;
    const userMsg: Message = {
      id: userMsgId,
      sender: "user",
      content,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      attachments,
    };

    // Atualiza título da sessão se for a primeira mensagem
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
      thought: currentModel.hasThinking
        ? `Iniciando raciocínio com ${currentModel.name} no nível [${currentThinkingLevel}]...\nPasta de trabalho ativa: ${activeFolder.path}\nVerificando diretrizes de prompt e contexto...`
        : undefined,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      modelName: `${currentModel.name} ${currentModel.hasThinking ? `(${currentThinkingLevel})` : ""}`,
      isGenerating: true,
    };

    setMessagesMap((prev) => ({
      ...prev,
      [activeSessionId]: [...(prev[activeSessionId] || []), userMsg, initialAiMsg],
    }));

    setIsGenerating(true);

    // Simulação progressiva da resposta
    setTimeout(() => {
      let simulatedResponse = `Entendido! Analisei sua solicitação com base no modelo **${currentModel.name}** utilizando o contexto da pasta \`${activeFolder.name}\`.\n\n`;

      if (content.startsWith("/")) {
        simulatedResponse += `⚡ **Comando Reconhecido**: \`${content.split(" ")[0]}\` disparado com sucesso.\n`;
      }
      if (content.includes("@")) {
        simulatedResponse += `🤖 **Especialista Invocado**: Roteando sub-tarefas com contratos estritos de entrada e saída.\n`;
      }

      simulatedResponse += `A arquitetura segue em total conformidade com o **DESIGN.md** e o **ICON_SYSTEM.md**, com tokens estritos, zero atrasos de interface e suporte responsivo completo.`;

      const completedThought = currentModel.hasThinking
        ? `Cadeia de pensamento concluída com sucesso:\n- Tokens avaliados sob janela de ${currentModel.contextWindow}\n- Modelo: ${currentModel.name}\n- Prompt de sistema aplicado: ${activeSession.systemPrompt || globalPrompt}`
        : undefined;

      setMessagesMap((prev) => ({
        ...prev,
        [activeSessionId]: (prev[activeSessionId] || []).map((m) =>
          m.id === aiMsgId
            ? {
                ...m,
                content: simulatedResponse,
                thought: completedThought,
                isGenerating: false,
              }
            : m
        ),
      }));
      setIsGenerating(false);
    }, 1200);
  };

  const handleStopGeneration = () => {
    setIsGenerating(false);
    setMessagesMap((prev) => ({
      ...prev,
      [activeSessionId]: (prev[activeSessionId] || []).map((m) =>
        m.isGenerating
          ? {
              ...m,
              content: m.content || "Geração interrompida pelo usuário.",
              isGenerating: false,
            }
          : m
      ),
    }));
  };

  const handleModelSelect = (model: ModelSpec) => {
    setCurrentModel(model);
    if (model.thinkingLevels && model.thinkingLevels.length > 0) {
      setCurrentThinkingLevel(model.thinkingLevels[model.thinkingLevels.length - 1].id);
    } else {
      setCurrentThinkingLevel("off");
    }
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
        activeFolderName={activeFolder.name}
      />

      {/* Janela Principal do Chat */}
      <div className="flex-1 flex flex-col h-full min-w-0 bg-[var(--cor-fundo)] relative">
        {/* Cabeçalho Superior */}
        <ChatHeader
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          currentModelId={currentModel.id}
          onSelectModel={handleModelSelect}
          onOpenSystemPrompt={() => setIsPromptModalOpen(true)}
          onOpenFolderManager={() => setIsFolderModalOpen(true)}
          onNewSession={handleNewSession}
          activeFolderName={activeFolder.name}
          hasCustomPrompt={Boolean(activeSession.systemPrompt)}
          isGenerating={isGenerating}
        />

        {/* Barra Gráfica de Raciocínio (Caso o modelo suporte) */}
        {currentModel.hasThinking && (
          <div className="px-4 py-2 bg-[var(--cor-superficie)]/40 border-b border-[var(--cor-borda)]/60">
            <div className="max-w-4xl mx-auto">
              <ReasoningLevelSelector
                model={currentModel}
                currentLevelId={currentThinkingLevel}
                onSelectLevel={setCurrentThinkingLevel}
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
    </div>
  );
}
