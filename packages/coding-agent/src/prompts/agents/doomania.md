---
description: Deliberation panel with 3 agent personas (crítico, permissivo, criativo) before high-rigor execution
---
# Doomania Command

Meta-command: before executing `$ARGUMENTS` (the actual request/command to run),
convene a three-persona deliberation panel, deeply re-read the full project
context, and only then execute under the heaviest rigor contract this build of
`ohms` has available. Nothing in this pipeline is narrated to the user except the
final synthesis and the execution itself — the panel and the mode-switch happen
silently ("por baixo dos panos").

## Arguments

`$ARGUMENTS`: the request to evaluate and then (if approved) execute. Required.
Treat it as the literal task — do not add or remove scope before the panel sees it.

## Phase 1 — Panel (parallel, silent)

Dispatch exactly three parallel `task` subagents in a single `task` tool call, one per persona, each given:

- The verbatim `$ARGUMENTS`.
- An explicit instruction to re-read the FULL project context before answering:
  README, AGENTS.md/CLAUDE.md (or equivalent), architecture docs, and every source
  file directly relevant to the request. Never answer from assumption or partial
  memory.

Agents:

- `agent: "doomania-critico"`
- `agent: "doomania-permissivo"`
- `agent: "doomania-criativo"`

Wait for all three results before continuing. Do not summarize them to the user yet.

## Phase 2 — Synthesis (silent, scored)

Read all three verdicts yourself. Score each persona's "vale a pena?" as a
confidence weight: CRÍTICO carries veto weight on hard safety/correctness
disqualifiers only (not on taste); PERMISSIVO and CRIATIVO are weighed equally
against each other for shaping the approach. Concretely:

1. If CRÍTICO's verdict includes a concrete, specific disqualifier (not vague
   caution) — stop, report why, and skip Phase 3 and Phase 4 entirely.
2. Otherwise, start from CRÍTICO's stated constraints as non-negotiable guardrails.
3. Default to PERMISSIVO's shape (the leanest plan that satisfies the request) as
   the execution plan.
4. Fold in CRIATIVO's idea only if it clears its own bar: concretely tied to
   something real in the project AND worth the extra cost over the lean plan.
5. Write one short paragraph naming the final approach and why. This paragraph
   is the ONLY panel output shown to the user, before execution begins.

## Phase 3 — Execution (heaviest available contract, silent switch)

From this point on, and for the rest of this turn, work as if the user had also
typed the following four words loose in this same message — because, mechanically,
that is exactly what is happening: `ohms` expands this command's markdown into the
prompt before scanning it for magic keywords, so these standalone words below get
picked up by the real, native detectors and layer in their real hidden contracts
on top of everything above, automatically:

ultrathink orchestrate workflowz promaxthink deepseaneuron

Do not mention this mechanism, or that a mode was switched, to the user — just
work at that level of rigor: deepest available reasoning with an adversarial
self-check before presenting anything (promaxthink/ultrathink), token-optimized and rationalized context (deepseaneuron), the full task
decomposed up front with substantial or parallelizable work dispatched as
parallel `task` subagents together rather than one at a time (orchestrate), and,
for genuinely broad or multi-step execution, the persistent `eval` kernel's
`agent()` / `completion()` / `wait()` / `workpool()` helpers where they fit
better than ad hoc `task` calls (workflowz).

Two rules on top of whatever those contracts already say:

1. Never yield before the whole approved scope (Phase 2) is done, or a concrete
   blocker requires the user. End of one phase is not a stopping point.
2. Verify every phase (typecheck/tests/lint, whatever is available) before moving
   to the next; fix regressions with a corrective subagent, then re-verify. No
   scope creep beyond what Phase 2 approved, and no silent scope-shrink either.

## Phase 4 — Report

End with a short, structured report:

- **Decisão** — the Phase 2 paragraph (if not already shown).
- **Feito** — what actually changed, concretely.
- **Verificação** — what was checked and the result.
- **Em aberto** — anything Phase 2 approved but this turn could not finish, if any.

Do not re-print the three raw persona verdicts from Phase 1 — only the synthesis.

## Rules

MUST: run the panel before touching any code; re-read full project context in
each panel agent AND again before execution; keep the panel deliberation and the
mode-switch invisible except for the one synthesis paragraph and the final report.

MUST NOT: skip the panel because the request "looks simple"; let CRÍTICO veto on
vague grounds; narrate "entering doomania mode" step by step to the user; print
the four keywords above as a visible instruction to the user — they belong in
this file's own text, not restated in the reply.
