# AGENTS.md — Code Familiar

## Project Overview

Code Familiar is a TypeScript-based CLI agent for reviewing frontend pull requests.

The first goal is a small working MVP:

- read the current Git diff
- send the diff to an LLM
- return structured PR review feedback
- print the review in the terminal

Do not over-engineer. Prefer small, understandable changes.

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

- npm run dev -- review
- npm run build
- npm run test
  Do not assume additional scripts exist unless package.json confirms them.

## Coding Standards

- Use strict TypeScript.
- Prefer small pure functions.
- Keep CLI parsing separate from agent logic.
- Keep external tool calls inside src/tools.
- Keep prompts inside src/agent/prompts.ts.
- Keep response schemas inside src/agent/schemas.ts.
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
- modify .env
- expose API keys or secrets

Ask before:

- adding new dependencies
- changing package scripts
- changing project architecture
- generating large new files
- modifying test strategy

## Environment

The project may use an .env file with:

```Bash
OPENAI_API_KEY=...
```

Never print, read aloud, modify, or commit secret values.

## Testing Expectations

When changing behavior:

- add or update tests where practical
- run relevant tests if available
- run npm run build for TypeScript correctness
- For early MVP tasks, it is acceptable to explain when tests were skipped and why.

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
