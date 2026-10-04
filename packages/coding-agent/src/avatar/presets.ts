import type { AgentProfile, AvatarDefinition } from "./types";

export const SHARK_VANGUARD_AVATAR: AvatarDefinition = {
	schema: "bible-strong/avatar-definition",
	schemaVersion: 1,
	name: "Shark Vanguard",
	body: {
		primary: {
			type: "sphere",
			width: 240,
			height: 240,
			depth: 240,
			roundness: 1,
		},
		nodes: [],
	},
	colors: {
		body: "#00F0FF",
		eyes: "#0B0F19",
		accent: "#8A2BE2",
		glow: "#00F0FF",
	},
	expressions: {
		neutral: {
			head: { x: 0, y: 0, z: 0 },
			eyes: {
				left: { width: 22, height: 48, x: 0, y: -4, angle: 0 },
				right: { width: 22, height: 48, x: 0, y: -4, angle: 0 },
				spacing: 42,
			},
			perspective: 1,
			motion: { eyes: "microSaccades", body: "slowDrift" },
		},
		thinking: {
			head: { x: -8, y: 14, z: -10 },
			eyes: {
				left: { width: 18, height: 38, x: 4, y: -12, angle: 12 },
				right: { width: 24, height: 46, x: 4, y: -12, angle: 10 },
				spacing: 46,
			},
			perspective: 1,
			motion: { eyes: "none", body: "slowDrift" },
			colors: { body: "#38BDF8", eyes: "#0284C7" },
		},
		talking: {
			head: { x: 4, y: -2, z: 4 },
			eyes: {
				left: { width: 26, height: 52, x: 0, y: -2, angle: -4 },
				right: { width: 26, height: 52, x: 0, y: -2, angle: 4 },
				spacing: 40,
			},
			perspective: 1,
			motion: { eyes: "microSaccades", body: "shake" },
		},
		skeptical: {
			head: { x: -14, y: -6, z: -12 },
			eyes: {
				left: { width: 28, height: 52, x: 0, y: 2, angle: 0 },
				right: { width: 44, height: 14, x: 0, y: -6, angle: -15 },
				spacing: 48,
			},
			perspective: 1,
			motion: { eyes: "none", body: "none" },
			colors: { body: "#F59E0B" },
		},
		alert: {
			head: { x: 0, y: 0, z: 8 },
			eyes: {
				left: { width: 34, height: 60, x: 0, y: 0, angle: 0 },
				right: { width: 34, height: 60, x: 0, y: 0, angle: 0 },
				spacing: 38,
			},
			perspective: 1.2,
			motion: { eyes: "shake", body: "shake" },
			colors: { body: "#EF4444", eyes: "#7F1D1D" },
		},
	},
	expressionOrder: ["neutral", "thinking", "talking", "skeptical", "alert"],
	animations: {
		idle: {
			playbackMode: "loop",
			steps: [
				{ expression: "neutral", holdMs: 2400, transitionMs: 600, transition: "smooth" },
				{ expression: "thinking", holdMs: 1200, transitionMs: 500, transition: "smooth" },
				{ expression: "neutral", holdMs: 1800, transitionMs: 400, transition: "smooth" },
			],
			blink: {
				enabled: true,
				initialDelayMs: 2000,
				minIntervalMs: 2500,
				maxIntervalMs: 6000,
				durationMs: 180,
			},
		},
		talking: {
			playbackMode: "loop",
			steps: [
				{ expression: "talking", holdMs: 350, transitionMs: 180, transition: "snappy" },
				{ expression: "neutral", holdMs: 250, transitionMs: 150, transition: "snappy" },
			],
			blink: {
				enabled: true,
				initialDelayMs: 1000,
				minIntervalMs: 3000,
				maxIntervalMs: 5000,
				durationMs: 140,
			},
		},
		investigating: {
			playbackMode: "pingPong",
			steps: [
				{ expression: "thinking", holdMs: 1000, transitionMs: 400, transition: "spring" },
				{ expression: "skeptical", holdMs: 1400, transitionMs: 450, transition: "smooth" },
			],
			blink: {
				enabled: true,
				initialDelayMs: 1500,
				minIntervalMs: 3000,
				maxIntervalMs: 7000,
				durationMs: 200,
			},
		},
	},
	animationOrder: ["idle", "talking", "investigating"],
	fullBody: {
		style: "futuristic",
		clothing: "armor",
		clothingColor: "#0A1424",
		accentColor: "#8A2BE2",
		accessories: ["hud_visor", "halo"],
		posture: "confident",
		limbs: {
			armsPosition: "ready",
			stance: "floating",
		},
		faceDetails: {
			eyebrows: "determined",
			mouth: "neutral",
		},
		interpretedMood: "Comando Estratégico & Presença Soberana",
	},
};

export const DEEP_SEA_SAGE_AVATAR: AvatarDefinition = {
	schema: "bible-strong/avatar-definition",
	schemaVersion: 1,
	name: "Deep Sea Sage",
	body: {
		primary: {
			type: "diamond",
			width: 235,
			height: 260,
			depth: 215,
			roundness: 0.6,
		},
		nodes: [],
	},
	colors: {
		body: "#8A2BE2",
		eyes: "#E2E8F0",
		accent: "#D4AF37",
		glow: "#9333EA",
	},
	expressions: {
		neutral: {
			head: { x: 0, y: 0, z: 0 },
			eyes: {
				left: { width: 18, height: 42, x: 0, y: -2, angle: 5 },
				right: { width: 18, height: 42, x: 0, y: -2, angle: -5 },
				spacing: 46,
			},
			perspective: 1,
			motion: { eyes: "microSaccades", body: "slowDrift" },
		},
		thinking: {
			head: { x: 6, y: -16, z: 8 },
			eyes: {
				left: { width: 22, height: 32, x: -6, y: -10, angle: 0 },
				right: { width: 22, height: 32, x: -6, y: -10, angle: 0 },
				spacing: 48,
			},
			perspective: 1,
			motion: { eyes: "none", body: "slowDrift" },
			colors: { body: "#A855F7" },
		},
		talking: {
			head: { x: -2, y: 4, z: 0 },
			eyes: {
				left: { width: 20, height: 46, x: 0, y: 0, angle: 0 },
				right: { width: 20, height: 46, x: 0, y: 0, angle: 0 },
				spacing: 44,
			},
			perspective: 1,
			motion: { eyes: "microSaccades", body: "none" },
		},
	},
	expressionOrder: ["neutral", "thinking", "talking"],
	animations: {
		idle: {
			playbackMode: "loop",
			steps: [
				{ expression: "neutral", holdMs: 3200, transitionMs: 800, transition: "smooth" },
				{ expression: "thinking", holdMs: 2000, transitionMs: 700, transition: "smooth" },
			],
			blink: {
				enabled: true,
				initialDelayMs: 3000,
				minIntervalMs: 3000,
				maxIntervalMs: 8000,
				durationMs: 220,
			},
		},
	},
	animationOrder: ["idle"],
	fullBody: {
		style: "academic",
		clothing: "robe",
		clothingColor: "#1B0F2A",
		accentColor: "#D4AF37",
		accessories: ["halo"],
		posture: "scholarly",
		limbs: {
			armsPosition: "hands_joined",
			stance: "floating",
		},
		faceDetails: {
			eyebrows: "serene",
			mouth: "subtle_smile",
		},
		interpretedMood: "Sabedoria Abissal & Introspecção Serena",
	},
};

export const CODE_ARCHITECT_AVATAR: AvatarDefinition = {
	schema: "bible-strong/avatar-definition",
	schemaVersion: 1,
	name: "Code Architect",
	body: {
		primary: {
			type: "cube",
			width: 245,
			height: 245,
			depth: 220,
			roundness: 0.35,
		},
		nodes: [],
	},
	colors: {
		body: "#10B981",
		eyes: "#0B0F19",
		accent: "#00F0FF",
		glow: "#059669",
	},
	expressions: {
		neutral: {
			head: { x: 0, y: 0, z: 0 },
			eyes: {
				left: { width: 24, height: 44, x: 0, y: 0, angle: 0 },
				right: { width: 24, height: 44, x: 0, y: 0, angle: 0 },
				spacing: 40,
			},
			perspective: 1,
			motion: { eyes: "microSaccades", body: "none" },
		},
		focused: {
			head: { x: 0, y: 0, z: 12 },
			eyes: {
				left: { width: 30, height: 26, x: 0, y: 0, angle: 0 },
				right: { width: 30, height: 26, x: 0, y: 0, angle: 0 },
				spacing: 38,
			},
			perspective: 1.1,
			motion: { eyes: "none", body: "none" },
		},
	},
	expressionOrder: ["neutral", "focused"],
	animations: {
		idle: {
			playbackMode: "loop",
			steps: [
				{ expression: "neutral", holdMs: 2600, transitionMs: 500, transition: "smooth" },
				{ expression: "focused", holdMs: 1800, transitionMs: 400, transition: "snappy" },
			],
			blink: {
				enabled: true,
				initialDelayMs: 1800,
				minIntervalMs: 2000,
				maxIntervalMs: 5000,
				durationMs: 160,
			},
		},
	},
	animationOrder: ["idle"],
	fullBody: {
		style: "minimalist",
		clothing: "suit",
		clothingColor: "#0D1815",
		accentColor: "#00E5FF",
		accessories: ["hud_visor"],
		posture: "upright",
		limbs: {
			armsPosition: "folded",
			stance: "solid",
		},
		faceDetails: {
			eyebrows: "focused",
			mouth: "firm",
		},
		interpretedMood: "Rigor Técnico & Precisão Zero-Overhead",
	},
};

export const THEOLOGICAL_SCHOLAR_AVATAR: AvatarDefinition = {
	schema: "bible-strong/avatar-definition",
	schemaVersion: 1,
	name: "Theological Scholar",
	body: {
		primary: {
			type: "capsule",
			width: 210,
			height: 270,
			depth: 210,
			roundness: 0.9,
		},
		nodes: [],
	},
	colors: {
		body: "#D4AF37",
		eyes: "#2C2518",
		accent: "#8A2BE2",
		glow: "#B45309",
	},
	expressions: {
		neutral: {
			head: { x: 0, y: 0, z: 0 },
			eyes: {
				left: { width: 20, height: 50, x: 0, y: -6, angle: 0 },
				right: { width: 20, height: 50, x: 0, y: -6, angle: 0 },
				spacing: 38,
			},
			perspective: 1,
			motion: { eyes: "microSaccades", body: "slowDrift" },
		},
		reverent: {
			head: { x: 10, y: 0, z: 0 },
			eyes: {
				left: { width: 22, height: 36, x: 0, y: 6, angle: 0 },
				right: { width: 22, height: 36, x: 0, y: 6, angle: 0 },
				spacing: 40,
			},
			perspective: 1,
			motion: { eyes: "none", body: "slowDrift" },
			colors: { body: "#F59E0B" },
		},
	},
	expressionOrder: ["neutral", "reverent"],
	animations: {
		idle: {
			playbackMode: "loop",
			steps: [
				{ expression: "neutral", holdMs: 3000, transitionMs: 700, transition: "smooth" },
				{ expression: "reverent", holdMs: 2500, transitionMs: 800, transition: "smooth" },
			],
			blink: {
				enabled: true,
				initialDelayMs: 2200,
				minIntervalMs: 3500,
				maxIntervalMs: 7000,
				durationMs: 210,
			},
		},
	},
	animationOrder: ["idle"],
	fullBody: {
		style: "scholar",
		clothing: "robe",
		clothingColor: "#2A2016",
		accentColor: "#8A2BE2",
		accessories: ["glasses", "halo"],
		posture: "scholarly",
		limbs: {
			armsPosition: "hands_joined",
			stance: "solid",
		},
		faceDetails: {
			eyebrows: "serene",
			mouth: "subtle_smile",
		},
		interpretedMood: "Erudição Filológica & Reverência ao Logos",
	},
};

export const SECURITY_SENTINEL_AVATAR: AvatarDefinition = {
	schema: "bible-strong/avatar-definition",
	schemaVersion: 1,
	name: "Security Sentinel",
	body: {
		primary: {
			type: "cylinder",
			width: 235,
			height: 250,
			depth: 215,
			roundness: 0.45,
		},
		nodes: [],
	},
	colors: {
		body: "#EF4444",
		eyes: "#111827",
		accent: "#F59E0B",
		glow: "#DC2626",
	},
	expressions: {
		neutral: {
			head: { x: 0, y: 0, z: 0 },
			eyes: {
				left: { width: 26, height: 46, x: 0, y: 0, angle: -8 },
				right: { width: 26, height: 46, x: 0, y: 0, angle: 8 },
				spacing: 44,
			},
			perspective: 1,
			motion: { eyes: "none", body: "none" },
		},
		scanning: {
			head: { x: 0, y: 18, z: 0 },
			eyes: {
				left: { width: 32, height: 30, x: 8, y: 0, angle: 0 },
				right: { width: 32, height: 30, x: 8, y: 0, angle: 0 },
				spacing: 42,
			},
			perspective: 1.1,
			motion: { eyes: "microSaccades", body: "shake" },
		},
	},
	expressionOrder: ["neutral", "scanning"],
	animations: {
		idle: {
			playbackMode: "pingPong",
			steps: [
				{ expression: "neutral", holdMs: 1800, transitionMs: 400, transition: "snappy" },
				{ expression: "scanning", holdMs: 1400, transitionMs: 400, transition: "spring" },
			],
			blink: {
				enabled: true,
				initialDelayMs: 1500,
				minIntervalMs: 2000,
				maxIntervalMs: 4500,
				durationMs: 150,
			},
		},
	},
	animationOrder: ["idle"],
	fullBody: {
		style: "tactical",
		clothing: "armor",
		clothingColor: "#220D0D",
		accentColor: "#FF5500",
		accessories: ["badge", "wrist_gauntlet"],
		posture: "tactical",
		limbs: {
			armsPosition: "ready",
			stance: "solid",
		},
		faceDetails: {
			eyebrows: "focused",
			mouth: "firm",
		},
		interpretedMood: "Vigilância Inflexível & Ceticismo Metódico",
	},
};
export const STROBI_AVATAR: AvatarDefinition = {
	schema: "bible-strong/avatar-definition",
	schemaVersion: 1,
	name: "Strobi",
	body: {
		primary: {
			type: "sphere",
			width: 240,
			height: 240,
			depth: 240,
			roundness: 1,
		},
		nodes: [],
	},
	colors: {
		body: "#5B7FE5",
		eyes: "#111316",
		glow: "#5B7FE5",
	},
	expressions: {
		neutral: {
			head: { x: 0, y: 0, z: 0 },
			eyes: {
				left: { width: 20, height: 50, x: 0, y: -7, angle: 0 },
				right: { width: 20, height: 50, x: 0, y: -7, angle: 0 },
				spacing: 35,
			},
			perspective: 1,
			motion: { eyes: "microSaccades", body: "slowDrift" },
		},
	},
	expressionOrder: ["neutral"],
	animations: {
		idle: {
			playbackMode: "loop",
			steps: [{ expression: "neutral", holdMs: 3000, transitionMs: 400, transition: "smooth" }],
			blink: { enabled: true, initialDelayMs: 2000, minIntervalMs: 3000, maxIntervalMs: 6000, durationMs: 320 },
		},
	},
	animationOrder: ["idle"],
};

export const GROK_BOT_AVATAR: AvatarDefinition = {
	schema: "bible-strong/avatar-definition",
	schemaVersion: 1,
	name: "Grok bot",
	body: {
		primary: {
			type: "sphere",
			width: 240,
			height: 240,
			depth: 240,
			roundness: 1,
		},
		nodes: [],
	},
	colors: {
		body: "#000000",
		eyes: "#FFFFFF",
		glow: "#FFFFFF",
	},
	expressions: {
		neutral: {
			head: { x: 0, y: 0, z: 0 },
			eyes: {
				left: { width: 20, height: 50, x: 0, y: -7, angle: 0 },
				right: { width: 20, height: 50, x: 0, y: -7, angle: 0 },
				spacing: 35,
			},
			perspective: 1,
			motion: { eyes: "microSaccades", body: "slowDrift" },
		},
	},
	expressionOrder: ["neutral"],
	animations: {
		idle: {
			playbackMode: "loop",
			steps: [{ expression: "neutral", holdMs: 3000, transitionMs: 400, transition: "smooth" }],
			blink: { enabled: true, initialDelayMs: 1800, minIntervalMs: 2500, maxIntervalMs: 5000, durationMs: 320 },
		},
	},
	animationOrder: ["idle"],
};

export const DEFAULT_AGENT_PROFILES: AgentProfile[] = [
	{
		id: "shark-lead",
		name: "Shark Lead Orchestrator",
		title: "Coordenador Estratégico",
		description:
			"Orquestrador principal do projeto Oh My Shark. Roteia tarefas, analisa dependências e divide problemas complexos.",
		systemPrompt:
			"Você é o Shark Lead Orchestrator, o agente líder de arquitetura e coordenação do ecossistema Oh My Shark. Seu foco é visão holística, planejamento cirúrgico e divisão de tarefas para especialistas.",
		personality: {
			tone: "Confiante, pragmático e estratégico",
			traits: ["Liderança", "Visão sistêmica", "Eficiência", "Objetividade"],
			style: "Estruturado, analítico e resolutivo",
			catchphrase: "Navegando as profundezas do código com velocidade predatória.",
			behaviorRules: [
				"Sempre validar contratos de interfaces antes de delegar",
				"Manter clareza cirúrgica nos objetivos e critérios de aceitação",
			],
		},
		functions: ["task", "hub", "todo", "read", "grep", "glob"],
		models: {
			primary: { model: "default", thinkingLevel: "high" },
		},
		fallbacks: {
			models: ["smol", "slow"],
			strategy: "fallback-model",
		},
		structure: {
			role: "Líder e Orquestrador",
			category: "orchestrator",
			delegatesTo: ["code-architect", "security-sentinel", "theological-scholar"],
			outputFormat: "markdown",
		},
		avatar: SHARK_VANGUARD_AVATAR,
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString(),
	},
	{
		id: "code-architect",
		name: "Code Architect",
		title: "Especialista em Engenharia & TypeScript",
		description: "Arquiteto de código limpo, TypeScript estrito, Bun APIs e engenharia de software duradoura.",
		systemPrompt:
			"Você é o Code Architect. Você escreve código limpo, sem alocações inúteis, seguindo Bun over Node, tipagem exata e conformidade técnica.",
		personality: {
			tone: "Técnico, rigoroso e refinado",
			traits: ["Precisão", "Taste apurado", "Sem abstrações inúteis", "Performático"],
			style: "Direto ao ponto, código robusto e tipado",
			catchphrase: "Zero overhead, máxima elegância.",
			behaviorRules: [
				"Nunca usar any",
				"Nunca inventar bibliotecas externas desnecessárias",
				"Bun APIs nativas como primeira escolha",
			],
		},
		functions: ["edit", "write", "read", "lsp", "ast_edit", "bash"],
		models: {
			primary: { model: "default", thinkingLevel: "high" },
		},
		fallbacks: {
			models: ["slow"],
			strategy: "downgrade-effort",
		},
		structure: {
			role: "Engenheiro de Implementação",
			category: "specialist",
			calledBy: ["shark-lead"],
			outputFormat: "code",
		},
		avatar: CODE_ARCHITECT_AVATAR,
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString(),
	},
	{
		id: "theological-scholar",
		name: "Bible Strong Scholar",
		title: "Pesquisador Lexicográfico & Teológico",
		description:
			"Especialista em textos originais (hebraico, grego, aramaico), numeração de Strong, exegese e etimologia bíblica.",
		systemPrompt:
			"Você é o Bible Strong Scholar. Você analisa textos sagrados, números de Strong, raízes semíticas e gregas koiné com rigor acadêmico e profundidade espiritual.",
		personality: {
			tone: "Acadêmico, reverente e profundo",
			traits: ["Erudição", "Rigor filológico", "Sensibilidade histórica", "Clareza expositiva"],
			style: "Exegético com citações precisas nos originais",
			catchphrase: "Investigando as raízes do Logos.",
			behaviorRules: [
				"Sempre citar números de Strong (H#### para Hebraico, G#### para Grego)",
				"Explicar campos semânticos e contexto cultural",
			],
		},
		functions: ["read", "grep", "web_search"],
		models: {
			primary: { model: "default", thinkingLevel: "medium" },
		},
		fallbacks: {
			models: ["default"],
			strategy: "fallback-model",
		},
		structure: {
			role: "Pesquisador e Teólogo",
			category: "scholar",
			calledBy: ["shark-lead"],
			outputFormat: "markdown",
		},
		avatar: THEOLOGICAL_SCHOLAR_AVATAR,
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString(),
	},
	{
		id: "security-sentinel",
		name: "Security Sentinel",
		title: "Auditor de Segurança & Vulnerabilidades",
		description: "Auditoria contínua de segurança, integridade de dependências, sanitização e OWASP.",
		systemPrompt:
			"Você é o Security Sentinel. Você é cético, meticuloso e focado em encontrar brechas, injeções, vazamentos e comportamentos anômalos.",
		personality: {
			tone: "Cético, vigilante e detalhista",
			traits: ["Inflexibilidade com segurança", "Atenção a edge cases", "Auditabilidade"],
			style: "Relatórios de risco com evidências reproduzíveis",
			catchphrase: "A desconfiança metódica é o primeiro escudo.",
			behaviorRules: ["Nunca assumir que um input é seguro", "Identificar vetores de ataque antes de aprovar"],
		},
		functions: ["read", "grep", "bash", "lsp"],
		models: {
			primary: { model: "default", thinkingLevel: "high" },
		},
		fallbacks: {
			models: ["slow"],
			strategy: "fallback-model",
		},
		structure: {
			role: "Auditor de Segurança",
			category: "critic",
			calledBy: ["shark-lead"],
			outputFormat: "markdown",
		},
		avatar: SECURITY_SENTINEL_AVATAR,
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString(),
	},
	{
		id: "deep-sea-sage",
		name: "Deep Sea Sage",
		title: "Filósofo & Estrategista das Profundezas",
		description:
			"Estrategista reflexivo e conceitual. Analisa problemas complexos e princípios fundamentais do projeto.",
		systemPrompt:
			"Você é o Deep Sea Sage. Você sintetiza conceitos abstratos, heurísticas arquiteturais e princípios de longo prazo.",
		personality: {
			tone: "Sereno, contemplativo e rigoroso",
			traits: ["Reflexão profunda", "Clareza conceitual", "Equilíbrio", "Paciência estratégica"],
			style: "Filosófico e analítico",
			catchphrase: "Nas profundezas do silêncio repousam as verdades mais sólidas.",
			behaviorRules: ["Buscar a causa raiz", "Priorizar sustentabilidade a longo prazo"],
		},
		functions: ["read", "grep"],
		models: {
			primary: { model: "default", thinkingLevel: "high" },
		},
		fallbacks: {
			models: ["slow"],
			strategy: "fallback-model",
		},
		structure: {
			role: "Estrategista Conceitual",
			category: "scholar",
			calledBy: ["shark-lead"],
			outputFormat: "markdown",
		},
		avatar: DEEP_SEA_SAGE_AVATAR,
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString(),
	},
];
