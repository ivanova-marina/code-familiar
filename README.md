# Code Familiar

Code Familiar is a TypeScript CLI that reviews frontend pull requests by:

1. Reading your current `git diff`
2. Optionally reading changed files for extra context
3. Letting the model request approved local tools during review
4. Sending context/tool results to the OpenAI API
5. Printing a structured review (formatted text by default, or JSON)

This is a learning project built milestone-by-milestone (see `AGENTS.md`).

## Requirements

- Node.js `v24.11.1` (see `.nvmrc`)
- Git
- An OpenAI API key in `OPENAI_API_KEY`

## Setup

```bash
npm install
```

Create a `.env` file (it is gitignored):

```bash
OPENAI_API_KEY=...
```

Optional:

```bash
CODE_FAMILIAR_MODEL=gpt-4.1-mini
```

## Usage

### Review the current diff

```bash
npm run dev -- review
```

### Flags

- `--staged`: review staged changes (`git diff --staged`)
- `--model <model>`: override the model (or use `CODE_FAMILIAR_MODEL`)
- `--json`: output the validated JSON review to stdout
- `--print-diff`: print the raw diff to stderr (stdout stays clean)
- `--no-context`: don’t read changed files (diff-only review)

### Context limits

When context is enabled (default), the CLI reads a limited amount of extra context:

- Up to 10 changed files
- Up to 50,000 bytes per file (truncated with `…(truncated)`)
- Deleted files are labeled as `[File deleted]`
- Renames/copies include a short note plus the new-path content

### Agent loop

The review agent can expose a small set of local tools to the model:

- `get_git_diff`: read the current repository diff
- `read_file`: read a repository text file for additional context

Tool calls are bounded by a maximum iteration count so the review cannot loop forever.

## Development

```bash
npm test
npm run build
npm run lint
npm run format:check
```

## Project structure

```txt
src/
  cli.ts
  agent/
    reviewAgent.ts
    prompts.ts
    schemas.ts
    tools.ts
  tools/
    git.ts
    fileReader.ts
    openai.ts
  formatters/
    terminalFormatter.ts
```

## Roadmap (WIP)

This project is built milestone-by-milestone. Completed milestones may vary by branch; `AGENTS.md` is the source of truth.

- Milestone 1 — CLI Skeleton (done)
- Milestone 2 — LLM Integration (done)
- Milestone 3 — Structured Output (done)
- Milestone 4 — Tool-Aware Agent (done)
- Milestone 5 — Agent Loop (done): allow the model to request tools iteratively until a final review is produced
- Milestone 6 — Evals (WIP): create sample diffs + expected outputs and measure quality
- Milestone 7 — Human Approval (WIP): require confirmation before high-impact actions
- Milestone 8 — Web Dashboard (Optional/WIP): React/Next.js UI for viewing reviews and evals
