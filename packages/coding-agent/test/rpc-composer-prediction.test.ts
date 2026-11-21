import { describe, expect, it } from "bun:test";
import type { AgentMessage } from "@oh-my-pi/pi-agent-core";
import type { Message, Model } from "@oh-my-pi/pi-ai";
import { Settings } from "@oh-my-pi/pi-coding-agent/config/settings";
import {
	type ComposerPredictionSession,
	RpcComposerPrediction,
} from "@oh-my-pi/pi-coding-agent/modes/rpc/rpc-composer-prediction";
import type { RpcComposerPredictionFrame } from "@oh-my-pi/pi-coding-agent/modes/rpc/rpc-types";
import type { EphemeralTurnOptions, EphemeralTurnResult } from "@oh-my-pi/pi-coding-agent/session/agent-session-types";
import { SessionManager } from "@oh-my-pi/pi-coding-agent/session/session-manager";

const MODEL = { id: "claude-sonnet-4-5", provider: "anthropic", api: "anthropic-messages" } as Model;

function userMessage(content: string, timestamp: number): Message {
	return { role: "user", content, timestamp } as Message;
}

function harness(enabled = true) {
	const turns: { options: EphemeralTurnOptions; resolve: (result: EphemeralTurnResult) => void }[] = [];
	const sessionManager = SessionManager.inMemory();
	sessionManager.appendMessage(userMessage("fix the bug", 1));
	const messages: AgentMessage[] = [userMessage("fix the bug", 1)];
	const session = {
		settings: Settings.isolated({ "composer.predictions": enabled }),
		model: MODEL,
		sessionId: "provider-session",
		isStreaming: false,
		isCompacting: false,
		messages,
		sessionManager,
		ephemeralMaxTokensPreservesRequest: () => true,
		runEphemeralTurn(options: EphemeralTurnOptions): Promise<EphemeralTurnResult> {
			const { promise, resolve } = Promise.withResolvers<EphemeralTurnResult>();
			turns.push({ options, resolve });
			return promise;
		},
	} as unknown as ComposerPredictionSession;
	const frames: RpcComposerPredictionFrame[] = [];
	const prediction = new RpcComposerPrediction(session, frame => frames.push(frame));
	const reply = async (index: number, replyText: string) => {
		const assistantMessage = {
			api: MODEL.api,
			provider: MODEL.provider,
			model: MODEL.id,
			usage: { input: 10, output: 5 },
			stopReason: "stop",
			content: [{ type: "text", text: replyText }],
		} as unknown as EphemeralTurnResult["assistantMessage"];
		turns[index]!.resolve({ replyText, assistantMessage });
		await Bun.sleep(0);
	};
	return { prediction, frames, turns, messages, reply };
}

describe("RpcComposerPrediction", () => {
	it("sends the settled prediction as a frame and withdraws it with an empty one on dismissal", async () => {
		const { prediction, frames, turns, reply } = harness();
		prediction.request();
		expect(turns).toHaveLength(1);
		expect(frames).toEqual([]);

		await reply(0, "run the tests");
		expect(frames).toEqual([{ type: "composer_prediction", choices: ["run the tests"] }]);

		prediction.feedback("dismissed");
		expect(frames.at(-1)).toEqual({ type: "composer_prediction", choices: [] });
		// Withdrawing nothing announces nothing.
		prediction.feedback("dismissed");
		expect(frames).toHaveLength(2);
	});

	it("runs no billed side turn when composer.predictions is off", () => {
		const { prediction, frames, turns } = harness(false);
		prediction.request();
		expect(turns).toHaveLength(0);
		expect(frames).toEqual([]);
	});

	it("drops a prediction whose conversation moved on before it arrived", async () => {
		const { prediction, frames, messages, reply } = harness();
		prediction.request();
		messages.push(userMessage("actually, revert it", 2));
		await reply(0, "run the tests");
		expect(frames).toEqual([]);
	});
});
