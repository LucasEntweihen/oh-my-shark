import { CheckCircle2, Search, Shield, ShieldAlert } from "lucide-react";
import { useMemo, useState } from "react";
import type { RpcSharkCapabilityInfo } from "../../../shared/rpc-types";
import { cx } from "../../lib/format";
import { Badge, type BadgeVariant, Button, Input } from "../common";

const ORIGINS = ["all", "builtin", "skill", "mcp", "plugin"] as const;

function riskVariant(risk: string): BadgeVariant {
	switch (risk.toLowerCase()) {
		case "high":
		case "critical":
			return "error";
		case "medium":
			return "warning";
		case "low":
			return "success";
		default:
			return "muted";
	}
}

export interface SharkCapabilitiesTabProps {
	capabilities: RpcSharkCapabilityInfo[];
	loading: boolean;
	onSearch: (query?: string) => Promise<void>;
}

export function SharkCapabilitiesTab({ capabilities, loading, onSearch }: SharkCapabilitiesTabProps) {
	const [query, setQuery] = useState("");
	const [originFilter, setOriginFilter] = useState<(typeof ORIGINS)[number]>("all");

	const visible = useMemo(() => {
		if (originFilter === "all") return capabilities;
		return capabilities.filter(cap => cap.originType.toLowerCase() === originFilter);
	}, [capabilities, originFilter]);

	return (
		<div className="space-y-4">
			<div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[var(--omsk-border-muted)] p-3.5">
				<div className="flex min-w-60 flex-1 items-center gap-2">
					<div className="min-w-0 flex-1">
						<Input
							compact
							value={query}
							onChange={e => setQuery(e.target.value)}
							onKeyDown={e => {
								if (e.key === "Enter") {
									e.preventDefault();
									void onSearch(query.trim() || undefined);
								}
							}}
							placeholder="Search Universal Capability Registry…"
							aria-label="Search capabilities"
						/>
					</div>
					<Button
						size="sm"
						variant="secondary"
						loading={loading}
						icon={<Search size={12} />}
						onClick={() => void onSearch(query.trim() || undefined)}
					>
						Search
					</Button>
				</div>

				<div className="flex flex-wrap items-center gap-1">
					{ORIGINS.map(origin => (
						<button
							key={origin}
							type="button"
							aria-pressed={originFilter === origin}
							onClick={() => setOriginFilter(origin)}
							className={cx(
								"omsk-pressable rounded-full border px-2.5 py-0.5 text-omsk-xs font-medium",
								originFilter === origin
									? "border-[var(--omsk-border-accent)] bg-[var(--omsk-accent-dim)] text-[var(--omsk-accent)]"
									: "border-[var(--omsk-border-muted)] text-[var(--omsk-muted)] hover:text-[var(--omsk-text)]",
							)}
						>
							{origin}
						</button>
					))}
				</div>
			</div>

			{visible.length === 0 ? (
				<div className="rounded-xl border border-dashed border-[var(--omsk-border-muted)] p-8 text-center text-omsk-sm text-[var(--omsk-dim)]">
					No capabilities match the current filter.
				</div>
			) : (
				<div className="overflow-x-auto rounded-xl border border-[var(--omsk-border-muted)]">
					<table className="w-full border-collapse text-left text-omsk-xs">
						<thead>
							<tr className="border-b border-[var(--omsk-border-muted)] text-omsk-xxs uppercase tracking-wide text-[var(--omsk-dim)]">
								<th className="px-3 py-2.5 font-semibold">Capability</th>
								<th className="px-3 py-2.5 font-semibold">Origin</th>
								<th className="px-3 py-2.5 font-semibold">Risk</th>
								<th className="px-3 py-2.5 font-semibold">Sandbox Status</th>
								<th className="px-3 py-2.5 font-semibold">Permissions</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-[var(--omsk-border-muted)]">
							{visible.map(cap => (
								<tr key={cap.id} className="align-top hover:bg-[var(--omsk-selected-bg)]">
									<td className="px-3 py-2.5">
										<div className="font-semibold text-[var(--omsk-text)]">{cap.name}</div>
										<div className="font-mono text-omsk-xxs text-[var(--omsk-dim)]">{cap.id}</div>
										<div className="mt-0.5 text-omsk-xs text-[var(--omsk-muted)]">{cap.description}</div>
									</td>
									<td className="px-3 py-2.5 whitespace-nowrap">
										<Badge variant="info">{cap.originType}</Badge>
										<div className="mt-1 font-mono text-omsk-xxs text-[var(--omsk-dim)]">
											{cap.originSource}
										</div>
									</td>
									<td className="px-3 py-2.5 whitespace-nowrap">
										<Badge variant={riskVariant(cap.riskLevel)}>{cap.riskLevel}</Badge>
									</td>
									<td className="px-3 py-2.5 whitespace-nowrap">
										<div className="flex flex-col items-start gap-1">
											<Badge variant={cap.verified ? "success" : "warning"}>
												{cap.verified ? <CheckCircle2 size={10} /> : <ShieldAlert size={10} />}
												{cap.verified ? "Verified" : "Unverified"}
											</Badge>
											<Badge variant={cap.enabled ? "default" : "muted"}>
												<Shield size={10} />
												{cap.enabled ? "Enabled" : "Disabled"}
											</Badge>
										</div>
									</td>
									<td className="px-3 py-2.5">
										<div className="flex flex-wrap gap-1">
											{cap.permissions.length > 0 ? (
												cap.permissions.map(perm => (
													<span
														key={perm}
														className="rounded border border-[var(--omsk-border-muted)] bg-[var(--omsk-code-bg)] px-1.5 py-px font-mono text-omsk-xxs text-[var(--omsk-text-secondary)]"
													>
														{perm}
													</span>
												))
											) : (
												<span className="text-[var(--omsk-dim)]">none</span>
											)}
										</div>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			)}
		</div>
	);
}
