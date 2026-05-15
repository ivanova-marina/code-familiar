# AGENTS.md — Code Familiar

## Project Overview

Code Familiar is a TypeScript-based CLI agent for reviewing frontend pull requests.

Do not over-engineer. Prefer small, understandable changes.
Always focus on the earliest incomplete milestone unless explicitly instructed otherwise.

## Development Milestones

### Milestone 1 — CLI Skeleton

- Implement `code-familiar review`
- Print a startup message
- Read and print `git diff`

### Milestone 2 — LLM Integration

- Send the diff to the OpenAI API
- Return a simple text review

### Milestone 3 — Structured Output

- Define Zod schemas
- Validate model responses
- Render formatted terminal output

### Milestone 4 — Tool-Aware Agent

- Read changed files
- Provide additional context to the model

### Milestone 5 — Agent Loop

- Allow the model to request tools iteratively
- Continue until a final review is produced

### Milestone 6 — Evals

- Create sample diffs and expected review outputs
- Measure review quality

### Milestone 7 — Human Approval

- Require confirmation before high-impact actions

### Milestone 8 — Web Dashboard (Optional)

- Build a React/Next.js UI for viewing reviews and evals

Do not over-engineer. Prefer small, understandable changes.
Always focus on the earliest incomplete milestone unless explicitly instructed otherwise.

## Tech Stack

- TypeScript
- Node.js
- Commander.js for CLI commands
- execa for shell/Git commands
- Zod for schemas and structured output validation
- OpenAI SDK for model calls
- Vitest for tests

React/Next.js may be added later for a dashboard, but the current project is CLI-first.

## Expected Project Structure

```txt
src/
  cli.ts
  agent/
    reviewAgent.ts
    prompts.ts
    schemas.ts
  tools/
    git.ts
    fileReader.ts
  formatters/
    terminalFormatter.ts
  evals/
```

## Commands

Use these commands when relevant:

- `npm run dev -- review`
- `npm run build`
- `npm run test`

Do not assume additional scripts exist unless `package.json` confirms them.

## Coding Standards

- Use strict TypeScript.
- Prefer small pure functions.
- Keep CLI parsing separate from agent logic.
- Keep external tool calls inside `src/tools`.
- Keep prompts inside `src/agent/prompts.ts`.
- Keep response schemas inside `src/agent/schemas.ts`.
- Use async/await.
- Avoid any unless there is a strong reason.
- Prefer explicit return types for exported functions.
- Handle errors with useful messages.

## Agent Design Principles

Code Familiar should behave like a thoughtful frontend reviewer, not a noisy linter.

Prioritize:

- correctness issues
- risky behavior changes
- React architecture concerns
- unnecessary state or effects
- TypeScript clarity
- missing or weak tests
- readability improvements

Avoid:

- vague feedback
- excessive nitpicks
- rewriting large files without being asked
- inventing project conventions
- making destructive changes

## Safety Rules

Never:

- commit changes
- push changes
- delete files
- rewrite large parts of the project
- post GitHub comments
- modify `.env`
- expose API keys or secrets

Ask before:

- adding new dependencies
- changing package scripts
- changing project architecture
- generating large new files
- modifying test strategy

## Environment

The project may use an `.env` file with:

```bash
OPENAI_API_KEY=...
```

Never print, read aloud, modify, or commit secret values.

## Testing Expectations

When changing behavior:

- add or update tests where practical
- run relevant tests if available
- run `npm run build` for TypeScript correctness

For early MVP tasks, it is acceptable to explain when tests were skipped and why.

## Definition of Done

A task is done when:

- the code is simple and readable
- TypeScript compiles
- relevant tests pass, if tests exist
- CLI behavior is explained clearly
- no secrets are exposed
- the change fits the current MVP scope

## Communication Style

Be direct and practical.

When making changes, summarize:

- what changed
- how to run it
- what to check next

Prefer incremental progress over large rewrites.

## Preferred Workflow

When implementing a task:

1. Understand the current milestone.
2. Make the smallest reasonable change.
3. Run `npm run build`.
4. Run relevant tests if available.
5. Summarize the result.
