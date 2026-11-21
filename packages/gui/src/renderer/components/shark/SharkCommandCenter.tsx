import { Radar, RefreshCw, Workflow } from "lucide-react";
import { useEffect, useState } from "react";
import { useSharkStore } from "../../stores/shark";
import { type SharkTabId, useUiStore } from "../../stores/ui";
import { Badge, Button, Modal, type TabItem, Tabs } from "../common";
import { SharkCapabilitiesTab } from "./SharkCapabilitiesTab";
import { SharkCheckpointsTab } from "./SharkCheckpointsTab";
import { SharkCockpitTab } from "./SharkCockpitTab";
import { SharkImpactTab } from "./SharkImpactTab";
import { SharkTeiaTab } from "./SharkTeiaTab";

export interface SharkCommandCenterProps {
	open?: boolean;
	onClose?: () => void;
	initialTab?: SharkTabId;
}

export function SharkCommandCenter({ open = true, onClose, initialTab = "cockpit" }: SharkCommandCenterProps) {
	const handleClose = onClose ?? (() => useUiStore.getState().closeShark());
	const [activeTab, setActiveTab] = useState<SharkTabId>(initialTab);

	const status = useSharkStore(s => s.status);
	const events = useSharkStore(s => s.events);
	const impactResult = useSharkStore(s => s.impactResult);
	const capabilities = useSharkStore(s => s.capabilities);
	const checkpoints = useSharkStore(s => s.checkpoints);
	const changesSummary = useSharkStore(s => s.changesSummary);
	const teiaNodes = useSharkStore(s => s.teiaNodes);
	const teiaEdges = useSharkStore(s => s.teiaEdges);
	const cockpitConfig = useSharkStore(s => s.cockpitConfig);
	const loading = useSharkStore(s => s.loading);
	const error = useSharkStore(s => s.error);

	const refreshAll = useSharkStore(s => s.refreshAll);
	const refreshEvents = useSharkStore(s => s.refreshEvents);
	const runImpactAnalysis = useSharkStore(s => s.runImpactAnalysis);
	const searchCapabilities = useSharkStore(s => s.searchCapabilities);
	const refreshCheckpoints = useSharkStore(s => s.refreshCheckpoints);
	const rollbackCheckpoint = useSharkStore(s => s.rollbackCheckpoint);
	const searchTeia = useSharkStore(s => s.searchTeia);
	const recordTeiaDecision = useSharkStore(s => s.recordTeiaDecision);
	const updateCockpitConfig = useSharkStore(s => s.updateCockpitConfig);
	const clearError = useSharkStore(s => s.clearError);

	useEffect(() => {
		setActiveTab(initialTab);
	}, [initialTab]);

	useEffect(() => {
		if (!open) return;
		void refreshAll();
	}, [open, refreshAll]);

	const tabs: TabItem[] = [
		{ id: "cockpit", label: "Cockpit & Kernel", badge: events.length },
		{ id: "impact", label: "Impact Analysis" },
		{ id: "capabilities", label: "Capabilities & Sandbox", badge: capabilities.length },
		{ id: "checkpoints", label: "Checkpoints & Rollback", badge: checkpoints.length },
		{ id: "teia", label: "Mente em Teia", badge: teiaNodes.length },
	];

	return (
		<Modal
			dockable
			open={open}
			onClose={handleClose}
			size="full"
			bodyClassName="p-0"
			ariaLabel="Shark Command Center"
			title={
				<span className="flex items-center gap-2">
					<Radar size={16} className="text-[var(--omp-accent)]" />
					<span>Shark Command Center</span>
					{status?.version && <Badge variant="info">v{status.version}</Badge>}
				</span>
			}
		>
			<div className="flex h-full min-h-0 flex-col">
				<div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-[var(--omp-border-muted)] px-4 pt-1.5">
					<Tabs
						tabs={tabs}
						activeId={activeTab}
						onChange={id => setActiveTab(id as SharkTabId)}
						className="border-b-0"
						ariaLabel="Shark Command Center Pillars"
					/>
					<div className="flex items-center gap-2 pb-1.5">
						<Button
							size="sm"
							variant="secondary"
							loading={loading}
							icon={<RefreshCw size={12} />}
							onClick={() => void refreshAll()}
						>
							Refresh All
						</Button>
						<Button
							size="sm"
							variant="ghost"
							icon={<Workflow size={13} />}
							onClick={() => useUiStore.getState().openOrchestrator()}
						>
							Orchestrator Studio
						</Button>
					</div>
				</div>

				<div className="min-h-0 flex-1 overflow-y-auto p-4">
					{error && (
						<div
							role="alert"
							className="mb-3 flex items-center justify-between gap-3 rounded-lg border border-[var(--omp-error)] bg-[var(--omp-error-dim)] px-3 py-2 text-omp-sm text-[var(--omp-error)]"
						>
							<span>{error}</span>
							<button type="button" onClick={clearError} className="text-omp-xs underline">
								Dismiss
							</button>
						</div>
					)}

					{activeTab === "cockpit" && (
						<SharkCockpitTab
							status={status}
							events={events}
							cockpitConfig={cockpitConfig}
							loading={loading}
							onRefreshEvents={() => refreshEvents(100)}
							onUpdateConfig={updateCockpitConfig}
						/>
					)}
					{activeTab === "impact" && (
						<SharkImpactTab result={impactResult} loading={loading} onAnalyze={runImpactAnalysis} />
					)}
					{activeTab === "capabilities" && (
						<SharkCapabilitiesTab capabilities={capabilities} loading={loading} onSearch={searchCapabilities} />
					)}
					{activeTab === "checkpoints" && (
						<SharkCheckpointsTab
							checkpoints={checkpoints}
							changesSummary={changesSummary}
							loading={loading}
							onRefresh={refreshCheckpoints}
							onRollback={rollbackCheckpoint}
						/>
					)}
					{activeTab === "teia" && (
						<SharkTeiaTab
							nodes={teiaNodes}
							edges={teiaEdges}
							loading={loading}
							onSearch={searchTeia}
							onRecordDecision={recordTeiaDecision}
						/>
					)}
				</div>
			</div>
		</Modal>
	);
}
