import { Component, type ReactNode, useEffect, useState } from "react";
import { buildIssueUrl } from "../../../shared/feedback";
import { translate } from "../../lib/i18n";

interface RootErrorBoundaryProps {
	children: ReactNode;
}

/** Opens a prefilled issue with the crash message; the user reviews and posts on GitHub. */
function reportOnGithub(error: Error): void {
	const omp = window.omp;
	if (!omp) return;
	void omp.system
		.info()
		.then(info =>
			omp.system.openExternal(
				buildIssueUrl({
					kind: "bug",
					title: `App crash: ${error.message.slice(0, 80)}`,
					description: "",
					environment: info,
					prefillError: `${error.message}\n${error.stack ?? ""}`.trim(),
				}),
			),
		)
		.catch(() => {});
}

interface RootErrorBoundaryState {
	error: Error | null;
}

function RootErrorFallback({ error }: { error: Error }) {
	const [logPath, setLogPath] = useState<string | null>(null);

	useEffect(() => {
		window.omp?.runtime
			?.logPath()
			.then(setLogPath)
			.catch(() => {});
	}, []);

	return (
		<main className="drag-region flex h-full w-full items-center justify-center px-6 text-[var(--omsk-text)]">
			<section className="no-drag w-full max-w-xl rounded-2xl border border-[var(--omsk-border)] p-6 shadow-2xl">
				<div className="mb-4 h-1 w-12 rounded-full bg-[var(--omsk-error)]" />
				<h1 className="font-display text-omsk-xl font-semibold">{translate("appError.title")}</h1>
				<p className="mt-2 text-omsk-md leading-relaxed text-[var(--omsk-muted)]">
					{translate("appError.description")}
				</p>
				<details className="mt-4">
					<summary className="cursor-pointer text-omsk-sm text-[var(--omsk-dim)]">
						{translate("errors.technicalDetails")}
					</summary>
					<pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap break-words rounded-xl border border-[var(--omsk-border-muted)] bg-[var(--omsk-code-bg)] p-3 font-mono text-omsk-sm leading-relaxed text-[var(--omsk-error)]">
						{error.message}
					</pre>
					{logPath ? (
						<p className="mt-2 break-all font-mono text-omsk-xs leading-relaxed text-[var(--omsk-dim)]">
							{translate("appError.logPath", { path: logPath })}
						</p>
					) : null}
				</details>
				<div className="mt-5 flex items-center gap-2">
					<button
						type="button"
						onClick={() => window.location.reload()}
						className="omsk-pressable rounded-lg bg-(--omsk-btn-primary-bg) px-4 py-2 text-omsk-xs font-semibold text-(--omsk-btn-primary-text) hover:brightness-110"
					>
						{translate("appError.reload")}
					</button>
					<button
						type="button"
						onClick={() => reportOnGithub(error)}
						className="omsk-pressable rounded-lg border border-(--omsk-border-muted) px-4 py-2 text-omsk-xs font-semibold text-(--omsk-muted) hover:text-(--omsk-text)"
					>
						{translate("appError.report")}
					</button>
				</div>
			</section>
		</main>
	);
}

export class RootErrorBoundary extends Component<RootErrorBoundaryProps, RootErrorBoundaryState> {
	state: RootErrorBoundaryState = { error: null };

	static getDerivedStateFromError(error: unknown): RootErrorBoundaryState {
		return { error: error instanceof Error ? error : new Error(String(error)) };
	}

	render(): ReactNode {
		return this.state.error ? <RootErrorFallback error={this.state.error} /> : this.props.children;
	}
}
