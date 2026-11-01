import { describe, it, expect } from "bun:test";
import {
  SharkEventBus,
  SharkSessionManager,
  SharkPermissionManager,
  type SharkEvent,
} from "../src/index";

describe("Shark Kernel (Module 1 - Architectural Foundation)", () => {
  it("Test 1: should publish typed events and deliver to specific and wildcard subscribers", () => {
    const bus = new SharkEventBus();
    const specificEvents: SharkEvent[] = [];
    const wildcardEvents: SharkEvent[] = [];

    bus.subscribe("session.started", (ev) => {
      specificEvents.push(ev);
    });

    bus.subscribe("*", (ev) => {
      wildcardEvents.push(ev);
    });

    const event: SharkEvent = {
      type: "session.started",
      sessionId: "session-001",
      workingDirectory: "/workspace/omsk",
      timestamp: Date.now(),
    };

    bus.emit(event);

    expect(specificEvents.length).toBe(1);
    expect(specificEvents[0].type).toBe("session.started");
    if (specificEvents[0].type === "session.started") {
      expect(specificEvents[0].sessionId).toBe("session-001");
    }

    expect(wildcardEvents.length).toBe(1);
    expect(wildcardEvents[0].type).toBe("session.started");
  });

  it("Test 2: should filter history and correctly replay past events", () => {
    const bus = new SharkEventBus();
    const t0 = 1000;
    const t1 = 2000;

    bus.emit({
      type: "tool.discovered",
      toolId: "ripgrep",
      origin: "builtin",
      riskLevel: "low",
      timestamp: t0,
    });

    bus.emit({
      type: "file.changed",
      path: "src/main.ts",
      changeType: "update",
      hash: "abc12345",
      timestamp: t1,
    });

    const toolEvents = bus.getHistory({ type: "tool.discovered" });
    expect(toolEvents.length).toBe(1);
    expect(toolEvents[0].type).toBe("tool.discovered");

    const replayed: SharkEvent[] = [];
    bus.replay(1500, (ev) => {
      replayed.push(ev);
    });

    expect(replayed.length).toBe(1);
    expect(replayed[0].type).toBe("file.changed");
  });

  it("Test 3: should manage session lifecycle, active task tracking, and completion", () => {
    const bus = new SharkEventBus();
    const sessionManager = new SharkSessionManager(bus);

    expect(sessionManager.getActiveSession()).toBeNull();

    const session = sessionManager.initSession("sess-42", "/home/omsk");
    expect(session.id).toBe("sess-42");
    expect(session.state).toBe("running");

    sessionManager.runTask("task-101", "Refactor kernel event bus");
    let current = sessionManager.getActiveSession();
    expect(current?.activeTaskId).toBe("task-101");

    sessionManager.completeTask("task-101", "chk-01", ["packages/kernel/src/event-bus.ts"]);
    current = sessionManager.getActiveSession();
    expect(current?.activeTaskId).toBeUndefined();
    expect(current?.tasksCompleted).toBe(1);

    sessionManager.pauseSession();
    expect(sessionManager.getActiveSession()?.state).toBe("paused");

    sessionManager.resumeSession();
    expect(sessionManager.getActiveSession()?.state).toBe("running");

    const finished = sessionManager.finishSession();
    expect(finished.state).toBe("finished");
    expect(typeof finished.endTime).toBe("number");
  });

  it("Test 4: should validate capability-based permissions, risk tiers, and reject unauthorized operations", () => {
    const permissions = new SharkPermissionManager(["read:project"]);

    expect(permissions.has("read:project")).toBe(true);
    expect(permissions.has("write:outside")).toBe(false);

    expect(permissions.classifyRisk("read:project")).toBe("low");
    expect(permissions.classifyRisk("execute:shell")).toBe("high");
    expect(permissions.classifyRisk("access:credentials")).toBe("critical");

    expect(() => permissions.require("read:project")).not.toThrow();

    expect(() => permissions.require("write:outside")).toThrow(/Access Denied/);

    permissions.grant("write:outside");
    expect(permissions.has("write:outside")).toBe(true);
    expect(() => permissions.require("write:outside")).not.toThrow();

    permissions.revoke("write:outside");
    expect(permissions.has("write:outside")).toBe(false);
    expect(() => permissions.require("write:outside")).toThrow(/Access Denied/);
  });

  it("Test 5: should ensure dispatcher resilience with error isolation when a subscriber throws", () => {
    const bus = new SharkEventBus();
    const successfulEvents: string[] = [];

    // Faulty listener
    bus.subscribe("task.planned", () => {
      throw new Error("Crash in faulty third-party subscriber!");
    });

    // Good listener
    bus.subscribe("task.planned", (ev) => {
      if (ev.type === "task.planned") {
        successfulEvents.push(ev.taskId);
      }
    });

    expect(() => {
      bus.emit({
        type: "task.planned",
        taskId: "task-resilient-1",
        objective: "Test resilience",
        operationCount: 1,
        timestamp: Date.now(),
      });
    }).not.toThrow();

    expect(successfulEvents).toEqual(["task-resilient-1"]);
  });
});
