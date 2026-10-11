export interface ModelSpec {
  id: string;
  name: string;
  provider: "Anthropic" | "OpenAI" | "Google" | "Meta" | "DeepSeek";
  description: string;
  badge?: string;
  contextWindow: string;
  hasThinking: boolean;
  thinkingLevels?: Array<{
    id: "off" | "low" | "medium" | "high";
    label: string;
    description: string;
    bars: number;
  }>;
}

export const AVAILABLE_MODELS: ModelSpec[] = [
  {
    id: "claude-3-7-sonnet",
    name: "Claude 3.7 Sonnet",
    provider: "Anthropic",
    description: "Modelo híbrido de ponta com raciocínio adaptativo contínuo e síntese de código avançada.",
    badge: "Recomendado",
    contextWindow: "200k tokens",
    hasThinking: true,
    thinkingLevels: [
      { id: "off", label: "Desligado", description: "Respostas diretas e velozes sem reflexão", bars: 1 },
      { id: "low", label: "Rápido (Low)", description: "Reflexão mínima e checagens pontuais", bars: 2 },
      { id: "medium", label: "Padrão (Medium)", description: "Raciocínio analítico estruturado equilibrado", bars: 3 },
      { id: "high", label: "Máximo (High)", description: "Profundidade máxima de cadeia de pensamento", bars: 4 },
    ],
  },
  {
    id: "claude-3-5-sonnet",
    name: "Claude 3.5 Sonnet",
    provider: "Anthropic",
    description: "Referência absoluta para engenharia de software rápida, sem enrolação e com tipagem refinada.",
    contextWindow: "200k tokens",
    hasThinking: false,
  },
  {
    id: "gpt-4o",
    name: "GPT-4o Omnimodel",
    provider: "OpenAI",
    description: "Modelo multimodal com latência ultra baixa e raciocínio conversacional geral.",
    contextWindow: "128k tokens",
    hasThinking: false,
  },
  {
    id: "o3-mini",
    name: "OpenAI o3-mini",
    provider: "OpenAI",
    description: "Especialista em matemática, algoritmos e dedução lógica com raciocínio configurável.",
    badge: "Raciocínio Ágil",
    contextWindow: "128k tokens",
    hasThinking: true,
    thinkingLevels: [
      { id: "low", label: "Baixo", description: "Poucos segundos de inferência lógica", bars: 2 },
      { id: "medium", label: "Médio", description: "Equilíbrio padrão de inferência de teste", bars: 3 },
      { id: "high", label: "Alto", description: "Exploração profunda de invariantes e contra-exemplos", bars: 4 },
    ],
  },
  {
    id: "gemini-2-5-pro",
    name: "Gemini 2.5 Pro",
    provider: "Google",
    description: "Janela de contexto titânica de 2M tokens e raciocínio profundo multimodal.",
    badge: "2M Context",
    contextWindow: "2.000k tokens",
    hasThinking: true,
    thinkingLevels: [
      { id: "off", label: "Direto", description: "Sem latência de raciocínio intermediário", bars: 1 },
      { id: "high", label: "Profundo", description: "Thinking orquestrado para problemas massivos", bars: 4 },
    ],
  },
  {
    id: "deepseek-r1",
    name: "DeepSeek R1",
    provider: "DeepSeek",
    description: "Modelo de raciocínio aberto com cadeias transparentes de dedução matemática e código.",
    badge: "Open Reasoning",
    contextWindow: "64k tokens",
    hasThinking: true,
    thinkingLevels: [
      { id: "high", label: "Completo", description: "Cadeia de pensamento total nativa", bars: 4 },
    ],
  },
];
