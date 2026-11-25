"""
NDJSON sidecar worker bridging oh-my-shark (`antigravity-sdk` API) with the
official Google Antigravity Python SDK (`google-antigravity`).

Stdout is strictly reserved for one JSON object per line (NDJSON).
Diagnostics and tracebacks are written only to stderr.
"""

from __future__ import annotations

import asyncio
import json
import os
import sys
from typing import Any


def emit(payload: dict[str, Any]) -> None:
    sys.stdout.write(json.dumps(payload, ensure_ascii=False) + "\n")
    sys.stdout.flush()


def extract_usage(response: Any) -> dict[str, int] | None:
    usage = getattr(response, "usage", None) or getattr(response, "usage_metadata", None)
    if usage is None:
        return None
    mapping: dict[str, int] = {}
    for src, dst in (
        ("input_tokens", "input_tokens"),
        ("prompt_token_count", "input_tokens"),
        ("output_tokens", "output_tokens"),
        ("candidates_token_count", "output_tokens"),
        ("cached_content_token_count", "cached_tokens"),
        ("cached_tokens", "cached_tokens"),
        ("thought_tokens", "thinking_tokens"),
        ("thoughts_token_count", "thinking_tokens"),
        ("total_tokens", "total_tokens"),
        ("total_token_count", "total_tokens"),
    ):
        val = usage.get(src) if isinstance(usage, dict) else getattr(usage, src, None)
        if isinstance(val, int) and val >= 0:
            mapping.setdefault(dst, val)
    return mapping or None


class SdkWorker:
    def __init__(self) -> None:
        self.agent: Any = None
        self.active_task: asyncio.Task[None] | None = None
        self.active_req_id: str | None = None

    async def close_agent(self) -> None:
        if self.agent is not None:
            try:
                await self.agent.__aexit__(None, None, None)
            except Exception as exc:
                sys.stderr.write(f"[antigravity-sdk] cleanup warning: {exc}\n")
            finally:
                self.agent = None

    async def handle_init(self, cmd: dict[str, Any]) -> None:
        req_id = cmd["id"]
        try:
            from google.antigravity import Agent, CapabilitiesConfig, LocalAgentConfig
            from google.antigravity.hooks.policy import allow, deny
            from google.antigravity.types import McpStreamableHttpServer
        except ImportError as exc:
            emit(
                {
                    "id": req_id,
                    "type": "error",
                    "code": "SDK_NOT_INSTALLED",
                    "message": (
                        f"Failed to import google.antigravity ({exc}). "
                        "Install via `pip install google-antigravity` inside the sidecar venv."
                    ),
                }
            )
            return

        await self.close_agent()

        auth = cmd.get("auth") or {}
        mode = auth.get("mode", "gemini_api")
        if auth.get("api_key"):
            if mode in ("vertex_express", "vertex_adc"):
                os.environ["GOOGLE_CLOUD_API_KEY"] = str(auth["api_key"])
            else:
                os.environ["GEMINI_API_KEY"] = str(auth["api_key"])

        mcp_servers = []
        mcp_cfg = cmd.get("mcp")
        if mcp_cfg:
            mcp_servers.append(
                McpStreamableHttpServer(
                    name=str(mcp_cfg.get("name", "harness_tools")),
                    url=str(mcp_cfg["url"]),
                    headers=dict(mcp_cfg.get("headers") or {}),
                )
            )

        # Fail-closed baseline: only tools mediated by the harness MCP broker are allowed
        # unless the caller explicitly selects read-only built-in SDK inspection tools.
        policies = [deny("*"), allow("mcp:*")]
        if cmd.get("policy_profile") == "workspace_read":
            policies.extend(
                [
                    allow("list_directory"),
                    allow("search_directory"),
                    allow("find_file"),
                    allow("view_file"),
                ]
            )

        if mode == "litert":
            from google.antigravity import LiteRTAgentConfig

            model_path = cmd.get("litert_model_path") or os.path.expanduser(
                "~/.litert-lm/models/gemma4-26b/model.litertlm"
            )
            config = LiteRTAgentConfig(
                model_path=model_path,
                system_instructions=cmd.get("system_instructions"),
                mcp_servers=mcp_servers,
                policies=policies,
                save_dir=cmd.get("save_dir"),
                conversation_id=cmd.get("conversation_id"),
            ).lightweight()
        else:
            kwargs: dict[str, Any] = {
                "model": cmd["model"],
                "save_dir": cmd.get("save_dir"),
                "conversation_id": cmd.get("conversation_id"),
                "mcp_servers": mcp_servers,
                "policies": policies,
                "capabilities": CapabilitiesConfig(
                    enabled_tools=cmd.get("enabled_tools"),
                    disabled_tools=cmd.get("disabled_tools"),
                ),
            }
            if cmd.get("system_instructions"):
                kwargs["system_instructions"] = cmd["system_instructions"]
            if mode == "vertex_express":
                kwargs["vertex"] = True
                if auth.get("api_key"):
                    kwargs["api_key"] = auth["api_key"]
            elif mode == "vertex_adc":
                kwargs["vertex"] = True
                if auth.get("project"):
                    kwargs["project"] = auth["project"]
                if auth.get("location"):
                    kwargs["location"] = auth["location"]
            elif auth.get("api_key"):
                kwargs["api_key"] = auth["api_key"]

            if cmd.get("base_url") and mode == "gemini_api":
                # Preserve explicit gateway URL overrides when supplied.
                kwargs["base_url"] = cmd["base_url"]

            config = LocalAgentConfig(**kwargs)

        self.agent = Agent(config)
        await self.agent.__aenter__()
        emit(
            {
                "id": req_id,
                "type": "session_ready",
                "conversation_id": getattr(self.agent, "conversation_id", None),
                "model": cmd["model"],
            }
        )

    async def handle_chat(self, cmd: dict[str, Any]) -> None:
        req_id = cmd["id"]
        if self.agent is None:
            emit({"id": req_id, "type": "error", "code": "NO_SESSION", "message": "SDK session not initialized"})
            return

        emit({"id": req_id, "type": "started"})
        try:
            parts = cmd.get("parts") or []
            prompt_items: list[Any] = []
            from google.antigravity.types import Image, from_file

            for part in parts:
                ptype = part.get("type")
                if ptype == "text":
                    prompt_items.append(part["text"])
                elif ptype == "image" and part.get("data"):
                    import base64

                    prompt_items.append(
                        Image(
                            data=base64.b64decode(part["data"]),
                            mime_type=part.get("mime_type", "image/png"),
                        )
                    )
                elif ptype in ("image", "document") and part.get("path"):
                    prompt_items.append(from_file(part["path"]))

            payload: Any = prompt_items[0] if len(prompt_items) == 1 else prompt_items
            response = await self.agent.chat(payload)

            async def pump_text() -> None:
                async for token in response:
                    if token:
                        emit({"id": req_id, "type": "text_delta", "text": str(token)})

            async def pump_thoughts() -> None:
                thoughts = getattr(response, "thoughts", None)
                if thoughts is None:
                    return
                async for thought in thoughts:
                    if thought:
                        emit({"id": req_id, "type": "thinking_delta", "text": str(thought)})

            async def pump_calls() -> None:
                tool_calls = getattr(response, "tool_calls", None)
                if tool_calls is None:
                    return
                async for call in tool_calls:
                    emit(
                        {
                            "id": req_id,
                            "type": "tool_event",
                            "name": getattr(call, "name", "unknown"),
                            "args": getattr(call, "args", {}),
                            "status": "started",
                        }
                    )

            await asyncio.gather(pump_text(), pump_thoughts(), pump_calls())
            usage = extract_usage(response)
            if usage:
                emit({"id": req_id, "type": "usage", **usage})
            emit(
                {
                    "id": req_id,
                    "type": "completed",
                    "conversation_id": getattr(self.agent, "conversation_id", None),
                    "stop_reason": "stop",
                }
            )
        except asyncio.CancelledError:
            emit({"id": req_id, "type": "cancelled"})
            raise
        except Exception as exc:
            emit({"id": req_id, "type": "error", "code": type(exc).__name__, "message": str(exc)})


async def main() -> None:
    worker = SdkWorker()

    try:
        while True:
            raw_line = await asyncio.to_thread(sys.stdin.buffer.readline)
            if not raw_line:
                break
            line = raw_line.decode("utf-8", errors="replace").strip()
            if not line:
                continue
            try:
                cmd = json.loads(line)
            except json.JSONDecodeError as exc:
                emit({"id": None, "type": "error", "code": "INVALID_JSON", "message": str(exc)})
                continue

            ctype = cmd.get("type")
            if ctype == "init_session":
                try:
                    await worker.handle_init(cmd)
                except Exception as exc:
                    emit({"id": cmd.get("id"), "type": "error", "code": type(exc).__name__, "message": str(exc)})
            elif ctype == "chat":
                if worker.active_task and not worker.active_task.done():
                    emit(
                        {
                            "id": cmd.get("id"),
                            "type": "error",
                            "code": "BUSY",
                            "message": "Another chat request is already running",
                        }
                    )
                    continue
                worker.active_req_id = cmd.get("id")
                worker.active_task = asyncio.create_task(worker.handle_chat(cmd))
            elif ctype == "cancel":
                if worker.active_task and not worker.active_task.done():
                    worker.active_task.cancel()
            elif ctype == "shutdown":
                if worker.active_task and not worker.active_task.done():
                    worker.active_task.cancel()
                break
            else:
                emit({"id": cmd.get("id"), "type": "error", "code": "UNKNOWN_COMMAND", "message": str(ctype)})
    finally:
        await worker.close_agent()


if __name__ == "__main__":
    asyncio.run(main())
