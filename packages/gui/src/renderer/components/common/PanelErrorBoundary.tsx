/**
 * Render-error boundary for volatile surfaces (panels fed by free-form wire
 * data). Without it, a single bad payload unmounts the whole app — the
 * agents/diff-tab white screen. The fallback keeps the app alive, shows the
 * error, and offers a retry that remounts the subtree.
 */
import { Component, type ReactNode } from "react";
import { describeError } from "../../lib/errors";
import { useT } from "../../lib/i18n";

interface PanelErrorBoundaryProps {
	children: ReactNode;
}

interface PanelErrorBoundaryState {
	error: Error | null;
}

function Fallback({ error, onRetry }: { error: Error; onRetry: () => void }) {
	const t = useT();
	return (
		<div className="flex h-full flex-col items-center justify-center gap-2 px-6 py-8 text-center">
			<span className="text-omsk-md font-medium text-[var(--omsk-error)]">{t("errorBoundary.title")}</span>
			<span
				className="max-w-full break-words text-omsk-sm leading-snug text-[var(--omsk-dim)]"
				title={error.message}
			>
				{describeError(error)}
			</span>
			<button
				type="button"
				onClick={onRetry}
				className="omsk-pressable mt-1 rounded-lg border border-[var(--omsk-border)] px-3 py-1 text-omsk-sm font-medium text-[var(--omsk-muted)] hover:bg-[var(--omsk-selected-bg)] hover:text-[var(--omsk-text)]"
			>
				{t("errorBoundary.retry")}
			</button>
		</div>
	);
}

export class PanelErrorBoundary extends Component<PanelErrorBoundaryProps, PanelErrorBoundaryState> {
	state: PanelErrorBoundaryState = { error: null };

	static getDerivedStateFromError(error: Error): PanelErrorBoundaryState {
		return { error };
	}

	render(): ReactNode {
		if (this.state.error) {
			return <Fallback error={this.state.error} onRetry={() => this.setState({ error: null })} />;
		}
		return this.props.children;
	}
}
