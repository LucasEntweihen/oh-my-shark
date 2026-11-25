import { FileDiff, GitCommitHorizontal, RefreshCw, RotateCcw } from "lucide-react";
import { useState } from "react";
import type { RpcSharkChangesSummary, RpcSharkCheckpointInfo } from "../../../shared/rpc-types";
import { formatTimeAgo } from "../../lib/format";
import type { SharkRollbackResult } from "../../stores/shark";
import { toast } from "../../stores/toast";
import { Badge, type BadgeVariant, Button } from "../common";

function checkpointVariant(status: RpcSharkCheckpointInfo["status"]): BadgeVariant {
	switch (status) {
		case "committed":
			return "success";
		case "rolled_back":
			return "warning";
		default:
			return "info";
	}
}

export interface SharkCheckpointsTabProps {
	checkpoints: RpcSharkCheckpointInfo[];
	changesSummary: RpcSharkChangesSummary | null;
	loading: boolean;
	onRefresh: () => Promise<void>;
	onRollback: (checkpointId: string, force?: boolean) => Promise<SharkRollbackResult | null>;
}

export function SharkCheckpointsTab({
	checkpoints,
	changesSummary,
	loading,
	onRefresh,
	onRollback,
}: SharkCheckpointsTabProps) {
	const [rollingBackId, setRollingBackId] = useState<string | null>(null);
	const [lastResult, setLastResult] = useState<{ id: string; result: SharkRollbackResult } | null>(null);

	const handleRollback = async (checkpointId: string, force = false) => {
		setRollingBackId(checkpointId);
		const result = await onRollback(checkpointId, force);
		setRollingBackId(null);
		if (!result) return;
		setLastResult({ id: checkpointId, result });
		toast({
			variant: result.conflicts.length > 0 ? "warning" : "success",
			title: result.conflicts.length > 0 ? "Rollback Completed with Conflicts" : "Atomic Rollback Applied",
			message: `${result.rolledBackFiles.length} file(s) restored${
				result.conflicts.length > 0 ? `, ${result.conflicts.length} conflict(s)` : ""
			}.`,
		});
	};

	return (
		<div className="space-y-4">
			<div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--omsk-border-muted)] p-3.5">
				<div className="flex flex-wrap items-center gap-4">
					<div className="flex items-center gap-1.5">
						<FileDiff size={15} className="text-[var(--omsk-accent)]" />
						<span className="text-omsk-sm font-semibold text-[var(--omsk-text)]">Transactional Edit Engine</span>
					</div>
					<div className="flex items-center gap-2 font-mono text-omsk-sm">
						<span className="text-[var(--omsk-diff-added)]">+{changesSummary?.totalAdded ?? 0}</span>
						<span className="text-[var(--omsk-diff-removed)]">-{changesSummary?.totalRemoved ?? 0}</span>
						<span className="text-[var(--omsk-muted)]">
							· {changesSummary?.modifiedCount ?? 0} modified ·{" "}
							{changesSummary?.checkpointsCount ?? checkpoints.length} checkpoints
						</span>
					</div>
				</div>
				<Button
					size="sm"
					variant="secondary"
					loading={loading}
					icon={<RefreshCw size={12} />}
					onClick={() => void onRefresh()}
				>
					Refresh
				</Button>
			</div>

			{lastResult && lastResult.result.conflicts.length > 0 && (
				<div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[var(--omsk-warning)] bg-[var(--omsk-warning-dim)] p-3 text-omsk-xs text-[var(--omsk-warning)]">
					<div>
						<strong>Rollback conflicts on {lastResult.id}:</strong> {lastResult.result.conflicts.join(", ")}
					</div>
					<Button
						size="sm"
						variant="danger"
						loading={rollingBackId === lastResult.id}
						onClick={() => void handleRollback(lastResult.id, true)}
					>
						Force Rollback
					</Button>
				</div>
			)}

			{checkpoints.length === 0 ? (
				<div className="rounded-xl border border-dashed border-[var(--omsk-border-muted)] p-8 text-center text-omsk-sm text-[var(--omsk-dim)]">
					No transactional checkpoints recorded in this workspace yet.
				</div>
			) : (
				<div className="space-y-2.5">
					{[...checkpoints]
						.sort((a, b) => b.timestamp - a.timestamp)
						.map(ckpt => (
							<div
								key={ckpt.id}
								className="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-[var(--omsk-border-muted)] p-3.5"
							>
								<div className="min-w-0 flex-1 space-y-1.5">
									<div className="flex flex-wrap items-center gap-2">
										<GitCommitHorizontal size={14} className="text-[var(--omsk-accent)]" />
										<span className="text-omsk-md font-semibold text-[var(--omsk-text)]">{ckpt.label}</span>
										<Badge variant={checkpointVariant(ckpt.status)}>{ckpt.status}</Badge>
										<span className="font-mono text-omsk-xxs text-[var(--omsk-dim)]">{ckpt.id}</span>
										<span className="text-omsk-xs text-[var(--omsk-muted)]">
											{formatTimeAgo(new Date(ckpt.timestamp).toISOString(), { compact: true })}
										</span>
									</div>
									<div className="flex flex-wrap items-center gap-1.5">
										<span className="text-omsk-xs text-[var(--omsk-dim)]">{ckpt.fileCount} file(s):</span>
										{ckpt.files.map(file => (
											<span
												key={file}
												className="rounded border border-[var(--omsk-border-muted)] bg-[var(--omsk-code-bg)] px-1.5 py-0.5 font-mono text-omsk-xxs text-[var(--omsk-text-secondary)]"
											>
												{file}
											</span>
										))}
									</div>
								</div>

								<div className="flex shrink-0 items-center gap-1.5">
									<Button
										size="sm"
										variant="danger"
										loading={rollingBackId === ckpt.id}
										disabled={loading && rollingBackId !== ckpt.id}
										icon={<RotateCcw size={12} />}
										onClick={() => void handleRollback(ckpt.id, false)}
									>
										1-Click Rollback
									</Button>
								</div>
							</div>
						))}
				</div>
			)}
		</div>
	);
}
