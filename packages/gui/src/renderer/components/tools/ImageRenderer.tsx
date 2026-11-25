import { Image as ImageIcon } from "lucide-react";
import { extractImageDataUrls, resultDetails, resultText } from "../../lib/format";
import { useT } from "../../lib/i18n";
import { ZoomableImage } from "../common/ImageViewer";
import type { ToolRendererProps } from "./ToolCard";

function firstStringList(value: unknown): string {
	return Array.isArray(value) && typeof value[0] === "string" ? value[0] : "";
}

/**
 * Image tools. `generate_image` returns its pictures as `{ data, mimeType }`
 * pairs under `details.images` plus the saved files in `details.imagePaths`,
 * while an inspection call carries a content image block — `extractImageDataUrls`
 * sees both, so every picture the call produced is previewed.
 */
export function ImageRenderer({ args, result, isError, isPartial, partialResult }: ToolRendererProps) {
	const t = useT();
	const effective = isPartial ? partialResult : result;
	const details = resultDetails(effective);
	const argsPath = typeof args.path === "string" ? args.path : "";
	const inline = argsPath.startsWith("data:image/") ? argsPath : null;
	const path = inline ? "" : argsPath || firstStringList(details?.imagePaths);
	const prompt = typeof args.subject === "string" ? args.subject : typeof args.prompt === "string" ? args.prompt : "";
	const images = inline ? [...extractImageDataUrls(effective), inline] : extractImageDataUrls(effective);
	const caption = resultText(effective);

	return (
		<div className="flex flex-col gap-1.5">
			<div className="flex items-center gap-1.5 font-mono text-omsk-sm">
				<ImageIcon size={12} className="shrink-0 text-[var(--omsk-thinking-xhigh)]" />
				{path && <span className="min-w-0 flex-1 truncate text-[var(--omsk-text)]">{path}</span>}
				{!path && prompt && <span className="min-w-0 flex-1 truncate text-[var(--omsk-muted)]">{prompt}</span>}
				{images.length > 1 && (
					<span className="shrink-0 tabular-nums text-[var(--omsk-dim)]">
						{t("tools.image.count", { count: images.length })}
					</span>
				)}
			</div>
			{images.length > 0 ? (
				<div className="flex flex-wrap gap-1.5">
					{images.map(src => (
						<ZoomableImage
							alt={path || prompt || t("tools.image.alt")}
							className="max-h-72 rounded-md border border-[var(--omsk-border-muted)] object-contain"
							key={src}
							src={src}
						/>
					))}
				</div>
			) : (
				caption && (
					<pre
						className={
							"max-h-40 overflow-auto whitespace-pre-wrap rounded px-2 py-1.5 font-mono text-omsk-sm leading-[1.45] " +
							(isError
								? "bg-[var(--omsk-tool-error-bg)] text-[var(--omsk-error)]"
								: "bg-[var(--omsk-code-bg)] text-[var(--omsk-tool-output)]")
						}
					>
						{caption}
					</pre>
				)
			)}
			{isPartial && images.length === 0 && !caption && (
				<div className="text-omsk-sm italic text-[var(--omsk-accent)]">{t("tools.image.generating")}</div>
			)}
		</div>
	);
}
