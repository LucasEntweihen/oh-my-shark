import { FolderOpen } from "lucide-react";
import { useState } from "react";
import { basename } from "../../lib/format";
import { useT } from "../../lib/i18n";
import { pickAndMoveSession } from "../../lib/workspace-dirs";
import { useSessionStore } from "../../stores/session";

interface CurrentWorkspaceControlProps {
	tabId: string | null;
	disabled: boolean;
}

/** Show the active session's workspace and relocate it from the composer. */
export function CurrentWorkspaceControl({ tabId, disabled }: CurrentWorkspaceControlProps) {
	const t = useT();
	const cwd = useSessionStore(state => state.cwd);
	const [moving, setMoving] = useState(false);
	const name = basename(cwd) || cwd || t("workspaceDirs.selectWorkspace");
	const blocked = disabled || moving;

	const changeWorkspace = async (): Promise<void> => {
		if (blocked) return;
		setMoving(true);
		try {
			await pickAndMoveSession(tabId);
		} finally {
			setMoving(false);
		}
	};

	return (
		<button
			type="button"
			disabled={blocked}
			onClick={() => void changeWorkspace()}
			aria-label={t("workspaceDirs.currentWorkspace", { name })}
			title={`${cwd || name}\n${t("workspaceDirs.changeWorkspace")}`}
			className="omsk-pressable flex h-8 max-w-36 shrink items-center gap-1.5 rounded-full px-2 text-omsk-xs text-[var(--omsk-muted)] hover:bg-[var(--omsk-selected-bg)] hover:text-[var(--omsk-text)] disabled:cursor-not-allowed disabled:opacity-50"
		>
			<FolderOpen aria-hidden="true" className="shrink-0" size={14} />
			<span className="omsk-composer-control-label min-w-0 truncate">{name}</span>
		</button>
	);
}
