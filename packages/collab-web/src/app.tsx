import type { ReactNode } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AgentDrawer } from "./components/agents/AgentDrawer";
import { AgentsPanel } from "./components/agents/AgentsPanel";
import { Banners } from "./components/shell/Banners";
import { Composer } from "./components/shell/Composer";
import { ConnectScreen } from "./components/shell/ConnectScreen";
import { HeaderBar } from "./components/shell/HeaderBar";
import { SharkViewer } from "./components/shark/SharkViewer";
import { Toasts } from "./components/shell/Toasts";
import { Transcript } from "./components/transcript/Transcript";
import { GuestClient } from "./lib/client";
import { useGuestSnapshot } from "./lib/use-guest";
import type { ToolRenderHost } from "./tool-render";
import "./components/shell/shell.css";

const NAME_KEY = "omp.collab.name";

interface Creds {
	link: string;
	name: string;
}

function storedName(): string {
	try {
		return localStorage.getItem(NAME_KEY) ?? "guest";
	} catch {
		return "guest";
	}
}

/** Deep link = everything after the FIRST `#` (legacy links carry a second `#` inside the fragment). */
function hashLink(): string | null {
	const href = window.location.href;
	const i = href.indexOf("#");
	if (i < 0 || i + 1 >= href.length) return null;
	return href.slice(i + 1);
}

export function App(): ReactNode {
	const [client, setClient] = useState<GuestClient | null>(null);
	const [connectError, setConnectError] = useState<string | null>(null);
	const credsRef = useRef<Creds | null>(null);

	const connect = useCallback((link: string, name: string): void => {
		let next: GuestClient;
		try {
			next = new GuestClient(link, name);
		} catch (err) {
			setConnectError(err instanceof Error ? err.message : String(err));
			return;
		}
		next.connect();
		try {
			localStorage.setItem(NAME_KEY, name);
		} catch {
			// storage unavailable (private mode) — non-fatal
		}
		credsRef.current = { link, name };
		window.location.hash = link;
		setConnectError(null);
		setClient(prev => {
			prev?.close();
			return next;
		});
	}, []);

	const leave = useCallback((): void => {
		setClient(prev => {
			prev?.close();
			return null;
		});
		history.replaceState(null, "", window.location.pathname + window.location.search);
	}, []);

	const rejoin = useCallback((): void => {
		const creds = credsRef.current;
		if (creds) connect(creds.link, creds.name);
	}, [connect]);

	// Visual Viewport: adjust app height to fit screen space when mobile keyboard opens.
	useEffect(() => {
		const vv = window.visualViewport;
		if (!vv) return;

		const updateHeight = () => {
			document.documentElement.style.setProperty("--viewport-height", `${vv.height}px`);
			window.scrollTo(0, 0);
		};

		updateHeight();
		vv.addEventListener("resize", updateHeight);
		vv.addEventListener("scroll", updateHeight);

		return () => {
			vv.removeEventListener("resize", updateHeight);
			vv.removeEventListener("scroll", updateHeight);
		};
	}, []);

	// Deep link: a page load with a hash auto-connects.
	useEffect(() => {
		const link = hashLink();
		if (link) connect(link, storedName());
	}, [connect]);

	useEffect(() => {
		if (!client) document.title = "omp collab";
	}, [client]);

	if (!client) {
		return <ConnectScreen defaultName={storedName()} error={connectError} onConnect={connect} />;
	}
	return <Session client={client} onLeave={leave} onRejoin={rejoin} />;
}

interface SessionProps {
	client: GuestClient;
	onLeave(): void;
	onRejoin(): void;
}

function Session({ client, onLeave, onRejoin }: SessionProps): ReactNode {
	const snap = useGuestSnapshot(client);
	const [railOpen, setRailOpen] = useState(false);
	const [sharkOpen, setSharkOpen] = useState(true);
	const [ttsEnabled, setTtsEnabled] = useState(false);
	const [selectedId, setSelectedId] = useState<string | null>(null);
	const autoOpenedRef = useRef(false);

	const subCount = useMemo(() => snap.agents.filter(a => a.kind === "sub").length, [snap.agents]);

	// Task-card agent chips drill into the same drawer the rail uses.
	const agentIds = useMemo(() => new Set(snap.agents.map(a => a.id)), [snap.agents]);
	const toolHost = useMemo<ToolRenderHost>(
		() => ({
			hasAgent: id => agentIds.has(id),
			openAgent: id => {
				if (agentIds.has(id)) setSelectedId(id);
			},
		}),
		[agentIds],
	);

	// Auto-open the rail the first time a subagent appears.
	useEffect(() => {
		if (subCount > 0 && !autoOpenedRef.current) {
			autoOpenedRef.current = true;
			setRailOpen(true);
		}
	}, [subCount]);

	const title = snap.header?.title ?? snap.state?.sessionName ?? "session";
	useEffect(() => {
		document.title = `${title} · omp collab`;
	}, [title]);

	const drawerAgent = selectedId != null ? snap.agents.find(a => a.id === selectedId) : undefined;

	// Extrai texto da última mensagem de streaming ou entrada do transcript para TTS
	const lastText = useMemo(() => {
		if (snap.stream && "content" in snap.stream && Array.isArray(snap.stream.content)) {
			return snap.stream.content
				.filter(c => c.type === "text")
				.map(c => ("text" in c ? c.text : ""))
				.join(" ");
		}
		if (snap.entries.length > 0) {
			const last = snap.entries[snap.entries.length - 1];
			if ("content" in last) {
				if (typeof last.content === "string") return last.content;
				if (Array.isArray(last.content)) {
					return last.content
						.filter(c => typeof c === "object" && c !== null && "type" in c && c.type === "text")
						.map(c => ("text" in c && typeof c.text === "string" ? c.text : ""))
						.join(" ");
				}
			}
		}
		return undefined;
	}, [snap.stream, snap.entries]);
	return (
		<div className="sh-app">
			<HeaderBar
				snapshot={snap}
				subCount={subCount}
				railOpen={railOpen}
				sharkOpen={sharkOpen}
				ttsEnabled={ttsEnabled}
				onToggleRail={() => setRailOpen(open => !open)}
				onToggleShark={() => setSharkOpen(open => !open)}
				onToggleTts={() => setTtsEnabled(enabled => !enabled)}
				onLeave={onLeave}
			/>
			<main className="sh-main">
				<section className="sh-content" data-rail={railOpen ? "true" : "false"}>
					<div className="sh-transcript">
						<Transcript
							entries={snap.entries}
							stream={snap.stream}
							streamDone={snap.streamDone}
							activeTools={snap.activeTools}
							working={snap.working}
							host={toolHost}
							phase={snap.phase}
						/>
					</div>
				</section>
				{sharkOpen && (
					<div
						style={{
							width: "420px",
							minWidth: "320px",
							height: "100%",
							display: "flex",
							flexDirection: "column",
							borderLeft: "1px solid var(--sh-border, rgba(255,255,255,0.1))",
						}}
					>
						<SharkViewer lastMessage={lastText} ttsEnabled={ttsEnabled} />
					</div>
				)}
				{railOpen && (
					<>
						<div className="sh-rail-backdrop" onClick={() => setRailOpen(false)} />
						<aside className="sh-rail">
							<AgentsPanel
								agents={snap.agents}
								progress={snap.progress}
								lifecycle={snap.lifecycle}
								selectedId={selectedId}
								onSelect={setSelectedId}
							/>
						</aside>
					</>
				)}
			</main>
			<Composer client={client} snapshot={snap} />
			{drawerAgent && (
				<>
					<div className="ag-drawer-backdrop" onClick={() => setSelectedId(null)} />
					<AgentDrawer
						agent={drawerAgent}
						progress={snap.progress.get(drawerAgent.id)}
						client={client}
						readOnly={snap.readOnly}
						host={toolHost}
						onClose={() => setSelectedId(null)}
					/>
				</>
			)}
			<Banners phase={snap.phase} endedReason={snap.endedReason} onRejoin={onRejoin} onNewLink={onLeave} />
			<Toasts notices={snap.notices} />
		</div>
	);
}
