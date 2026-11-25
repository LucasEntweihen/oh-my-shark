import { FolderOpen } from "lucide-react";
import { cx, resultDetails, resultText } from "../../lib/format";
import { useT } from "../../lib/i18n";
import { GLOB_PREVIEW_PATHS, PREVIEW_SCROLL_MD } from "../../lib/preview";
import { PathLink } from "./PathLink";
import type { ToolRendererProps } from "./ToolCard";

const MAX_PATHS = GLOB_PREVIEW_PATHS;

interface GlobToolDetails {
	fileCount?: number;
	files?: string[];
	truncated?: boolean;
}

/** Glob: matched-path count + the path list. Prefers the structured
 * `details.files` — parsing text lines miscounts appended notices (timeouts,
 * truncation notes) as paths and offers them as file links. */
export function GlobRenderer({ args, result, isPartial, partialResult }: ToolRendererProps) {
	const t = useT();
	const pattern = typeof args.path === "string" ? args.path : typeof args.pattern === "string" ? args.pattern : "";
	const effective = isPartial ? partialResult : result;
	const details = resultDetails(effective) as GlobToolDetails | undefined;
	const listedPaths = Array.isArray(details?.files) ? details.files.map(String) : null;
	const totalCount = typeof details?.fileCount === "number" ? details.fileCount : (listedPaths?.length ?? Number.NaN);
	const paths = (
		listedPaths ??
		resultText(effective)
			.split("\n")
			.map(l => l.trim())
			.filter(Boolean)
	).slice(0, MAX_PATHS);

	return (
		<div className="flex flex-col gap-1">
			<div className="flex items-center gap-1.5 font-mono text-omsk-sm">
				<FolderOpen size={12} className="shrink-0 text-[var(--omsk-dim)]" />
				<span className="truncate text-[var(--omsk-text)]">{pattern}</span>
				<span className="ml-auto shrink-0 text-omsk-xs text-[var(--omsk-dim)]">
					{isPartial
						? t("tools.glob.matching")
						: Number.isFinite(totalCount)
							? t("tools.glob.paths", { count: totalCount, plural: totalCount === 1 ? "" : "s" })
							: t("tools.glob.paths", { count: paths.length, plural: paths.length === 1 ? "" : "s" })}
					{details?.truncated === true ? " +" : ""}
				</span>
			</div>
			{paths.length > 0 && (
				<div
					className={cx(
						"rounded bg-[var(--omsk-code-bg)] px-2 py-1 font-mono text-omsk-sm leading-[1.5]",
						PREVIEW_SCROLL_MD,
					)}
				>
					{paths.map((p, i) => (
						<PathLink
							key={i}
							path={p.endsWith("/") ? p.slice(0, -1) : p}
							className="block truncate whitespace-pre text-[var(--omsk-muted)] transition-colors hover:bg-[var(--omsk-selected-bg)]/50"
						>
							{p.endsWith("/") ? <span className="text-[var(--omsk-status-path)]">{p}</span> : p}
						</PathLink>
					))}
				</div>
			)}
		</div>
	);
}
