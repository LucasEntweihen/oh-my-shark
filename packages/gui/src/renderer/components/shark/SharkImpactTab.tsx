import { FileWarning, FlaskConical, GitFork, Radar, Search } from "lucide-react";
import { useState } from "react";
import type { RpcSharkImpactResult } from "../../../shared/rpc-types";
import { Badge, type BadgeVariant, Button, Input } from "../common";

function riskVariant(risk: string): BadgeVariant {
	switch (risk.toLowerCase()) {
		case "breaking":
		case "high":
		case "critical":
			return "error";
		case "medium":
			return "warning";
		case "low":
		case "none":
			return "success";
		default:
			return "muted";
	}
}

export interface SharkImpactTabProps {
	result: RpcSharkImpactResult | null;
	loading: boolean;
	onAnalyze: (target: string) => Promise<RpcSharkImpactResult | null>;
}

export function SharkImpactTab({ result, loading, onAnalyze }: SharkImpactTabProps) {
	const [target, setTarget] = useState(result?.targetId ?? "");

	const submit = () => {
		if (!target.trim() || loading) return;
		void onAnalyze(target.trim());
	};

	return (
		<div className="space-y-4">
			<section className="rounded-xl border border-[var(--omsk-border-muted)] p-4">
				<h3 className="mb-2 flex items-center gap-2 text-omsk-md font-semibold text-[var(--omsk-text)]">
					<Radar size={15} className="text-[var(--omsk-accent)]" />
					Shark Impact Analysis (/impact)
				</h3>
				<p className="mb-3 text-omsk-xs text-[var(--omsk-muted)]">
					Compute AST & dependency blast radius, dependent callers, associated tests, and contract breach risk.
				</p>
				<div className="flex flex-wrap items-center gap-2">
					<div className="min-w-60 flex-1">
						<Input
							compact
							mono
							value={target}
							onChange={e => setTarget(e.target.value)}
							onKeyDown={e => {
								if (e.key === "Enter") {
									e.preventDefault();
									submit();
								}
							}}
							placeholder="Enter file path or symbol id (e.g. packages/gui/src/renderer/App.tsx)"
							aria-label="Impact analysis target"
						/>
					</div>
					<Button
						size="sm"
						variant="primary"
						loading={loading}
						disabled={!target.trim()}
						icon={<Search size={12} />}
						onClick={submit}
					>
						Analyze Impact
					</Button>
				</div>
			</section>

			{result ? (
				<div className="space-y-3 rounded-xl border border-[var(--omsk-border-muted)] p-4">
					<div className="flex flex-wrap items-center justify-between gap-2">
						<div className="flex items-center gap-2">
							<span className="font-mono text-omsk-md font-semibold text-[var(--omsk-text)]">
								{result.targetId}
							</span>
							<Badge variant={riskVariant(result.contractRisk)}>
								Contract Risk: {result.contractRisk.toUpperCase()}
							</Badge>
						</div>
					</div>
					<p className="text-omsk-sm text-[var(--omsk-text-secondary)]">{result.explanation}</p>

					<div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
						<div className="rounded-lg border border-[var(--omsk-border-muted)] p-3">
							<div className="mb-2 flex items-center gap-1.5 text-omsk-xs font-semibold text-[var(--omsk-text)]">
								<FileWarning size={13} className="text-[var(--omsk-warning)]" />
								Affected Files ({result.affectedFiles.length})
							</div>
							{result.affectedFiles.length === 0 ? (
								<div className="text-omsk-xs text-[var(--omsk-dim)]">None</div>
							) : (
								<ul className="max-h-60 space-y-1 overflow-y-auto font-mono text-omsk-xs text-[var(--omsk-text-secondary)]">
									{result.affectedFiles.map(file => (
										<li key={file} className="truncate" title={file}>
											{file}
										</li>
									))}
								</ul>
							)}
						</div>

						<div className="rounded-lg border border-[var(--omsk-border-muted)] p-3">
							<div className="mb-2 flex items-center gap-1.5 text-omsk-xs font-semibold text-[var(--omsk-text)]">
								<GitFork size={13} className="text-[var(--omsk-info)]" />
								Dependent Callers ({result.dependentCallers.length})
							</div>
							{result.dependentCallers.length === 0 ? (
								<div className="text-omsk-xs text-[var(--omsk-dim)]">None</div>
							) : (
								<ul className="max-h-60 space-y-1 overflow-y-auto font-mono text-omsk-xs text-[var(--omsk-text-secondary)]">
									{result.dependentCallers.map(caller => (
										<li key={caller} className="truncate" title={caller}>
											{caller}
										</li>
									))}
								</ul>
							)}
						</div>

						<div className="rounded-lg border border-[var(--omsk-border-muted)] p-3">
							<div className="mb-2 flex items-center gap-1.5 text-omsk-xs font-semibold text-[var(--omsk-text)]">
								<FlaskConical size={13} className="text-[var(--omsk-success)]" />
								Associated Tests ({result.associatedTests.length})
							</div>
							{result.associatedTests.length === 0 ? (
								<div className="text-omsk-xs text-[var(--omsk-dim)]">None</div>
							) : (
								<ul className="max-h-60 space-y-1 overflow-y-auto font-mono text-omsk-xs text-[var(--omsk-text-secondary)]">
									{result.associatedTests.map(test => (
										<li key={test} className="truncate" title={test}>
											{test}
										</li>
									))}
								</ul>
							)}
						</div>
					</div>
				</div>
			) : (
				<div className="rounded-xl border border-dashed border-[var(--omsk-border-muted)] p-8 text-center text-omsk-sm text-[var(--omsk-dim)]">
					Enter a file or symbol ID above and click <strong>Analyze Impact</strong> to inspect dependency blast
					radius.
				</div>
			)}
		</div>
	);
}
