import type {
	AgentProfile,
	AvatarAccessoryType,
	AvatarArmsPosition,
	AvatarClothingType,
	AvatarColorsDefinition,
	AvatarDefinition,
	AvatarEyebrowsType,
	AvatarFullBodyDefinition,
	AvatarPostureType,
	AvatarStanceType,
	AvatarStyleType,
	HexColor,
	SurfaceType,
} from "./types";

export interface InterpretVisualInput {
	role?: string;
	title?: string;
	tone?: string;
	description?: string;
	traits?: string[];
	category?: string;
	surface?: SurfaceType;
	colors?: Partial<AvatarColorsDefinition>;
}

export interface InterpretedVisualOutput {
	surface: SurfaceType;
	colors: AvatarColorsDefinition;
	fullBody: AvatarFullBodyDefinition;
	expressionMood: string;
}

/**
 * Interprets an agent's personality, role, tone and description into a coherent visual profile,
 * posture, clothing, accessories and body language.
 */
export function interpretVisualProfile(input: InterpretVisualInput): InterpretedVisualOutput {
	const rawText = [
		input.role ?? "",
		input.title ?? "",
		input.tone ?? "",
		input.description ?? "",
		...(input.traits ?? []),
		input.category ?? "",
	].join(" ");

	const text = rawText
		.toLowerCase()
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "");

	// 1. Determine Surface Geometry
	let surface: SurfaceType = input.surface ?? "sphere";
	if (!input.surface) {
		if (
			text.includes("cube") ||
			text.includes("arquitet") ||
			text.includes("engenheir") ||
			text.includes("typescript") ||
			text.includes("codigo") ||
			text.includes("code")
		) {
			surface = "cube";
		} else if (
			text.includes("teolog") ||
			text.includes("scholar") ||
			text.includes("professor") ||
			text.includes("bibli") ||
			text.includes("medic") ||
			text.includes("filosofo")
		) {
			surface = "capsule";
		} else if (
			text.includes("seguranc") ||
			text.includes("sentinel") ||
			text.includes("auditor") ||
			text.includes("critic") ||
			text.includes("defes") ||
			text.includes("blind")
		) {
			surface = "cylinder";
		} else if (
			text.includes("diaman") ||
			text.includes("analis") ||
			text.includes("dados") ||
			text.includes("matematic") ||
			text.includes("quantic") ||
			text.includes("precis")
		) {
			surface = "diamond";
		} else if (text.includes("foco") || text.includes("laser") || text.includes("raio") || text.includes("direto")) {
			surface = "cone";
		} else if (
			text.includes("divertid") ||
			text.includes("criativ") ||
			text.includes("mickey") ||
			text.includes("jogo")
		) {
			surface = "mickey";
		} else {
			surface = "sphere";
		}
	}

	// 2. Determine Color Palette
	let bodyColor: HexColor = "#00F0FF";
	let eyesColor: HexColor = "#0B0F19";
	let glowColor: HexColor = "#00F0FF";
	let accentColor: HexColor = "#8A2BE2";

	if (
		text.includes("seguranc") ||
		text.includes("critic") ||
		text.includes("auditor") ||
		text.includes("alerta") ||
		text.includes("defes")
	) {
		bodyColor = "#EF4444";
		eyesColor = "#111827";
		glowColor = "#EF4444";
		accentColor = "#FF5500";
	} else if (
		text.includes("arquitet") ||
		text.includes("engenheir") ||
		text.includes("typescript") ||
		text.includes("desenvolvedor")
	) {
		bodyColor = "#10B981";
		eyesColor = "#0B0F19";
		glowColor = "#10B981";
		accentColor = "#00E5FF";
	} else if (
		text.includes("teolog") ||
		text.includes("scholar") ||
		text.includes("professor") ||
		text.includes("filosofo") ||
		text.includes("histor")
	) {
		bodyColor = "#D4AF37";
		eyesColor = "#2C2518";
		glowColor = "#D4AF37";
		accentColor = "#8A2BE2";
	} else if (
		text.includes("matematic") ||
		text.includes("cientis") ||
		text.includes("quantic") ||
		text.includes("fisic")
	) {
		bodyColor = "#3B82F6";
		eyesColor = "#070D1F";
		glowColor = "#60A5FA";
		accentColor = "#00E5FF";
	} else if (text.includes("criativ") || text.includes("arte") || text.includes("design") || text.includes("poet")) {
		bodyColor = "#EC4899";
		eyesColor = "#180816";
		glowColor = "#F472B6";
		accentColor = "#FACC15";
	}

	if (input.colors?.body) bodyColor = input.colors.body;
	if (input.colors?.eyes) eyesColor = input.colors.eyes;
	if (input.colors?.glow) glowColor = input.colors.glow;
	if (input.colors?.accent) accentColor = input.colors.accent;

	// 3. Determine Style and Clothing
	let style: AvatarStyleType = "futuristic";
	let clothing: AvatarClothingType = "suit";
	const accessories: AvatarAccessoryType[] = [];

	if (text.includes("professor") || text.includes("teolog") || text.includes("scholar") || text.includes("filosofo")) {
		style = "scholar";
		clothing = "robe";
		accessories.push("glasses");
		if (text.includes("teolog") || text.includes("sagrad")) {
			accessories.push("halo");
		}
	} else if (text.includes("cientis") || text.includes("pesquisad") || text.includes("laborat")) {
		style = "scientific";
		clothing = "lab_coat";
		accessories.push("hud_visor");
	} else if (
		text.includes("seguranc") ||
		text.includes("militar") ||
		text.includes("tatic") ||
		text.includes("defes")
	) {
		style = "tactical";
		clothing = "armor";
		accessories.push("badge", "wrist_gauntlet");
	} else if (
		text.includes("executiv") ||
		text.includes("negoci") ||
		text.includes("corporat") ||
		text.includes("gestor")
	) {
		style = "corporate";
		clothing = "suit";
		accessories.push("badge");
	} else if (text.includes("cyber") || text.includes("hacker") || text.includes("rede") || text.includes("sistemas")) {
		style = "cyber";
		clothing = "hoodie";
		accessories.push("hud_visor");
	} else if (text.includes("arquitet") || text.includes("engenheir")) {
		style = "minimalist";
		clothing = "suit";
		accessories.push("hud_visor");
	} else if (text.includes("lider") || text.includes("orquestrad") || text.includes("coordena")) {
		style = "futuristic";
		clothing = "armor";
		accessories.push("hud_visor", "halo");
	} else {
		style = "casual";
		clothing = "vest";
	}

	// 4. Determine Posture, Limbs and Stance based on personality & tone
	let posture: AvatarPostureType = "upright";
	let armsPosition: AvatarArmsPosition = "neutral";
	let stance: AvatarStanceType = "solid";
	let eyebrows: AvatarEyebrowsType = "neutral";
	let moodLabel = "Equilíbrio & Prontidão";

	const isSerious =
		text.includes("seri") ||
		text.includes("rigoros") ||
		text.includes("tecnic") ||
		text.includes("precis") ||
		text.includes("focad");
	const isVigilant =
		text.includes("cetic") || text.includes("vigilant") || text.includes("seguranc") || text.includes("auditor");
	const isWarm =
		text.includes("pacient") ||
		text.includes("acolhedor") ||
		text.includes("calm") ||
		text.includes("professor") ||
		text.includes("gentil");
	const isDynamic =
		text.includes("divertid") ||
		text.includes("descontraido") ||
		text.includes("irreverent") ||
		text.includes("agil") ||
		text.includes("veloz");
	const isLeader =
		text.includes("lider") || text.includes("orquestrad") || text.includes("confiant") || text.includes("estrategic");
	const isScholar =
		style === "scholar" ||
		text.includes("scholar") ||
		text.includes("teolog") ||
		text.includes("academico") ||
		text.includes("reverent");

	if (isVigilant) {
		posture = "tactical";
		armsPosition = "ready";
		stance = "solid";
		eyebrows = "focused";
		moodLabel = "Vigilância Inflexível & Ceticismo Metódico";
	} else if (isScholar) {
		posture = "scholarly";
		armsPosition = "hands_joined";
		stance = "solid";
		eyebrows = "serene";
		moodLabel = "Erudição Filológica & Reverência ao Logos";
	} else if (isSerious) {
		posture = "upright";
		armsPosition = "folded";
		stance = "solid";
		eyebrows = "focused";
		moodLabel = "Rigor Técnico & Concentração Cirúrgica";
	} else if (isWarm) {
		posture = "scholarly";
		armsPosition = "hands_joined";
		stance = "relaxed";
		eyebrows = "serene";
		moodLabel = "Serenidade Pedagógica & Acolhimento";
	} else if (isDynamic) {
		posture = "relaxed";
		armsPosition = "gesturing";
		stance = "relaxed";
		eyebrows = "raised";
		moodLabel = "Criatividade Descontraída & Ritmo Ágil";
	} else if (isLeader) {
		posture = "confident";
		armsPosition = "ready";
		stance = "floating";
		eyebrows = "determined";
		moodLabel = "Comando Estratégico & Presença Soberana";
	}

	const fullBody: AvatarFullBodyDefinition = {
		style,
		clothing,
		clothingColor: (style === "scholar" ? "#2A2016" : style === "tactical" ? "#1A1010" : "#111827") as HexColor,
		accentColor,
		accessories: accessories.length > 0 ? accessories : ["none"],
		posture,
		limbs: {
			armsPosition,
			stance,
		},
		faceDetails: {
			eyebrows,
			mouth: isWarm ? "subtle_smile" : isSerious || isVigilant ? "firm" : "neutral",
		},
		interpretedMood: moodLabel,
	};

	return {
		surface,
		colors: {
			body: bodyColor,
			eyes: eyesColor,
			glow: glowColor,
			accent: accentColor,
		},
		fullBody,
		expressionMood: moodLabel,
	};
}

/**
 * Extracts key specifications from a natural language prompt and compiles a complete,
 * production-ready AgentProfile with fully customized full-body Bible Strong Avatar.
 */
export function interpretAgentFromNaturalLanguage(prompt: string): AgentProfile {
	const trimmed = prompt.trim();
	const lower = trimmed
		.toLowerCase()
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "");

	// Extract Title / Name
	let name = "Novo Agente Especialista";
	let title = "Especialista Inteligente";
	let role = "Especialista";
	let category: AgentProfile["structure"]["category"] = "specialist";

	if (lower.includes("professor") || lower.includes("instrutor") || lower.includes("mentor")) {
		name = "Professor Mentor";
		title = "Educador & Mentor Pedagógico";
		role = "Mentor e Educador";
		category = "scholar";
	} else if (lower.includes("seguranc") || lower.includes("sentinel") || lower.includes("auditor")) {
		name = "Guardião de Segurança";
		title = "Auditor de Vulnerabilidades";
		role = "Auditor de Segurança";
		category = "critic";
	} else if (lower.includes("arquiteto") || lower.includes("engenheiro") || lower.includes("desenvolvedor")) {
		name = "Engenheiro de Sistemas";
		title = "Arquiteto de Software & Código";
		role = "Engenheiro de Implementação";
		category = "specialist";
	} else if (lower.includes("lider") || lower.includes("orquestrador") || lower.includes("coordenador")) {
		name = "Coordenador Estratégico";
		title = "Líder de Missão & Orquestrador";
		role = "Líder e Orquestrador";
		category = "orchestrator";
	} else if (lower.includes("pesquisador") || lower.includes("cientista") || lower.includes("filosofo")) {
		name = "Pesquisador Científico";
		title = "Investigador Analítico";
		role = "Pesquisador";
		category = "scholar";
	}

	// Try extracting specific names like "Quero um agente chamado X" or "Crie o agente Y"
	const nameMatch = prompt.match(
		/(?:chamado|nome(?: de)?|intitulado|agente)\s+["']?([A-ZÀ-Úa-zà-ú0-9\s-]+?)["']?(?:,|\.|\s+que|\s+com|$)/i,
	);
	if (nameMatch && nameMatch[1] && nameMatch[1].trim().length > 2 && nameMatch[1].trim().length < 40) {
		const extracted = nameMatch[1].trim();
		if (!extracted.toLowerCase().startsWith("que ") && !extracted.toLowerCase().startsWith("um ")) {
			name = extracted;
		}
	}

	// Determine Personality Traits and Tone
	const traits: string[] = [];
	let tone = "Objetivo, focado e resolutivo";

	if (lower.includes("paciente")) {
		traits.push("Paciência extrema", "Didática clara");
		tone = "Paciente, acolhedor e encorajador";
	}
	if (lower.includes("serio") || lower.includes("formal")) {
		traits.push("Seriedade", "Rigor profissional");
		tone = "Sério, analítico e técnico";
	}
	if (lower.includes("divertido") || lower.includes("descontraido") || lower.includes("irreverente")) {
		traits.push("Descontração", "Humor inteligente", "Agilidade");
		tone = "Descontraído, criativo e vibrante";
	}
	if (lower.includes("confiante") || lower.includes("seguro")) {
		traits.push("Autoconfiança", "Decisão rápida");
	}
	if (lower.includes("pratico") || lower.includes("exemplos")) {
		traits.push("Pragmatismo", "Exemplos do mundo real");
	}
	if (traits.length === 0) {
		traits.push("Precisão", "Clareza", "Eficiência");
	}

	// Tools
	const functions: string[] = ["read", "write", "bash"];
	if (
		lower.includes("codigo") ||
		lower.includes("programacao") ||
		lower.includes("software") ||
		category === "specialist"
	) {
		functions.push("edit", "lsp", "grep", "glob");
	}
	if (lower.includes("pesquisa") || lower.includes("web") || lower.includes("artigos") || category === "scholar") {
		functions.push("grep", "web_search");
	}
	if (category === "orchestrator") {
		functions.push("task", "hub", "todo", "grep", "glob");
	}

	// Generate clean slug ID
	const id =
		name
			.toLowerCase()
			.normalize("NFD")
			.replace(/[\u0300-\u036f]/g, "")
			.replace(/[^a-z0-9]+/g, "-")
			.replace(/^-+|-+$/g, "") || `agent-${Date.now().toString(36)}`;

	// Visual Interpretation
	const visual = interpretVisualProfile({
		role,
		title,
		tone,
		description: trimmed,
		traits,
		category,
	});

	const avatar: AvatarDefinition = {
		schema: "bible-strong/avatar-definition",
		schemaVersion: 1,
		name: `${name} Avatar`,
		body: {
			primary: {
				type: visual.surface,
				width: 240,
				height: 240,
				depth: 240,
				roundness: 1,
			},
			nodes: [],
		},
		colors: visual.colors,
		expressions: {
			neutral: {
				head: { x: 0, y: 0, z: 0 },
				eyes: {
					left: { width: 22, height: 48, x: 0, y: -2, angle: 0 },
					right: { width: 22, height: 48, x: 0, y: -2, angle: 0 },
					spacing: 42,
				},
				perspective: 1,
				motion: { eyes: "microSaccades", body: "slowDrift" },
			},
			thinking: {
				head: { x: -6, y: 10, z: -8 },
				eyes: {
					left: { width: 20, height: 40, x: 2, y: -8, angle: 8 },
					right: { width: 24, height: 46, x: 2, y: -8, angle: 6 },
					spacing: 44,
				},
				perspective: 1,
				motion: { eyes: "none", body: "slowDrift" },
			},
			talking: {
				head: { x: 2, y: -2, z: 2 },
				eyes: {
					left: { width: 24, height: 50, x: 0, y: -1, angle: -2 },
					right: { width: 24, height: 50, x: 0, y: -1, angle: 2 },
					spacing: 40,
				},
				perspective: 1,
				motion: { eyes: "microSaccades", body: "shake" },
			},
		},
		expressionOrder: ["neutral", "thinking", "talking"],
		animations: {
			idle: {
				playbackMode: "loop",
				steps: [
					{ expression: "neutral", holdMs: 2500, transitionMs: 600, transition: "smooth" },
					{ expression: "thinking", holdMs: 1200, transitionMs: 500, transition: "smooth" },
					{ expression: "neutral", holdMs: 2000, transitionMs: 500, transition: "smooth" },
				],
				blink: {
					enabled: true,
					initialDelayMs: 2000,
					minIntervalMs: 2800,
					maxIntervalMs: 5800,
					durationMs: 160,
				},
			},
		},
		animationOrder: ["idle"],
		fullBody: visual.fullBody,
	};

	const now = new Date().toISOString();

	return {
		id,
		name,
		title,
		description: trimmed,
		systemPrompt: `Você é ${name}, atuando como ${title}. ${trimmed}\nDiretriz primordial: Mantenha sempre seu tom ${tone} e priorize soluções claras, robustas e verificáveis.`,
		personality: {
			tone,
			traits,
			style: "Direto ao ponto, com embasamento técnico e exemplos práticos",
			catchphrase: `Excelência em ${title.toLowerCase()}.`,
			behaviorRules: [
				"Nunca assumir fatos sem validação empírica",
				"Responder com clareza cristalina e estrutura elegante",
			],
		},
		functions,
		models: {
			primary: {
				model: "default",
				thinkingLevel: "high",
			},
		},
		fallbacks: {
			models: ["smol", "slow"],
			strategy: "fallback-model",
		},
		structure: {
			role,
			category,
			outputFormat: category === "specialist" ? "code" : "markdown",
		},
		avatar,
		createdAt: now,
		updatedAt: now,
	};
}
