/**
 * Stream provider for the official Google Antigravity Python SDK (`antigravity-sdk`).
 * Keeps one stateful worker + authenticated loopback MCP broker per session/turn.
 */
import * as path from "node:path";
import * as AIError from "../error";
import type { Context, Model, StreamFunction } from "../types";
import { AssistantMessageEventStream } from "../utils/event-stream";
import { StepWriter } from "./antigravity-cli/step-writer";
import { AntigravitySdkHost, type AntigravitySdkStepOptions, resolveSdkAuth } from "./antigravity-sdk/host";
import { antigravitySdkDir } from "./antigravity-sdk/sdk-binary";

export type AntigravitySdkOptions = AntigravitySdkStepOptions;

interface RetainedSdkHost {
	host: AntigravitySdkHost;
	idle?: NodeJS.Timeout;
}

const implicitSdkSessions = new Map<string, RetainedSdkHost>();
const IDLE_MS = 5 * 60_000;

/** Streams one assistant turn/tool-step from the official Google Antigravity SDK sidecar. */
export const streamAntigravitySdk: StreamFunction<"antigravity-sdk"> = (
	model: Model<"antigravity-sdk">,
	context: Context,
	options: AntigravitySdkOptions = {},
): AssistantMessageEventStream => {
	const stream = new AssistantMessageEventStream();
	const writer = new StepWriter(model, stream);
	void runSdkStep(model, context, options, writer).catch(async error => {
		writer.fail(
			await AIError.finalize(error, {
				api: model.api,
				provider: model.provider,
				model: model.id,
				signal: options.signal,
			}),
		);
	});
	return stream;
};

async function runSdkStep(
	model: Model<"antigravity-sdk">,
	context: Context,
	options: AntigravitySdkOptions,
	writer: StepWriter,
): Promise<void> {
	options.signal?.throwIfAborted();
	const auth = resolveSdkAuth(model, options);
	const sessionKey = `antigravity-sdk:${auth.accountKey}:${options.sessionId ?? "default"}`;
	const sessions = options.providerSessionState;
	if (sessions) {
		const existing = sessions.get(sessionKey);
		const saveDir = path.join(antigravitySdkDir(), "sessions", auth.accountKey, options.sessionId ?? "default");
		const host = existing instanceof AntigravitySdkHost ? existing : new AntigravitySdkHost(saveDir);
		if (host !== existing) sessions.set(sessionKey, host);
		await host.step(model, context, options, writer);
		return;
	}

	const latest = context.messages.findLast(msg => msg.role === "assistant");
	const payload = latest?.role === "assistant" ? latest.providerPayload : undefined;
	const retainedKey =
		options.sessionId ??
		(payload?.type === "antigravitySdk" ? payload.conversationId : undefined) ??
		crypto.randomUUID();
	const fullKey = `${auth.accountKey}:${retainedKey}`;
	const retained = implicitSdkSessions.get(fullKey);
	clearTimeout(retained?.idle);
	const saveDir = path.join(antigravitySdkDir(), "sessions", auth.accountKey, retainedKey);
	const host = retained?.host ?? new AntigravitySdkHost(saveDir);
	const entry: RetainedSdkHost = retained ?? { host };
	implicitSdkSessions.set(fullKey, entry);

	try {
		await host.step(model, context, options, writer);
	} finally {
		if (host.hasPendingTurn || options.sessionId) {
			retireWhenIdle(fullKey, entry);
		} else {
			implicitSdkSessions.delete(fullKey);
			await host.dispose();
		}
	}
}

function retireWhenIdle(key: string, entry: RetainedSdkHost): void {
	entry.idle = setTimeout(() => {
		if (implicitSdkSessions.get(key) !== entry) return;
		if (entry.host.hasPendingTurn) {
			retireWhenIdle(key, entry);
			return;
		}
		void entry.host.dispose();
		implicitSdkSessions.delete(key);
	}, IDLE_MS);
	entry.idle.unref();
}
