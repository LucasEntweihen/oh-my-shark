import { Globe } from "lucide-react";
import { extractImageDataUrl, resultText } from "../../lib/format";
import { useT } from "../../lib/i18n";
import { ZoomableImage } from "../common/ImageViewer";
import type { ToolRendererProps } from "./ToolCard";

/** Browser automation: action description + screenshot thumbnail when present. */
export function BrowserRenderer({ args, result, isError, isPartial, partialResult }: ToolRendererProps) {
	const t = useT();
	const action = typeof args.action === "string" ? args.action : "";
	const url = typeof args.url === "string" ? args.url : "";
	const effective = isPartial ? partialResult : result;
	const screenshot = extractImageDataUrl(effective);
	const text = resultText(effective);

	return (
		<div className="flex flex-col gap-1.5">
			<div className="flex items-center gap-1.5 font-mono text-omsk-sm">
				<Globe size={12} className="shrink-0 text-[var(--omsk-md-link)]" />
				{action && <span className="font-semibold text-[var(--omsk-text)]">{action}</span>}
				{url && <span className="min-w-0 flex-1 truncate text-[var(--omsk-md-link)]">{url}</span>}
			</div>
			{screenshot && (
				<ZoomableImage
					src={screenshot}
					alt={t("tools.browser.screenshotAlt")}
					className="max-h-56 rounded-md border border-[var(--omsk-border-muted)] object-contain"
				/>
			)}
			{text && !screenshot && (
				<pre
					className={
						"max-h-40 overflow-auto whitespace-pre-wrap rounded px-2 py-1.5 font-mono text-omsk-sm leading-[1.45] " +
						(isError
							? "bg-[var(--omsk-tool-error-bg)] text-[var(--omsk-error)]"
							: "bg-[var(--omsk-code-bg)] text-[var(--omsk-tool-output)]")
					}
				>
					{text}
				</pre>
			)}
			{isPartial && !text && !screenshot && (
				<div className="text-omsk-sm italic text-[var(--omsk-accent)]">{t("tools.browser.navigating")}</div>
			)}
		</div>
	);
}
