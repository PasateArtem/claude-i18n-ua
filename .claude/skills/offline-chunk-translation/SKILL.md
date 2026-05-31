---
name: offline-chunk-translation
description: Offline localization workflow for translating prepared JSONL chunks, especially zh-CN UI locale chunks, while preserving keys, placeholders, ICU MessageFormat, tags, and chunk order. Use when Codex is asked to translate localization chunks, coordinate chunk translation with subagents when available, or fall back to a sequential chunk-by-chunk process without web search, online translation services, reference translation files, or special scripts unless the user explicitly requests those.
---

# Offline Chunk Translation

## Core Boundary

Default to offline chunk translation. Unless the user explicitly requests reference translation files, repository-specific translation tools, scripts, web research, or external services, only read the chunk inputs and minimal local instructions needed to write the requested chunk outputs.

Do not use web search, online translators, translation APIs, remote repositories, git history, generated distribution files, existing target-locale files, or other translated locale files by default. Do not run specialized translation tooling by default. If the user explicitly asks to prepare, apply, merge, or validate with repository tooling, inspect only the current supported local workflow and follow it; for Node package management, prefer `pnpm` when a package manager is needed.

## Input And Output Contract

Expect JSONL input chunks. Each line usually contains:

- `file`, `index`, `key`, `en`
- optional `ja`, `op`, `beforeEn`, `currentTarget`

Write JSONL output chunks. Each output line must keep `file`, `index`, and `key` unchanged and add the translated value:

```json
{"file":"main","index":0,"key":"example.key","zh":"示例译文"}
```

Use `zh` as the output field for zh-CN workflows. Use another field only when the manifest or user explicitly specifies one. Never print full translated chunks in chat; write them to the requested output path.

## Workflow

1. Identify the target locale, chunk manifest if present, input chunk paths, output chunk paths, and output field. If any required path is missing and cannot be inferred from a manifest, ask one concise question.
2. Tell the user the execution mode, target locale, and chunk count before starting. Keep progress updates short and practical.
3. Confirm whether the current runtime supports subagents. Treat subagents as supported only when a concrete subagent tool is visible and callable. If support is unclear, treat it as unavailable.
4. If subagents are supported, assign chunks through a bounded pool of subagents. Every subagent prompt must use the preset prompt in this skill, filled with exact input and output paths. Give each subagent exactly one chunk unless the user explicitly asks for larger batches.
5. If subagents are unavailable or a spawn attempt fails, fall back to sequential processing. If the runtime has a todo, checklist, or plan tool, define the chunks in the plan before translating and update statuses as each chunk completes.
6. For every chunk, read all input rows, translate from `en` as the source of truth, use `ja` only as context when present, use `currentTarget` only for terminology continuity, and use `beforeEn` only to understand the source change.
7. Validate each output chunk before moving on. Fix validation failures immediately within the same chunk when possible.
8. At completion, report output paths, counts, validation status, and the next user-actionable step. Do not apply or merge outputs unless the user requested that stage.

## Preset Subagent Prompt

Use this exact prompt structure when spawning subagents. Fill every placeholder before sending. Keep the hard boundaries intact.

```text
You are an offline localization worker for {TARGET_LOCALE} ({TARGET_LANGUAGE_NAME}). You own exactly one chunk.

Input chunk:
{INPUT_CHUNK_PATH}

Output chunk:
{OUTPUT_CHUNK_PATH}

Hard boundaries:
1. Read the input JSONL chunk and write the output JSONL chunk.
2. Do not read existing target-locale files, other translated locale files, generated distribution files, git history, remote repositories, websites, or online translation services.
3. Do not use translator APIs, browser translation, web search, or special translation scripts unless this prompt explicitly says to.
4. Do not modify any file except the output chunk path.
5. Do not print the translated content in chat.

Input rules:
1. Each input line contains file, index, key, en, and may contain ja, op, beforeEn, currentTarget.
2. Translate according to en. If ja exists, use it only as contextual help.
3. If en and ja conflict, en wins.
4. If currentTarget exists, use it only for terminology continuity; do not mechanically reuse it.
5. If beforeEn exists, use it only to understand what changed.

Output rules:
1. Output JSONL with one object per input row.
2. Preserve row count and order exactly.
3. Preserve file, index, and key exactly.
4. Write only the translated value in the {OUTPUT_FIELD} field.
5. Every translated value must be a non-empty string.

Style for zh-CN:
1. Use natural, clear, modern Simplified Chinese.
2. Prefer "你/你的"; avoid mixing in "您/您的".
3. Make UI labels short and product-like.
4. Use natural error phrasing such as "无法...", "...失败", and "请重试".
5. Keep explanatory copy complete and fluent.
6. Translate sample prompts conversationally without changing the task intent.
7. Avoid Japanese-style Chinese.

Must preserve:
1. Product and technical names such as Claude, Anthropic, Claude Code, Claude Code Desktop, Claude for Chrome, Cowork, Dispatch, Canvas, Artifact, MCP, API, OAuth, SAML, SCIM, SSO, AWS, Google, GitHub, Slack, Microsoft 365, VS Code, Cursor, Windsurf, Opus, Sonnet, Haiku, Pro, Max, Team, Enterprise.
2. File paths, commands, environment variables, URLs, emails, domains, model names, keyboard shortcuts, and code snippets.
3. Placeholders such as {name}, {count}, {date}.
4. HTML/XML tag names and pairing such as <link>...</link> and <b>...</b>.
5. ICU MessageFormat variable names, plural/select branches, one, other, =0, #, number/date/time formats.
6. Newlines, Markdown markers, bullets, and meaningful spacing.

Self-check before finishing:
1. Output line count equals input line count.
2. Row order and file/index/key match exactly.
3. No translated value is empty.
4. No translated value contains the replacement character, TODO, or obvious large untranslated English.
5. For zh-CN output, no Japanese kana appears unless it is part of a brand or code literal.
6. Placeholder, tag, URL, email, code, and ICU structure are preserved.

Final response only:
output: {OUTPUT_CHUNK_PATH}
count: <number of rows>
status: done
```

## Sequential Fallback

When subagents are unavailable or fail, process chunks one at a time using the same per-chunk rules as the preset prompt. Before starting, create a visible todo/checklist/plan when the runtime provides one. For many chunks, group the visible plan into small ranges but still validate every individual chunk.

After each chunk:

- write the output file
- run available local validation only if the user requested validation or validation is part of the provided chunk workflow
- otherwise perform manual structural checks for row count, order, non-empty values, placeholders, tags, URLs, emails, code spans, and ICU structures
- update the user or plan with the chunk status

## Quality Checks

For every translated value:

- Preserve meaning from English first.
- Keep UI strings concise without losing important detail.
- Keep placeholders and ICU syntax byte-for-byte where syntax matters.
- Keep product names and technical names unchanged unless the source clearly uses a generic word.
- Preserve markup tags exactly, translating only the human-readable text around or inside them.
- Preserve escaped newlines and formatting markers.
- Avoid untranslated English except for names, brands, commands, code, paths, URLs, domains, emails, model names, and accepted technical terms.
- Avoid hallucinating missing context. If a row cannot be translated safely because the source is malformed or ambiguous, report the key and pause for user input.

## User Experience

Be explicit but not noisy. Tell the user what mode is being used, how many chunks are in scope, and where outputs will be written. During long runs, send brief progress updates about completed chunks and validation issues. When something unexpected happens, state the exact chunk/key/path involved, what was expected, what was found, and the next safe action.

Do not surprise the user with broader repository changes. Translation, validation, prepare, apply, merge, and cleanup are separate stages unless the user asked for an end-to-end run.
