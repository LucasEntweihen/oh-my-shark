/** Compile-time, directional wire contracts; never imported by the application. */
import type * as Core from "../../../coding-agent/src/modes/rpc/rpc-types";
import type { SessionStats } from "../../../coding-agent/src/session/agent-session";
import type { AgentSessionEvent as CoreAgentSessionEvent } from "../../../coding-agent/src/session/agent-session-events";
import type * as Gui from "../../src/shared/rpc-types";

// Numeric/string enum members cross JSON as their primitive values, not nominal TS enum types.
type Wire<T> = T extends string ? `${T}` : T extends object ? { [K in keyof T]: Wire<T[K]> } : T;
type Accepts<Consumer, Producer extends Consumer> = Producer;

type SharedCoreCommand = Extract<
	Core.RpcCommand,
	{ type: "negotiate_protocol" | "prompt" | "steer" | "follow_up" | "abort" | "get_state" | "get_messages" }
>;
export type Commands = Accepts<Wire<SharedCoreCommand>, Extract<Gui.RpcCommand, { type: SharedCoreCommand["type"] }>>;

type MaintenanceEventType =
	| "manual_compaction_start"
	| "manual_compaction_end"
	| "cache_warming_start"
	| "cache_warming_end";
export type MaintenanceEvents = Accepts<
	Extract<Gui.AgentSessionEvent, { type: MaintenanceEventType }>,
	Wire<Extract<CoreAgentSessionEvent, { type: MaintenanceEventType }>>
>;
export type Stats = Accepts<Gui.SessionStats, Wire<SessionStats>>;
export type RpcChunkFrame = Accepts<Gui.RpcChunkFrame, Wire<Core.RpcChunkFrame>>;
export type RpcLiveFrame = Accepts<Gui.RpcLiveFrame, Wire<Core.RpcLiveFrame>>;
export type RpcReadyFrame = Accepts<Gui.RpcReadyFrame, Wire<Core.RpcReadyFrame>>;
