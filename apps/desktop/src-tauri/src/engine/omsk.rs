//! OMSK (OhMyShark) engine adapter.
//!
//! Dedicated first-class engine adapter for OhMyShark (OMSK / OHMS).
//! Connects native Desktop CC GUI to the OMSK autonomous coding harness
//! via RPC-UI and ACP (Agent Control Protocol) transports.
//!
//! Protocol invariants:
//! - Entrypoint: `omsk --mode rpc-ui` (or `omsk --mode acp` for transactional plan mode).
//! - Stored state: `~/.omsk/agent/` (sessions in `sessions/`, credentials in SQLite `agent.db`).
//! - Binary resolution order: `omsk` -> `ohms` -> `bun packages/coding-agent/src/cli.ts` -> `omp`.
//! - Protocol framing: NDJSON with v2 chunking negotiation (`negotiate_protocol` / `rpc_chunk`),
//!   state handshake (`get_state`), and interactive question dialogs (`extension_ui_request`).
//! - Approval mode: full support for "auto", "bypass" (--auto-approve), and "plan" (ACP plan review).

use super::{
    command_for_binary, images, push_session_id, BuiltCommand, Engine, EngineEvent, SendRequest,
};
use serde_json::Value;
use std::path::{Path, PathBuf};
use std::sync::{Mutex, OnceLock};

pub struct OmskEngine {
    id: &'static str,
    home_dir_name: &'static str,
    rpc_chunks: Mutex<std::collections::HashMap<String, Vec<Option<Vec<u8>>>>>,
    served_models_file: OnceLock<Option<PathBuf>>,
}

impl OmskEngine {
    pub fn new() -> Self {
        Self {
            id: "omsk",
            home_dir_name: ".omsk",
            rpc_chunks: Mutex::new(std::collections::HashMap::new()),
            served_models_file: OnceLock::new(),
        }
    }

    pub fn ohms() -> Self {
        Self {
            id: "ohms",
            home_dir_name: ".omsk",
            rpc_chunks: Mutex::new(std::collections::HashMap::new()),
            served_models_file: OnceLock::new(),
        }
    }
}

impl Default for OmskEngine {
    fn default() -> Self {
        Self::new()
    }
}

pub fn omsk() -> OmskEngine {
    OmskEngine::new()
}

pub fn ohms() -> OmskEngine {
    OmskEngine::ohms()
}

/// Ask bridge extension content for OMSK/Pi family interactive questions.
const OMSK_ASK_BRIDGE: &str = r#"// OMSK Desktop ask bridge — session interactive questions
import fs from "node:fs";

export default function(ctx: any) {
  if (ctx?.ui?.registerTool) {
    ctx.ui.registerTool({
      name: "ask_user",
      description: "Ask the user one or more questions with choices or free text",
      parameters: {
        type: "object",
        properties: {
          questions: {
            type: "array",
            items: {
              type: "object",
              properties: {
                id: { type: "string" },
                question: { type: "string" },
                options: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      label: { type: "string" },
                      description: { type: "string" }
                    },
                    required: ["label"]
                  }
                }
              },
              required: ["id", "question", "options"]
            }
          }
        },
        required: ["questions"]
      },
      execute: async (args: any) => {
        if (!args?.questions?.length) return { answers: {} };
        const answers: Record<string, string> = {};
        for (const q of args.questions) {
          const choices = (q.options || []).map((opt: any) => opt.label);
          const answer = await ctx.ui.select(q.question, choices);
          answers[q.id] = answer;
        }
        return { answers };
      }
    });
  }
}
"#;

fn ensure_omsk_ask_bridge() -> Result<String, String> {
    let dir = crate::paths::app_home().join("omsk-extensions");
    std::fs::create_dir_all(&dir)
        .map_err(|e| format!("create omsk extension dir {}: {e}", dir.display()))?;
    let path = dir.join("omsk-ask-bridge.ts");
    let stale = std::fs::read_to_string(&path)
        .map(|current| current != OMSK_ASK_BRIDGE)
        .unwrap_or(true);
    if stale {
        std::fs::write(&path, OMSK_ASK_BRIDGE)
            .map_err(|e| format!("write omsk ask bridge {}: {e}", path.display()))?;
    }
    Ok(path.to_string_lossy().into_owned())
}

/// ACP plan requested condition.
pub(crate) fn omsk_acp_plan_requested(req: &SendRequest) -> bool {
    req.permission.as_deref() == Some("plan")
}

fn build_omsk_acp_plan_command(
    req: &SendRequest,
    mut cmd: tokio::process::Command,
) -> Result<BuiltCommand, String> {
    if req.session_id.is_some() {
        return Err(
            "OMSK ACP plan sessions must start fresh: approval state is in-memory for safety."
                .to_string(),
        );
    }

    // Set OMSK storage environment
    let omsk_home = std::env::var("OMSK_HOME")
        .or_else(|_| std::env::var("PI_CODING_AGENT_DIR"))
        .unwrap_or_else(|_| {
            let home = dirs::home_dir().unwrap_or_else(|| PathBuf::from("."));
            home.join(".omsk").join("agent").to_string_lossy().into_owned()
        });
    cmd.env("PI_CODING_AGENT_DIR", &omsk_home);

    let mcp_restore = if req.memory_bot.is_some() {
        let bot_id = req.memory_bot.as_deref().unwrap_or_default();
        cmd.env(crate::memory::mcp::BOT_ENV, bot_id);
        crate::computer_use::inject_workspace_mcp(
            &req.workspace,
            &[crate::memory::mcp::server_spec()?],
        )?
    } else {
        None
    };

    cmd.args(["--mode", "acp"]);

    if req.model.as_deref().is_some_and(|m| {
        m.strip_prefix("openai-codex/")
            .is_some_and(|id| !id.is_empty())
    }) {
        if let Some(tier) = req.service_tier.as_deref() {
            if matches!(tier, "default" | "priority") {
                cmd.args(["--service-tier", tier]);
            }
        }
    }

    Ok(BuiltCommand {
        command: cmd,
        stdin_payload: None,
        keep_stdin_open: false,
        cleanup_files: Vec::new(),
        mcp_restore,
        preassigned_session_id: None,
    })
}

impl Engine for OmskEngine {
    fn id(&self) -> &'static str {
        self.id
    }

    fn supports_images(&self) -> bool {
        true
    }

    fn supports_effort(&self) -> bool {
        true
    }

    fn supports_computer_use(&self) -> bool {
        true
    }

    fn supports_memory(&self) -> bool {
        true
    }

    fn supported_permissions(&self) -> &'static [&'static str] {
        &["auto", "bypass", "plan"]
    }

    fn plan_approval(&self) -> crate::engine::plan_review::PlanApproval {
        crate::engine::plan_review::PlanApproval::Typed {
            review_kind: crate::engine::plan_review::PlanReviewKind::NativeRequest,
            evidence: "OMSK Transactional Edit Engine + ACP Plan Mode + FSM Checkpoints",
            limitations: "ACP feedback is binary approve/refine; state is in-memory per turn.",
        }
    }

    fn supports_tool_constraints(&self) -> bool {
        false
    }

    fn build_command(&self, req: &SendRequest, bin: &str) -> Result<BuiltCommand, String> {
        let mut cmd = command_for_binary(bin);

        // Ensure OMSK agent state is cleanly separated into ~/.omsk/agent
        let omsk_home = std::env::var("OMSK_HOME")
            .or_else(|_| std::env::var("PI_CODING_AGENT_DIR"))
            .unwrap_or_else(|_| {
                let home = dirs::home_dir().unwrap_or_else(|| PathBuf::from("."));
                home.join(".omsk").join("agent").to_string_lossy().into_owned()
            });
        cmd.env("PI_CODING_AGENT_DIR", &omsk_home);

        if omsk_acp_plan_requested(req) {
            return build_omsk_acp_plan_command(req, cmd);
        }

        // OMSK runs --mode rpc-ui for interactive GUI communication
        cmd.arg("--mode");
        cmd.arg("rpc-ui");
        cmd.arg("--extension");
        cmd.arg(ensure_omsk_ask_bridge()?);

        if let Some(model) = req.model.as_deref() {
            cmd.arg("--model");
            cmd.arg(model);
        }

        if let Some(effort) = req.effort.as_deref() {
            cmd.arg("--thinking");
            cmd.arg(effort);
        }

        match req.permission.as_deref() {
            Some("bypass") => {
                cmd.arg("--auto-approve");
            }
            _ => {}
        }

        if let Some(session_id) = req.session_id.as_deref() {
            if !session_id.starts_with('-') {
                cmd.arg("--resume");
                cmd.arg(session_id);
            }
        }

        // Add additional workspace directories if requested
        for extra_dir in &req.additional_dirs {
            cmd.arg("--add-dir");
            cmd.arg(extra_dir);
        }

        // Format stdin NDJSON commands
        let mut stdin_lines = Vec::new();

        // 1. Negotiate v2 chunking protocol
        stdin_lines.push(serde_json::json!({
            "id": "negotiate_protocol",
            "type": "negotiate_protocol",
            "protocolVersion": 2
        }).to_string());

        // 2. Query initial agent state
        stdin_lines.push(serde_json::json!({
            "id": "get_state",
            "type": "get_state"
        }).to_string());

        // 3. Issue the prompt
        let prompt_payload = if req.native_compact && req.images.is_empty() {
            serde_json::json!({
                "id": "prompt",
                "type": "compact"
            })
        } else {
            let mut prompt_obj = serde_json::json!({
                "id": "prompt",
                "type": "prompt",
                "message": req.prompt
            });

            // If images are attached, encode as base64 parts
            if !req.images.is_empty() {
                let mut image_parts = Vec::new();
                for img_path in &req.images {
                    if let Some(abs) = images::absolutize_image_path(img_path, &req.workspace) {
                        if let Ok(bytes) = std::fs::read(&abs) {
                            let b64 = base64::engine::general_purpose::STANDARD.encode(&bytes);
                            let mime = if abs.extension().map_or(false, |ext| ext == "png") {
                                "image/png"
                            } else {
                                "image/jpeg"
                            };
                            image_parts.push(serde_json::json!({
                                "type": "image",
                                "data": b64,
                                "mimeType": mime
                            }));
                        }
                    }
                }
                if !image_parts.is_empty() {
                    prompt_obj["images"] = Value::Array(image_parts);
                }
            }

            prompt_obj
        };

        stdin_lines.push(prompt_payload.to_string());

        let stdin_payload = Some(stdin_lines.join("\n") + "\n");

        Ok(BuiltCommand {
            command: cmd,
            stdin_payload,
            keep_stdin_open: true,
            cleanup_files: Vec::new(),
            mcp_restore: None,
            preassigned_session_id: None,
        })
    }

    fn parse_line(&self, line: &str, out: &mut Vec<EngineEvent>) {
        super::pi_family::parse_pi_family_line_for_engine(self.id, None, line, out);
    }
}
