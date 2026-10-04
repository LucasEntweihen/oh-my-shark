import type { ReactNode } from "react";
import { useEffect, useMemo, useRef, useState } from "react";

export type AvatarRenderMode = "vector" | "dots" | "pixel";

export interface AgentVisualMetadata {
	id: string;
	name: string;
	title: string;
	strongRef?: string;
	personality: {
		tone: string;
		traits: string[];
		catchphrase?: string;
	};
	surface: "sphere" | "cube" | "diamond" | "capsule" | "cylinder" | "cone";
	colors: {
		body: string;
		eyes: string;
		glow: string;
		accent: string;
	};
	model: string;
	contextHint: string;
}

export const PRESET_COLLAB_AGENTS: AgentVisualMetadata[] = [
	{
		id: "shark-lead",
		name: "Shark Lead Orchestrator",
		title: "Coordenador Estratégico",
		strongRef: "H5057 (Nagid - Líder/Príncipe) / G2233 (Hegeomai - Governar com visão)",
		personality: {
			tone: "Confiante, pragmático e estratégico",
			traits: ["Liderança", "Visão sistêmica", "Predatório"],
			catchphrase: "Navegando as profundezas do código com velocidade predatória.",
		},
		surface: "sphere",
		colors: {
			body: "#00F0FF",
			eyes: "#0B0F19",
			glow: "#00F0FF",
			accent: "#8A2BE2",
		},
		model: "claude-3-7-sonnet / thinking",
		contextHint: "Planejamento arquitetural, divisão de tarefas e coordenação geral.",
	},
	{
		id: "code-architect",
		name: "Code Architect",
		title: "Especialista em Engenharia & TypeScript",
		strongRef: "H2796 (Charash - Artífice/Mestre de Obras) / G753 (Architekton - Arquiteto sábio)",
		personality: {
			tone: "Técnico, rigoroso e refinado",
			traits: ["Precisão", "Taste apurado", "Sem overhead"],
			catchphrase: "Zero overhead, máxima elegância.",
		},
		surface: "cube",
		colors: {
			body: "#10B981",
			eyes: "#0B0F19",
			glow: "#10B981",
			accent: "#34D399",
		},
		model: "claude-3-7-sonnet / Bun Native",
		contextHint: "Implementação cirúrgica, tipagem estrita, performance e Bun APIs.",
	},
	{
		id: "theological-scholar",
		name: "Bible Strong Scholar",
		title: "Pesquisador Lexicográfico & Teológico",
		strongRef: "H2450 (Chakam - Sábio erudito) / G3056 (Logos - Palavra viva/Razão divina)",
		personality: {
			tone: "Acadêmico, reverente e profundo",
			traits: ["Erudição", "Rigor filológico", "Exegese"],
			catchphrase: "Investigando as raízes do Logos.",
		},
		surface: "capsule",
		colors: {
			body: "#D4AF37",
			eyes: "#2C2518",
			glow: "#D4AF37",
			accent: "#F3E5AB",
		},
		model: "claude-3-7-sonnet / Scholar",
		contextHint: "Análise de textos sagrados, raízes hebraicas/gregas e números de Strong.",
	},
	{
		id: "security-sentinel",
		name: "Security Sentinel",
		title: "Auditor de Segurança & Vulnerabilidades",
		strongRef: "H8104 (Shamar - Guardar/Vigiar atentamente) / G1127 (Gregoreo - Estar vigilante)",
		personality: {
			tone: "Cético, vigilante e detalhista",
			traits: ["Inflexível", "Auditoria contínua", "Ceticismo metódico"],
			catchphrase: "A desconfiança metódica é o primeiro escudo.",
		},
		surface: "cylinder",
		colors: {
			body: "#EF4444",
			eyes: "#111827",
			glow: "#EF4444",
			accent: "#FCA5A5",
		},
		model: "claude-3-7-sonnet / SecAudit",
		contextHint: "Auditoria de brechas, validação de inputs e segurança defensiva.",
	},
	{
		id: "deep-sea-sage",
		name: "Deep Sea Sage",
		title: "Filósofo & Estrategista das Profundezas",
		strongRef: "H8415 (Tehom - Abismo profundo) / G899 (Bathos - Profundidade insondável)",
		personality: {
			tone: "Sereno, contemplativo e profundo",
			traits: ["Reflexão profunda", "Equilíbrio", "Paciência"],
			catchphrase: "Nas profundezas do silêncio repousam as verdades mais sólidas.",
		},
		surface: "diamond",
		colors: {
			body: "#8B5CF6",
			eyes: "#1E1B4B",
			glow: "#8B5CF6",
			accent: "#C4B5FD",
		},
		model: "claude-3-7-sonnet / High Thinking",
		contextHint: "Heurísticas abstratas, clareza conceitual e visão de longo prazo.",
	},
	{
		id: "grok-bot",
		name: "Grok Bot (Original)",
		title: "Protótipo GrokBot Clássico",
		strongRef: "GrokBot 25 Calibrated States",
		personality: {
			tone: "Curioso, ágil e expressivo",
			traits: ["Dots System", "Morphe Dinâmico", "Minimalista"],
			catchphrase: "Expressão viva através de geometria e pontos.",
		},
		surface: "sphere",
		colors: {
			body: "#000000",
			eyes: "#FFFFFF",
			glow: "#FFFFFF",
			accent: "#60A5FA",
		},
		model: "Grok Engine / Avatar Lab",
		contextHint: "Estilo original com fundo preto e anéis de pontos monocromáticos.",
	},
	{
		id: "strobi",
		name: "Strobi (Avatar Lab)",
		title: "Mascote Procedural Canônico",
		strongRef: "Bible Strong Avatar Lab",
		personality: {
			tone: "Amigável, procedural e dinâmico",
			traits: ["Superelipsóide", "3D Canônico", "Azul Elétrico"],
			catchphrase: "O avatar procedural original.",
		},
		surface: "sphere",
		colors: {
			body: "#5B7FE5",
			eyes: "#111316",
			glow: "#5B7FE5",
			accent: "#93C5FD",
		},
		model: "Avatar Lab Core v1",
		contextHint: "Configuração de referência do Bible Strong Avatar Lab.",
	},
];

export interface BibleStrongAvatarViewProps {
	lastMessage?: string;
	ttsEnabled?: boolean;
	statusPhase?: string;
	activeAgentId?: string;
	agencyMode?: "code" | "research" | "bible";
}

export function BibleStrongAvatarView({
	lastMessage,
	statusPhase = "idle",
	activeAgentId = "shark-lead",
}: BibleStrongAvatarViewProps): ReactNode {
	const [selectedAgentId, setSelectedAgentId] = useState(activeAgentId);
	const [renderMode, setRenderMode] = useState<AvatarRenderMode>("vector");
	const [expression, setExpression] = useState<"neutral" | "thinking" | "talking" | "alert" | "curious">("neutral");
	const [blink, setBlink] = useState(1);
	const [breathY, setBreathY] = useState(0);
	const [headAngle, setHeadAngle] = useState(0);
	const [turnAngle, setTurnAngle] = useState(0);
	const [gazeX, setGazeX] = useState(0);
	const [gazeY, _setGazeY] = useState(0);

	const canvasRef = useRef<HTMLCanvasElement | null>(null);

	const currentAgent = useMemo(() => {
		const found = PRESET_COLLAB_AGENTS.find(a => a.id === selectedAgentId);
		return found ?? PRESET_COLLAB_AGENTS[0]!;
	}, [selectedAgentId]);

	// Breathing cycle loop (idle natural motion)
	useEffect(() => {
		let frameId: number;
		const start = performance.now();
		const loop = (now: number) => {
			const elapsed = (now - start) / 1000;
			const y = Math.sin(elapsed * 2.2) * 3;
			const angle = Math.sin(elapsed * 1.5) * 1.5;
			setBreathY(y);
			setHeadAngle(angle);
			frameId = requestAnimationFrame(loop);
		};
		frameId = requestAnimationFrame(loop);
		return () => cancelAnimationFrame(frameId);
	}, []);

	// Autonomous blinking scheduler (every 2.8 to 5.5s)
	useEffect(() => {
		let timeoutId: ReturnType<typeof setTimeout>;
		const scheduleBlink = () => {
			const nextDelay = 2800 + Math.random() * 2700;
			timeoutId = setTimeout(() => {
				setBlink(0.05);
				setTimeout(() => {
					setBlink(1);
					scheduleBlink();
				}, 160);
			}, nextDelay);
		};
		scheduleBlink();
		return () => clearTimeout(timeoutId);
	}, []);

	// React to incoming message streaming
	useEffect(() => {
		if (statusPhase === "thinking") {
			setExpression("thinking");
			setTurnAngle(8);
		} else if (statusPhase === "running" || (lastMessage && lastMessage.length > 0)) {
			setExpression("talking");
			setTurnAngle(Math.sin(Date.now() / 400) * 4);
		} else {
			setExpression("neutral");
			setTurnAngle(0);
		}
	}, [lastMessage, statusPhase]);

	// Pixel mode Canvas renderer
	useEffect(() => {
		if (renderMode !== "pixel" || !canvasRef.current) return;
		const canvas = canvasRef.current;
		const ctx = canvas.getContext("2d");
		if (!ctx) return;

		const res = 72;
		canvas.width = res;
		canvas.height = res;
		ctx.imageSmoothingEnabled = false;
		ctx.clearRect(0, 0, res, res);

		// Draw body
		ctx.fillStyle = currentAgent.colors.body;
		if (currentAgent.surface === "cube") {
			ctx.fillRect(14, 14, res - 28, res - 28);
		} else if (currentAgent.surface === "diamond") {
			ctx.beginPath();
			ctx.moveTo(res / 2, 8);
			ctx.lineTo(res - 8, res / 2);
			ctx.lineTo(res / 2, res - 8);
			ctx.lineTo(8, res / 2);
			ctx.closePath();
			ctx.fill();
		} else {
			ctx.beginPath();
			ctx.arc(res / 2, res / 2, res / 2 - 10, 0, Math.PI * 2);
			ctx.fill();
		}

		// Draw eyes
		ctx.fillStyle = currentAgent.colors.eyes;
		const eyeH = Math.max(1, Math.round(12 * blink));
		const leftX = Math.round(res / 2 - 10 + gazeX * 0.2);
		const rightX = Math.round(res / 2 + 6 + gazeX * 0.2);
		const eyeY = Math.round(res / 2 - 4 + gazeY * 0.2);

		ctx.fillRect(leftX, eyeY - Math.round(eyeH / 2), 4, eyeH);
		ctx.fillRect(rightX, eyeY - Math.round(eyeH / 2), 4, eyeH);
	}, [renderMode, currentAgent, blink, gazeX, gazeY]);

	// Geometric parameters for SVG surface & eyes
	const { headSvgPath, eyeWidth, eyeHeight, eyeSpacing } = useMemo(() => {
		const s = currentAgent.surface;
		let path = "";
		if (s === "cube") {
			path = "M -95,-95 L 95,-95 L 95,95 L -95,95 Z";
		} else if (s === "capsule") {
			path = "M -75,-105 C -75,-125 75,-125 75,-105 L 75,105 C 75,125 -75,125 -75,105 Z";
		} else if (s === "cylinder") {
			path = "M -85,-100 L 85,-100 L 85,100 L -85,100 Z";
		} else if (s === "diamond") {
			path = "M 0,-115 L 115,0 L 0,115 L -115,0 Z";
		} else if (s === "cone") {
			path = "M 0,-115 L 105,105 L -105,105 Z";
		} else {
			// sphere / mickey: perfect canonical 120 radius superellipsoid
			path =
				"M 0,-115 C 63,-115 115,-63 115,0 C 115,63 63,115 0,115 C -63,115 -115,63 -115,0 C -115,-63 -63,-115 0,-115 Z";
		}

		let ew = 20;
		let eh = 48;
		let esp = 42;
		if (expression === "thinking") {
			ew = 18;
			eh = 40;
			esp = 44;
		} else if (expression === "alert") {
			ew = 24;
			eh = 54;
			esp = 38;
		} else if (expression === "curious") {
			ew = 22;
			eh = 44;
			esp = 46;
		}

		return {
			headSvgPath: path,
			eyeWidth: ew,
			eyeHeight: Math.max(3, eh * blink),
			eyeSpacing: esp,
		};
	}, [currentAgent.surface, expression, blink]);

	// Grok-style dots along eye rings
	const grokDots = useMemo(() => {
		if (renderMode !== "dots") return { left: [], right: [] };
		const numDots = 24;
		const halfSp = eyeSpacing / 2;
		const rx = eyeWidth / 2;
		const ry = eyeHeight / 2;
		const left = [];
		const right = [];

		for (let i = 0; i < numDots; i++) {
			const theta = (i / numDots) * Math.PI * 2;
			const lx = -halfSp + gazeX + rx * Math.cos(theta);
			const ly = gazeY + ry * Math.sin(theta);
			left.push({ cx: lx, cy: ly });

			const rxPos = halfSp + gazeX + rx * Math.cos(theta);
			const ryPos = gazeY + ry * Math.sin(theta);
			right.push({ cx: rxPos, cy: ryPos });
		}
		return { left, right };
	}, [renderMode, eyeSpacing, eyeWidth, eyeHeight, gazeX, gazeY]);

	return (
		<div
			style={{
				display: "flex",
				flexDirection: "column",
				height: "100%",
				background: "var(--bg-shark-skin, #0B0F19)",
				color: "#F3F4F6",
				overflowY: "auto",
				padding: "16px",
				gap: "14px",
				fontFamily: "var(--font-sans, system-ui, sans-serif)",
			}}
		>
			{/* Header bar */}
			<div
				style={{
					display: "flex",
					alignItems: "center",
					justifyContent: "space-between",
					borderBottom: "1px solid #1E293B",
					paddingBottom: "12px",
				}}
			>
				<div>
					<div
						style={{
							fontFamily: "monospace",
							fontWeight: 700,
							fontSize: "0.95rem",
							color: currentAgent.colors.body,
							letterSpacing: "0.08em",
						}}
					>
						BIBLE STRONG AVATAR LAB
					</div>
					<div style={{ fontSize: "0.75rem", color: "#94A3B8" }}>
						Procedural 3D & Grok Dots Engine · 100% Original Parity
					</div>
				</div>

				<div style={{ display: "flex", gap: "6px" }}>
					{(["vector", "dots", "pixel"] as AvatarRenderMode[]).map(mode => (
						<button
							key={mode}
							type="button"
							onClick={() => setRenderMode(mode)}
							style={{
								padding: "4px 8px",
								fontSize: "0.72rem",
								fontWeight: 600,
								borderRadius: "6px",
								border: `1px solid ${renderMode === mode ? currentAgent.colors.body : "#334155"}`,
								background: renderMode === mode ? currentAgent.colors.body : "#1E293B",
								color: renderMode === mode ? "#0B0F19" : "#E2E8F0",
								cursor: "pointer",
								textTransform: "uppercase",
								transition: "all 0.15s ease",
							}}
						>
							{mode}
						</button>
					))}
				</div>
			</div>

			{/* Main Avatar Viewport Stage */}
			<div
				style={{
					height: "280px",
					borderRadius: "14px",
					background: "radial-gradient(circle at center, #131B2E 0%, #080C14 90%)",
					border: `1px solid ${currentAgent.colors.body}33`,
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					position: "relative",
					overflow: "hidden",
					boxShadow: `0 0 35px ${currentAgent.colors.glow}20`,
				}}
			>
				{/* Ambient Glow Aura */}
				<div
					style={{
						position: "absolute",
						width: "200px",
						height: "200px",
						borderRadius: "50%",
						background: currentAgent.colors.glow,
						filter: "blur(55px)",
						opacity: 0.22,
						pointerEvents: "none",
					}}
				/>

				{renderMode === "pixel" ? (
					<canvas
						ref={canvasRef}
						style={{
							width: "210px",
							height: "210px",
							imageRendering: "pixelated",
							transform: `translateY(${breathY}px) rotate(${headAngle + turnAngle}deg)`,
						}}
					/>
				) : (
					<svg
						viewBox="-150 -150 300 300"
						width="230"
						height="230"
						role="img"
						aria-label={currentAgent.name}
						style={{
							transform: `translateY(${breathY}px) rotate(${headAngle + turnAngle}deg)`,
							transition: "transform 0.12s ease-out",
						}}
					>
						<defs>
							<clipPath id="collab-avatar-head-clip">
								<path d={headSvgPath} />
							</clipPath>
						</defs>

						{/* Primary 3D Head Body */}
						<path d={headSvgPath} fill={currentAgent.colors.body} style={{ transition: "fill 0.25s ease" }} />

						{/* Eye Plane clipped to head */}
						<g clipPath="url(#collab-avatar-head-clip)">
							{renderMode === "dots" ? (
								<g fill={currentAgent.colors.eyes}>
									{grokDots.left.map((dot, idx) => (
										<circle key={`l-${idx}`} cx={dot.cx} cy={dot.cy} r="2.2" />
									))}
									{grokDots.right.map((dot, idx) => (
										<circle key={`r-${idx}`} cx={dot.cx} cy={dot.cy} r="2.2" />
									))}
								</g>
							) : (
								<g fill={currentAgent.colors.eyes}>
									{/* Left eye */}
									<rect
										x={-eyeSpacing / 2 - eyeWidth / 2 + gazeX}
										y={-eyeHeight / 2 + gazeY}
										width={eyeWidth}
										height={eyeHeight}
										rx={eyeWidth / 2}
										ry={Math.min(eyeHeight / 2, eyeWidth / 2)}
									/>
									{/* Right eye */}
									<rect
										x={eyeSpacing / 2 - eyeWidth / 2 + gazeX}
										y={-eyeHeight / 2 + gazeY}
										width={eyeWidth}
										height={eyeHeight}
										rx={eyeWidth / 2}
										ry={Math.min(eyeHeight / 2, eyeWidth / 2)}
									/>
								</g>
							)}
						</g>
					</svg>
				)}

				{/* Active State badge in viewport */}
				<div
					style={{
						position: "absolute",
						bottom: "10px",
						left: "12px",
						display: "flex",
						gap: "8px",
						alignItems: "center",
					}}
				>
					<span
						style={{
							fontSize: "0.68rem",
							fontFamily: "monospace",
							padding: "2px 8px",
							borderRadius: "999px",
							background: "rgba(0,0,0,0.6)",
							border: "1px solid #334155",
							color: currentAgent.colors.body,
						}}
					>
						SURFACE: {currentAgent.surface.toUpperCase()}
					</span>
					<span
						style={{
							fontSize: "0.68rem",
							fontFamily: "monospace",
							padding: "2px 8px",
							borderRadius: "999px",
							background: "rgba(0,0,0,0.6)",
							border: "1px solid #334155",
							color: "#94A3B8",
						}}
					>
						STATE: {expression.toUpperCase()}
					</span>
				</div>
			</div>

			{/* Interactive Controls Bar: Expressions & Micro-Rotations */}
			<div
				style={{
					display: "flex",
					gap: "6px",
					flexWrap: "wrap",
					alignItems: "center",
					justifyContent: "space-between",
					background: "#111827",
					padding: "8px 12px",
					borderRadius: "8px",
					border: "1px solid #1F2937",
				}}
			>
				<div style={{ display: "flex", gap: "5px" }}>
					{(["neutral", "thinking", "alert", "curious"] as const).map(expr => (
						<button
							key={expr}
							type="button"
							onClick={() => setExpression(expr)}
							style={{
								padding: "3px 8px",
								fontSize: "0.7rem",
								borderRadius: "4px",
								border: "1px solid #374151",
								background: expression === expr ? "#374151" : "transparent",
								color: expression === expr ? "#F9FAFB" : "#9CA3AF",
								cursor: "pointer",
							}}
						>
							{expr}
						</button>
					))}
				</div>

				<div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
					<button
						type="button"
						onClick={() => {
							setBlink(0.05);
							setTimeout(() => setBlink(1), 160);
						}}
						style={{
							padding: "3px 8px",
							fontSize: "0.7rem",
							borderRadius: "4px",
							border: "1px solid #374151",
							background: "#1F2937",
							color: "#D1D5DB",
							cursor: "pointer",
						}}
					>
						Piscar
					</button>
					<button
						type="button"
						onClick={() => {
							setTurnAngle(turnAngle === 0 ? 18 : 0);
							setGazeX(gazeX === 0 ? 8 : 0);
						}}
						style={{
							padding: "3px 8px",
							fontSize: "0.7rem",
							borderRadius: "4px",
							border: "1px solid #374151",
							background: "#1F2937",
							color: "#D1D5DB",
							cursor: "pointer",
						}}
					>
						Giro 3D
					</button>
				</div>
			</div>

			{/* Agent Selector Carousel / Cards */}
			<div>
				<div
					style={{
						fontSize: "0.75rem",
						fontWeight: 600,
						color: "#94A3B8",
						marginBottom: "8px",
						textTransform: "uppercase",
						letterSpacing: "0.05em",
					}}
				>
					Equipe de Agentes (Seleção Manual por Contexto)
				</div>
				<div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "8px" }}>
					{PRESET_COLLAB_AGENTS.map(agent => {
						const isSelected = agent.id === selectedAgentId;
						return (
							<div
								key={agent.id}
								onClick={() => setSelectedAgentId(agent.id)}
								style={{
									display: "flex",
									alignItems: "center",
									gap: "12px",
									padding: "10px 12px",
									borderRadius: "8px",
									border: `1px solid ${isSelected ? agent.colors.body : "#1F2937"}`,
									background: isSelected ? `${agent.colors.body}14` : "#111827",
									cursor: "pointer",
									transition: "all 0.15s ease",
								}}
							>
								{/* Mini color circle */}
								<div
									style={{
										width: "16px",
										height: "16px",
										borderRadius: agent.surface === "cube" ? "3px" : "50%",
										background: agent.colors.body,
										boxShadow: isSelected ? `0 0 10px ${agent.colors.glow}` : "none",
										flexShrink: 0,
									}}
								/>
								<div style={{ flex: 1, minWidth: 0 }}>
									<div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
										<span
											style={{
												fontWeight: 700,
												fontSize: "0.85rem",
												color: isSelected ? agent.colors.body : "#F3F4F6",
											}}
										>
											@{agent.id}
										</span>
										<span style={{ fontSize: "0.72rem", color: "#9CA3AF" }}>· {agent.title}</span>
									</div>
									<div
										style={{
											fontSize: "0.72rem",
											color: "#64748B",
											marginTop: "2px",
											whiteSpace: "nowrap",
											overflow: "hidden",
											textOverflow: "ellipsis",
										}}
									>
										Contexto ideal: {agent.contextHint}
									</div>
									{agent.strongRef && (
										<div
											style={{
												fontSize: "0.68rem",
												fontFamily: "monospace",
												color: "#D4AF37",
												marginTop: "2px",
											}}
										>
											Strong: {agent.strongRef}
										</div>
									)}
								</div>
							</div>
						);
					})}
				</div>
			</div>
		</div>
	);
}
