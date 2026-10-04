import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";

export interface AgentVisualMetadata {
	id: string;
	name: string;
	title: string;
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
}

export const PRESET_COLLAB_AGENTS: AgentVisualMetadata[] = [
	{
		id: "shark-lead",
		name: "Shark Lead Orchestrator",
		title: "Coordenador Estratégico",
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
	},
	{
		id: "theological-scholar",
		name: "Bible Strong Scholar",
		title: "Pesquisador Lexicográfico & Teológico",
		personality: {
			tone: "Acadêmico, reverente e profundo",
			traits: ["Erudição", "Rigor filológico", "Exegese"],
			catchphrase: "Investigando as raízes do Logos.",
		},
		surface: "capsule",
		colors: {
			body: "#D4AF37",
			eyes: "#2C2518",
			glow: "#F59E0B",
			accent: "#8A2BE2",
		},
		model: "gpt-4o / theology",
	},
	{
		id: "code-architect",
		name: "Code Architect",
		title: "Especialista em Engenharia & TypeScript",
		personality: {
			tone: "Técnico, rigoroso e refinado",
			traits: ["Precisão", "Sem alocações inúteis", "Bun APIs"],
			catchphrase: "Zero overhead, máxima elegância.",
		},
		surface: "cube",
		colors: {
			body: "#10B981",
			eyes: "#070B14",
			glow: "#059669",
			accent: "#00F0FF",
		},
		model: "claude-3-5-sonnet / engineering",
	},
	{
		id: "security-sentinel",
		name: "Security Sentinel",
		title: "Auditor de Segurança & Vulnerabilidades",
		personality: {
			tone: "Cético, vigilante e detalhista",
			traits: ["Inflexível", "Atenção a edge-cases", "OWASP"],
			catchphrase: "A desconfiança metódica é o primeiro escudo.",
		},
		surface: "cylinder",
		colors: {
			body: "#EF4444",
			eyes: "#111827",
			glow: "#DC2626",
			accent: "#F59E0B",
		},
		model: "claude-3-7-sonnet / auditor",
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
	agencyMode = "code",
}: BibleStrongAvatarViewProps): ReactNode {
	const [selectedAgentId, setSelectedAgentId] = useState(activeAgentId);
	const [expression, setExpression] = useState<"neutral" | "thinking" | "talking" | "alert">("neutral");
	const [blink, setBlink] = useState(1);
	const [breathY, setBreathY] = useState(0);
	const [headAngle, setHeadAngle] = useState(0);

	// Select active agent metadata
	const currentAgent = useMemo(() => {
		if (agencyMode === "bible") {
			return PRESET_COLLAB_AGENTS.find(a => a.id === "theological-scholar") ?? PRESET_COLLAB_AGENTS[1]!;
		}
		return PRESET_COLLAB_AGENTS.find(a => a.id === selectedAgentId) ?? PRESET_COLLAB_AGENTS[0]!;
	}, [selectedAgentId, agencyMode]);

	// Continuous Idle Breathing animation loop
	useEffect(() => {
		let animId: number;
		const startTime = performance.now();

		const loop = (now: number) => {
			const elapsed = (now - startTime) / 1000;
			const breath = Math.sin(elapsed * 2.5) * 3;
			setBreathY(breath);
			const rot = Math.sin(elapsed * 1.2) * 1.5;
			setHeadAngle(rot);
			animId = requestAnimationFrame(loop);
		};
		animId = requestAnimationFrame(loop);
		return () => cancelAnimationFrame(animId);
	}, []);

	// Natural Blinking Loop (every 3 to 6 seconds)
	useEffect(() => {
		let blinkTimer: number;

		const scheduleBlink = () => {
			const nextDelay = 2500 + Math.random() * 3500;
			blinkTimer = window.setTimeout(() => {
				setBlink(0.1);
				window.setTimeout(() => {
					setBlink(1);
					scheduleBlink();
				}, 160);
			}, nextDelay);
		};

		scheduleBlink();
		return () => clearTimeout(blinkTimer);
	}, []);

	// React in real time to streaming text (lipsync / talking motion)
	useEffect(() => {
		if (lastMessage && lastMessage.length > 0) {
			setExpression("talking");
			const timer = setTimeout(() => {
				setExpression(statusPhase === "thinking" ? "thinking" : "neutral");
			}, 1200);
			return () => clearTimeout(timer);
		} else if (statusPhase === "thinking") {
			setExpression("thinking");
		} else if (statusPhase === "error") {
			setExpression("alert");
		} else {
			setExpression("neutral");
		}
	}, [lastMessage, statusPhase]);

	// Geometry dimensions for surface
	const { rx, ry, cornerRadius } = useMemo(() => {
		switch (currentAgent.surface) {
			case "capsule":
				return { rx: 90, ry: 125, cornerRadius: 90 };
			case "cube":
				return { rx: 100, ry: 100, cornerRadius: 24 };
			case "diamond":
				return { rx: 105, ry: 110, cornerRadius: 65 };
			case "cylinder":
				return { rx: 95, ry: 110, cornerRadius: 40 };
			case "sphere":
			default:
				return { rx: 105, ry: 105, cornerRadius: 105 };
		}
	}, [currentAgent.surface]);

	// Eye metrics based on expression and blink
	const eyeMetrics = useMemo(() => {
		let width = 22;
		let height = 48 * blink;
		let leftY = -6;
		let rightY = -6;
		let leftRot = 0;
		let rightRot = 0;

		if (expression === "thinking") {
			height = 36 * blink;
			leftY = -12;
			rightY = -12;
			leftRot = 12;
			rightRot = 8;
		} else if (expression === "talking") {
			height = 54 * blink;
			leftY = -4;
			rightY = -4;
		} else if (expression === "alert") {
			width = 30;
			height = 60 * blink;
			leftY = 0;
			rightY = 0;
		}

		return { width, height, leftY, rightY, leftRot, rightRot };
	}, [expression, blink]);

	return (
		<div
			style={{
				display: "flex",
				flexDirection: "column",
				height: "100%",
				background: "var(--bg-shark-skin, #1A2235)",
				overflowY: "auto",
				padding: "16px",
				gap: "16px",
			}}
		>
			{/* Avatar Stage Header */}
			<div
				style={{
					display: "flex",
					alignItems: "center",
					justifyContent: "space-between",
					borderBottom: "1px solid var(--border, #2A3245)",
					paddingBottom: "10px",
				}}
			>
				<div>
					<div
						style={{
							fontFamily: "var(--font-title, 'Space Grotesk', sans-serif)",
							fontWeight: 700,
							fontSize: "0.95rem",
							color: "var(--neon-cyan, #00F0FF)",
							letterSpacing: "0.5px",
						}}
					>
						BIBLE STRONG AVATAR APP
					</div>
					<div style={{ fontSize: "0.75rem", color: "var(--text-muted, #94A3B8)" }}>
						Procedural SVG 3D Engine · @_smontlouis
					</div>
				</div>
				<span
					style={{
						fontSize: "0.7rem",
						fontWeight: 600,
						padding: "2px 8px",
						borderRadius: "999px",
						background:
							statusPhase === "error"
								? "rgba(239, 68, 68, 0.2)"
								: statusPhase === "thinking"
									? "rgba(245, 158, 11, 0.2)"
									: "rgba(16, 185, 129, 0.2)",
						color: statusPhase === "error" ? "#EF4444" : statusPhase === "thinking" ? "#F59E0B" : "#10B981",
						border: `1px solid ${statusPhase === "error" ? "#EF4444" : statusPhase === "thinking" ? "#F59E0B" : "#10B981"}`,
					}}
				>
					● {statusPhase.toUpperCase()}
				</span>
			</div>

			{/* Procedural Avatar Viewport */}
			<div
				style={{
					height: "280px",
					borderRadius: "14px",
					background: "radial-gradient(circle at center, #1B243B 0%, #0B0F19 85%)",
					border: "1px solid var(--border, #2A3245)",
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					position: "relative",
					overflow: "hidden",
					boxShadow: "inset 0 0 30px rgba(0,0,0,0.7)",
				}}
			>
				{/* Ambient Glow Aura */}
				<div
					style={{
						position: "absolute",
						width: "180px",
						height: "180px",
						borderRadius: "50%",
						background: currentAgent.colors.glow,
						filter: "blur(50px)",
						opacity: 0.25,
						pointerEvents: "none",
					}}
				/>

				{/* Procedural SVG Render */}
				<svg
					viewBox="-150 -150 300 300"
					width="230"
					height="230"
					role="img"
					aria-label={currentAgent.name}
					style={{
						transform: `translateY(${breathY}px) rotate(${headAngle}deg)`,
						transition: "transform 0.15s ease-out",
					}}
				>
					<defs>
						<filter id="avatar-glow-filter" x="-30%" y="-30%" width="160%" height="160%">
							<feDropShadow
								dx="0"
								dy="0"
								stdDeviation="8"
								floodColor={currentAgent.colors.glow}
								floodOpacity="0.5"
							/>
						</filter>
						<clipPath id="avatar-head-clip">
							<rect x={-rx} y={-ry} width={rx * 2} height={ry * 2} rx={cornerRadius} ry={cornerRadius} />
						</clipPath>
					</defs>

					{/* Primary Surface */}
					<rect
						x={-rx}
						y={-ry}
						width={rx * 2}
						height={ry * 2}
						rx={cornerRadius}
						ry={cornerRadius}
						fill={currentAgent.colors.body}
						filter="url(#avatar-glow-filter)"
					/>

					{/* Clipped Face & Eyes */}
					<g clipPath="url(#avatar-head-clip)">
						{/* Left Eye */}
						<ellipse
							cx="-22"
							cy={eyeMetrics.leftY}
							rx={eyeMetrics.width / 2}
							ry={eyeMetrics.height / 2}
							fill={currentAgent.colors.eyes}
							transform={`rotate(${eyeMetrics.leftRot} -22 ${eyeMetrics.leftY})`}
						/>
						{/* Right Eye */}
						<ellipse
							cx="22"
							cy={eyeMetrics.rightY}
							rx={eyeMetrics.width / 2}
							ry={eyeMetrics.height / 2}
							fill={currentAgent.colors.eyes}
							transform={`rotate(${eyeMetrics.rightRot} 22 ${eyeMetrics.rightY})`}
						/>
					</g>
				</svg>

				{/* Biometric Scan Line */}
				<div
					style={{
						position: "absolute",
						bottom: "8px",
						left: "12px",
						fontSize: "0.7rem",
						fontFamily: "var(--font-mono, monospace)",
						color: "var(--neon-cyan, #00F0FF)",
						opacity: 0.8,
					}}
				>
					SHAPE: {currentAgent.surface.toUpperCase()} // EXPR: {expression.toUpperCase()}
				</div>
			</div>

			{/* Agent Selector Chips */}
			<div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
				{PRESET_COLLAB_AGENTS.map(agent => (
					<button
						key={agent.id}
						type="button"
						onClick={() => setSelectedAgentId(agent.id)}
						style={{
							padding: "6px 10px",
							borderRadius: "6px",
							fontSize: "0.75rem",
							fontWeight: 600,
							background: selectedAgentId === agent.id ? "rgba(0, 240, 255, 0.15)" : "#151D2E",
							color: selectedAgentId === agent.id ? "var(--neon-cyan, #00F0FF)" : "var(--text-muted, #94A3B8)",
							border: `1px solid ${selectedAgentId === agent.id ? "var(--neon-cyan, #00F0FF)" : "var(--border, #2A3245)"}`,
							cursor: "pointer",
							transition: "all 0.2s ease",
						}}
					>
						{agent.name.split(" ")[0]}
					</button>
				))}
			</div>

			{/* Agent Identity & Metadata Card */}
			<div
				style={{
					background: "#151D2E",
					border: "1px solid var(--border, #2A3245)",
					borderRadius: "10px",
					padding: "14px",
					display: "flex",
					flexDirection: "column",
					gap: "8px",
				}}
			>
				<div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
					<span style={{ fontWeight: 700, fontSize: "0.95rem", color: "#FFFFFF" }}>{currentAgent.name}</span>
					<span style={{ fontSize: "0.75rem", color: "var(--neon-cyan, #00F0FF)", fontFamily: "monospace" }}>
						@{currentAgent.id}
					</span>
				</div>

				<div style={{ fontSize: "0.8rem", color: "var(--text-muted, #94A3B8)" }}>{currentAgent.title}</div>

				<div
					style={{
						fontSize: "0.8rem",
						background: "rgba(0,0,0,0.25)",
						padding: "8px 10px",
						borderRadius: "6px",
						borderLeft: `3px solid ${currentAgent.colors.body}`,
					}}
				>
					<span style={{ fontWeight: 600, color: "#E2E8F0" }}>Tom:</span> {currentAgent.personality.tone}
					<br />
					<span style={{ fontWeight: 600, color: "#E2E8F0" }}>Traços:</span>{" "}
					{currentAgent.personality.traits.join(", ")}
				</div>

				{currentAgent.personality.catchphrase && (
					<div style={{ fontSize: "0.75rem", fontStyle: "italic", color: "var(--aged-gold, #D4AF37)" }}>
						"{currentAgent.personality.catchphrase}"
					</div>
				)}

				<div
					style={{
						fontSize: "0.72rem",
						color: "var(--text-muted, #94A3B8)",
						fontFamily: "monospace",
						borderTop: "1px solid rgba(255,255,255,0.06)",
						paddingTop: "6px",
					}}
				>
					MODEL: {currentAgent.model}
				</div>
			</div>
		</div>
	);
}
