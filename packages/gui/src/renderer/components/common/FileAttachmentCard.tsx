import { File, X } from "lucide-react";
import { useEffect, useState } from "react";
import { previewFile } from "../../lib/file-actions";
import { basename } from "../../lib/format";
import { useT } from "../../lib/i18n";
import { useRuntimeTabId } from "../../stores/session-runtime-context";

export function FileAttachmentCard({
	path,
	name = basename(path),
	onRemove,
	removeDisabled,
}: {
	path: string;
	name?: string;
	onRemove?: () => void;
	removeDisabled?: boolean;
}) {
	const t = useT();
	const tabId = useRuntimeTabId();
	const [thumb, setThumb] = useState<{ path: string; url: string } | null>(null);
	useEffect(() => {
		let cancelled = false;
		void window.omsk?.fs
			?.documentPreview?.(path, true, tabId ?? undefined)
			.then(result => {
				if (!cancelled && result.kind === "image") setThumb({ path, url: result.dataUrl });
			})
			.catch(() => {});
		return () => {
			cancelled = true;
		};
	}, [path, tabId]);
	return (
		<div className="group relative w-36 max-w-full min-w-0 shrink-0" data-file-attachment>
			<button
				className="omsk-pressable block w-full overflow-hidden rounded-lg border border-(--omsk-border-muted) text-left hover:border-(--omsk-border-accent)"
				onClick={() => previewFile(path)}
				title={path}
				type="button"
			>
				<span className="grid h-[4.5rem] place-items-center overflow-hidden border-b border-(--omsk-border-muted)">
					{thumb?.path === path ? (
						<img alt="" className="h-full w-full object-cover object-top" src={thumb.url} />
					) : (
						<File aria-hidden size={22} className="text-(--omsk-muted)" />
					)}
				</span>
				<span className="block truncate px-2 py-1.5 text-omsk-xs font-medium text-(--omsk-text)">{name}</span>
			</button>
			{onRemove && (
				<button
					aria-label={t("input.removeFileAttachment", { name })}
					className="absolute top-1 right-1 grid size-5 place-items-center rounded-full border border-(--omsk-border-muted) bg-(--omsk-bg-elevated) text-(--omsk-muted) hover:text-(--omsk-text) disabled:opacity-40"
					disabled={removeDisabled}
					onClick={onRemove}
					type="button"
				>
					<X aria-hidden size={12} />
				</button>
			)}
		</div>
	);
}
