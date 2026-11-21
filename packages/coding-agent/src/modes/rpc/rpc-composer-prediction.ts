/**
 * Composer predictions for RPC hosts: the `composer_prediction_request` and
 * `composer_prediction_feedback` commands plus the `composer_prediction` frame.
 *
 * The interactive TUI's {@link ComposerPredictionController} does the work (the
 * ephemeral side turn, the `composer.predictions` setting, staleness checks,
 * usage and telemetry); this adapter gives it an RPC host in place of the
 * editor and renderer. A host keeps its own composer, so it asks only while
 * that draft is empty, and the controller's repaint requests become frames.
 */

import type { AgentViewSession } from "../../session/agent-session-handle";
import type { Settings } from "../../config/settings";
import { ComposerPredictionController } from "../controllers/composer-prediction-controller";
import type { RpcComposerPredictionFeedback, RpcComposerPredictionFrame } from "./rpc-types";

export interface ComposerPredictionSession extends AgentViewSession {
	readonly settings: Settings;
}

export class RpcComposerPrediction {
	readonly #controller: ComposerPredictionController;
	readonly #output: (frame: RpcComposerPredictionFrame) => void;
	/** The alternatives last announced, so a repaint that changes nothing sends no frame. */
	#announced: readonly string[] = [];

	constructor(
		session: ComposerPredictionSession,
		output: (frame: RpcComposerPredictionFrame) => void,
		options: { deadlineMs?: number } = {},
	) {
		this.#output = output;
		this.#controller = new ComposerPredictionController(
			{
				settings: session.settings,
				viewSession: session,
				focusedAgentId: undefined,
				// The host checked its own draft before asking.
				editor: { getText: () => "" },
				ui: { requestRender: () => this.#announce() },
			},
			options,
		);
	}

	/** Predict the next message for the run that just finished; a no-op when predictions are off or the session is busy. */
	request(): void {
		this.#controller.request();
	}

	/** The host showed, inserted, or dropped the prediction. */
	feedback(action: RpcComposerPredictionFeedback, rank = 0): void {
		if (action === "shown") this.#controller.shown();
		else if (action === "accepted") this.#controller.accepted(rank);
		else this.#controller.cancel();
	}

	#announce(): void {
		const choices = this.#controller.choices ?? [];
		if (choices.length === this.#announced.length && choices.every((choice, i) => choice === this.#announced[i])) {
			return;
		}
		this.#announced = choices;
		this.#output({ type: "composer_prediction", choices: [...choices] });
	}
}
