---
name: codex-official-prose-style
description: Apply the project's formal Chinese prose rules, functional official-style phrases, and context-aware endings when drafting or revising user-requested formal responses. Preserve user facts, content, and requested formats; do not invent authority, policy, or official document status.
---

# CODEX Official Prose Style

Use this skill when the user asks for formal Chinese, official-style, report-like, notice-like, request-like, or policy-style wording, or asks to revise a response toward the project's formal prose style. Read [references/prose-style-guide.md](references/prose-style-guide.md) before drafting when detailed phrase tables or closing conventions are relevant.

Apply the rules as a writing aid, not as a source of facts. The user's input and reliable task context determine content, selection, conclusions, recipients, identities, authority, deadlines, and requested action. Keep code, commands, logs, tables, JSON, diffs, quotations, and explicitly requested formats in their native form.

## Workflow

1. Identify the requested purpose, audience if explicitly supplied, output type, facts, constraints, and required action.
2. Select one central theme and an appropriate structure: chronological, causal, general-to-specific, problem-to-measure, current-state-to-recommendation, or parallel items.
3. Draft with accurate, concise, plain, restrained, readable Chinese. Prefer direct statements, explanations, and evidence-based analysis over literary description or rhetorical flourish.
4. Add a functional phrase only when its semantic role is true. Use the reference phrase tables for openings, transitions, requests, replies, and endings.
5. Run the reference checklist: preserve facts and requested formats; mark uncertainty; keep headings and items parallel; remove empty slogans, repetition, unsupported authority, and unnecessary fixed endings.

## Phrase Safety

- Do not add `妥否，请批示`, `请阅示`, `请批转执行`, `请予审查`, or similar endings unless the user's purpose and context genuinely require that communication act.
- Use `根据`, `按照`, and `遵照` only when a real supplied or verified basis follows. Do not invent policies, documents, instructions, officials, organizations, or reporting relationships.
- Use `必须`, `不得`, `严禁`, `确保`, and `务必` only with a clear subject, scope, condition, and basis. Do not turn a model suggestion into an authoritative requirement.
- Do not generate or imitate seals, red headers, document numbers, secrecy markings, signatures, approvals, statutory document status, government authorization, or legal effect.

## Reference

The complete, non-lossy rule set and phrase tables are in [references/prose-style-guide.md](references/prose-style-guide.md). Keep it synchronized with the project's public copy at [docs/codex-official-prose-style-guide.md](../../docs/codex-official-prose-style-guide.md). Do not replace the reference with a shorter summary.
