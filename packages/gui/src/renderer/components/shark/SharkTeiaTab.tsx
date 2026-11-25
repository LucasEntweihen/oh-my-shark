import { GitBranch, Network, PlusCircle, Search } from "lucide-react";
import { useMemo, useState } from "react";
import type { RpcTeiaEdgeInfo, RpcTeiaNodeInfo, SharkTeiaNodeKind } from "../../../shared/rpc-types";
import { cx } from "../../lib/format";
import { toast } from "../../stores/toast";
import { Badge, Button, Input, TextArea } from "../common";

const TEIA_KINDS: ("all" | SharkTeiaNodeKind)[] = [
	"all",
	"file",
	"symbol",
	"decision",
	"task",
	"test",
	"evidence",
	"fix",
];

export interface SharkTeiaTabProps {
	nodes: RpcTeiaNodeInfo[];
	edges: RpcTeiaEdgeInfo[];
	loading: boolean;
	onSearch: (query?: string, kind?: string, limit?: number) => Promise<void>;
	onRecordDecision: (title: string, rationale: string, files?: string[], symbols?: string[]) => Promise<string | null>;
}

export function SharkTeiaTab({ nodes, edges, loading, onSearch, onRecordDecision }: SharkTeiaTabProps) {
	const [query, setQuery] = useState("");
	const [kind, setKind] = useState<"all" | SharkTeiaNodeKind>("all");
	const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

	const [decisionTitle, setDecisionTitle] = useState("");
	const [decisionRationale, setDecisionRationale] = useState("");
	const [decisionFilesCsv, setDecisionFilesCsv] = useState("");
	const [decisionSymbolsCsv, setDecisionSymbolsCsv] = useState("");

	const nodeById = useMemo(() => new Map(nodes.map(node => [node.id, node])), [nodes]);

	const visibleEdges = useMemo(() => {
		if (!selectedNodeId) return edges;
		return edges.filter(edge => edge.sourceId === selectedNodeId || edge.targetId === selectedNodeId);
	}, [edges, selectedNodeId]);

	const runSearch = (nextKind = kind) => {
		void onSearch(query.trim() || undefined, nextKind === "all" ? undefined : nextKind, 80);
	};

	const submitDecision = async () => {
		if (!decisionTitle.trim() || !decisionRationale.trim()) return;
		const files = decisionFilesCsv
			.split(",")
			.map(s => s.trim())
			.filter(Boolean);
		const symbols = decisionSymbolsCsv
			.split(",")
			.map(s => s.trim())
			.filter(Boolean);
		const id = await onRecordDecision(decisionTitle.trim(), decisionRationale.trim(), files, symbols);
		if (id) {
			setDecisionTitle("");
			setDecisionRationale("");
			setDecisionFilesCsv("");
			setDecisionSymbolsCsv("");
			toast({ variant: "success", title: "Architectural Decision Recorded", message: `Node ${id}` });
		}
	};

	return (
		<div className="space-y-4">
			{/* FTS5 Search & Kind Filters */}
			<div className="space-y-2.5 rounded-xl border border-[var(--omsk-border-muted)] p-3.5">
				<div className="flex flex-wrap items-center gap-2">
					<div className="min-w-60 flex-1">
						<Input
							compact
							value={query}
							onChange={e => setQuery(e.target.value)}
							onKeyDown={e => {
								if (e.key === "Enter") {
									e.preventDefault();
									runSearch();
								}
							}}
							placeholder="FTS5 search across Mente em Teia graph…"
							aria-label="Search Mente em Teia"
						/>
					</div>
					<Button
						size="sm"
						variant="primary"
						loading={loading}
						icon={<Search size={12} />}
						onClick={() => runSearch()}
					>
						Search Graph
					</Button>
				</div>
				<div className="flex flex-wrap gap-1.5">
					{TEIA_KINDS.map(item => (
						<button
							key={item}
							type="button"
							aria-pressed={kind === item}
							onClick={() => {
								setKind(item);
								runSearch(item);
							}}
							className={cx(
								"omsk-pressable rounded-full border px-2.5 py-0.5 text-omsk-xs font-medium",
								kind === item
									? "border-[var(--omsk-border-accent)] bg-[var(--omsk-accent-dim)] text-[var(--omsk-accent)]"
									: "border-[var(--omsk-border-muted)] text-[var(--omsk-muted)] hover:text-[var(--omsk-text)]",
							)}
						>
							{item}
						</button>
					))}
				</div>
			</div>

			{/* Nodes & Edges Split Viewer */}
			<div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
				<section className="rounded-xl border border-[var(--omsk-border-muted)] p-3.5">
					<div className="mb-2 flex items-center justify-between">
						<h3 className="flex items-center gap-1.5 text-omsk-sm font-semibold text-[var(--omsk-text)]">
							<Network size={14} className="text-[var(--omsk-accent)]" />
							Knowledge Nodes ({nodes.length})
						</h3>
						{selectedNodeId && (
							<button
								type="button"
								onClick={() => setSelectedNodeId(null)}
								className="text-omsk-xs text-[var(--omsk-accent)] underline"
							>
								Clear filter
							</button>
						)}
					</div>
					{nodes.length === 0 ? (
						<div className="rounded-lg border border-dashed border-[var(--omsk-border-muted)] p-6 text-center text-omsk-xs text-[var(--omsk-dim)]">
							No graph nodes matched.
						</div>
					) : (
						<div className="max-h-72 space-y-1.5 overflow-y-auto pr-1">
							{nodes.map(node => {
								const selected = selectedNodeId === node.id;
								return (
									<button
										key={node.id}
										type="button"
										onClick={() => setSelectedNodeId(selected ? null : node.id)}
										className={cx(
											"w-full rounded-lg border p-2.5 text-left transition-colors",
											selected
												? "border-[var(--omsk-border-accent)] bg-[var(--omsk-selected-bg)]"
												: "border-[var(--omsk-border-muted)] hover:border-[var(--omsk-border)]",
										)}
									>
										<div className="flex items-center justify-between gap-2">
											<span className="truncate text-omsk-sm font-semibold text-[var(--omsk-text)]">
												{node.name}
											</span>
											<Badge variant="info">{node.kind}</Badge>
										</div>
										{node.content && (
											<p className="mt-1 line-clamp-2 text-omsk-xs text-[var(--omsk-muted)]">
												{node.content}
											</p>
										)}
										<div className="mt-1 font-mono text-omsk-xxs text-[var(--omsk-dim)]">{node.id}</div>
									</button>
								);
							})}
						</div>
					)}
				</section>

				<section className="rounded-xl border border-[var(--omsk-border-muted)] p-3.5">
					<h3 className="mb-2 flex items-center gap-1.5 text-omsk-sm font-semibold text-[var(--omsk-text)]">
						<GitBranch size={14} className="text-[var(--omsk-accent)]" />
						Connected Edges ({visibleEdges.length})
					</h3>
					{visibleEdges.length === 0 ? (
						<div className="rounded-lg border border-dashed border-[var(--omsk-border-muted)] p-6 text-center text-omsk-xs text-[var(--omsk-dim)]">
							No edges connected to selection.
						</div>
					) : (
						<div className="max-h-72 space-y-1.5 overflow-y-auto pr-1 font-mono text-omsk-xs">
							{visibleEdges.map(edge => {
								const src = nodeById.get(edge.sourceId)?.name ?? edge.sourceId;
								const dst = nodeById.get(edge.targetId)?.name ?? edge.targetId;
								return (
									<div
										key={edge.id}
										className="flex flex-wrap items-center gap-1.5 rounded-lg border border-[var(--omsk-border-muted)] bg-[var(--omsk-code-bg)] px-2.5 py-1.5"
									>
										<span className="truncate text-[var(--omsk-text)]">{src}</span>
										<Badge variant="default">{edge.relation}</Badge>
										<span className="truncate text-[var(--omsk-accent)]">{dst}</span>
										<span className="ml-auto text-omsk-xxs text-[var(--omsk-dim)]">
											{Math.round(edge.confidence * 100)}%
										</span>
									</div>
								);
							})}
						</div>
					)}
				</section>
			</div>

			{/* Inline Record Architectural Decision Form */}
			<section className="space-y-3 rounded-xl border border-[var(--omsk-border-muted)] p-3.5">
				<h3 className="flex items-center gap-1.5 text-omsk-sm font-semibold text-[var(--omsk-text)]">
					<PlusCircle size={14} className="text-[var(--omsk-accent)]" />
					Record Architectural Decision
				</h3>
				<div className="grid grid-cols-1 gap-2.5 md:grid-cols-2">
					<Input
						compact
						label="Decision Title"
						value={decisionTitle}
						onChange={e => setDecisionTitle(e.target.value)}
						placeholder="e.g. Isolate tab orchestrator stores per runtime"
					/>
					<div className="grid grid-cols-2 gap-2">
						<Input
							compact
							label="Related Files (csv)"
							value={decisionFilesCsv}
							onChange={e => setDecisionFilesCsv(e.target.value)}
							placeholder="stores/orchestrator.ts"
						/>
						<Input
							compact
							label="Symbols (csv)"
							value={decisionSymbolsCsv}
							onChange={e => setDecisionSymbolsCsv(e.target.value)}
							placeholder="createOrchestratorStore"
						/>
					</div>
				</div>
				<TextArea
					compact
					rows={2}
					label="Rationale"
					value={decisionRationale}
					onChange={e => setDecisionRationale(e.target.value)}
					placeholder="Explain architectural tradeoffs, invariants, and verification constraints…"
				/>
				<div className="flex justify-end">
					<Button
						size="sm"
						variant="primary"
						loading={loading}
						disabled={!decisionTitle.trim() || !decisionRationale.trim()}
						onClick={() => void submitDecision()}
					>
						Record Decision
					</Button>
				</div>
			</section>
		</div>
	);
}
