# Magic keywords

Magic keywords are standalone prose words in a user prompt that can add hidden, user-attributed instructions for that turn. Notice injection is enabled by default. The TUI highlights recognized words with animated gradients while editing and static gradients in sent messages; highlighting is a visual affordance and currently remains even when notice injection is disabled in settings.

## Keywords

| Keyword        | Effect                                                                                                                                                                                                                                                                                                                    |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ultrathink`    | Adds a careful multi-step reasoning notice. When automatic thinking is active, it also selects the highest reasoning effort supported by the current model for that turn.                                                                                                                                                 |
| `orchestrate`   | Adds the multi-agent orchestration contract: scope the full task, delegate substantial independent work in parallel, verify each phase, and continue until the request is complete.                                                                                                                                       |
| `workflowz`     | Adds a deterministic multi-subagent workflow contract centered on the persistent `eval` kernel's `agent()`, `completion()`, handle, `wait()`, and `workpool()` helpers. It is intended for broad research, reviews, migrations, and adversarial coverage. The notice is injected only when both `eval` and `task` are active. |
| `promaxthink`   | Adds everything `ultrathink` adds (including the maximum-auto-thinking override) plus a mandatory adversarial self-verification pass before the answer is presented. Heavier than `ultrathink`; reserve it for genuinely hard problems.                                                                                    |

Use the keyword anywhere in the prose of the prompt:

```text
ultrathink about the failure modes before changing this API

orchestrate the migration described in docs/plan.md

workflowz an adversarial review of the authentication changes

promaxthink this architecture decision before I commit to it
```

## Matching rules

Matching is deliberate so source code and paths do not accidentally change agent behavior:

- Use the exact lowercase spelling. `Ultrathink`, `Orchestrate`, `Workflowz`, and `Promaxthink` do not trigger.
- The keyword must be standalone prose. Sentence punctuation and quotes may touch it, but letters, digits, underscores, slashes, backslashes, hyphens, file extensions, symbol references, and call syntax do not match. For example, `orchestrate,` matches; `orchestrated`, `orchestrate.ts`, `foo::orchestrate`, and `orchestrate()` do not.
- Fenced code blocks (backticks or tildes), inline code spans, HTML/XML comments/tags/elements, and their contents are ignored.
- All enabled keywords in one prompt may add their own notice. The visible word remains in the user message; hidden notices are non-displayed custom messages attributed to the user.
- The instruction applies only to the turn containing the keyword.

## Configuration

Open `/settings` and use **Interaction → Magic Keywords**, or change the settings from a shell:

```bash
# Disable every magic keyword
ohms config set magicKeywords.enabled false

# Disable one keyword while leaving the others enabled
ohms config set magicKeywords.ultrathink false
ohms config set magicKeywords.orchestrate false
ohms config set magicKeywords.workflow false
ohms config set magicKeywords.promaxthink false
```

The global switch and four per-keyword switches default to `true`. The global switch gates every hidden notice; a per-keyword switch gates only that notice (and ultrathink's/promaxthink's maximum-auto-thinking override). These settings do not currently disable the editor/message gradient. Run `ohms config list` to inspect every setting and its current value. See [Settings](./settings.md) for configuration scopes, precedence, and project-local overrides.
