#!/usr/bin/env node

import 'dotenv/config';
import { Command } from 'commander';
import { reviewDiff } from './agent/reviewAgent.js';
import type { Review } from './agent/schemas.js';
import { getGitDiff } from './tools/git.js';
import { getConfiguredModel } from './tools/openai.js';
import { formatReview } from './formatters/terminalFormatter.js';

export type ReviewDiffResult =
  | { kind: 'parsed'; review: Review }
  | { kind: 'text'; review: string; reason: 'unparsed' | 'parse_error' };

export type ReviewActionOptions = {
  staged: boolean;
  model?: string;
  printDiff: boolean;
  json: boolean;
};

export type ReviewCommandDeps = {
  getGitDiff: (options: { staged: boolean }) => Promise<string>;
  getConfiguredModel: (cliModel: string | undefined) => string;
  reviewDiff: (
    diff: string,
    options: { model: string },
  ) => Promise<ReviewDiffResult>;
  formatReview: (review: Review) => string;
  writeStdout: (text: string) => void;
  writeStderr: (text: string) => void;
};

export function createReviewAction(deps: ReviewCommandDeps) {
  return async (options: ReviewActionOptions): Promise<void> => {
    const diff = await deps.getGitDiff({ staged: options.staged });
    if (diff.trim().length === 0) {
      deps.writeStderr('No changes to review (git diff is empty).\n');
      return;
    }

    if (options.printDiff) {
      deps.writeStderr(diff.endsWith('\n') ? diff : `${diff}\n`);
    }

    const model = deps.getConfiguredModel(options.model);
    const result = await deps.reviewDiff(diff, { model });

    if (result.kind === 'text') {
      const message =
        result.reason === 'unparsed'
          ? 'Warning: Model output did not match the structured schema; printing raw text.\n'
          : 'Warning: Structured output parsing failed; printing fallback raw text.\n';
      deps.writeStderr(message);
      deps.writeStdout(
        result.review.endsWith('\n') ? result.review : `${result.review}\n`,
      );
      return;
    }

    if (options.json) {
      deps.writeStdout(`${JSON.stringify(result.review, null, 2)}\n`);
      return;
    }

    const formatted = deps.formatReview(result.review);
    deps.writeStdout(formatted.endsWith('\n') ? formatted : `${formatted}\n`);
  };
}

export async function runCli(argv: readonly string[]): Promise<void> {
  const program = new Command();

  program
    .name('code-familiar')
    .description('A CLI agent for reviewing frontend pull requests.');

  program
    .command('review')
    .description(
      'Generate a simple text review of the current git diff using OpenAI.',
    )
    .option('--staged', 'Use staged changes (git diff --staged).', false)
    .option(
      '--model <model>',
      'Override the OpenAI model (or use CODE_FAMILIAR_MODEL).',
    )
    .option(
      '--print-diff',
      'Print the raw git diff to stderr before the review.',
      false,
    )
    .option(
      '--json',
      'Output the review as JSON (with summary, high_risk_issues, suggestions, testing_notes) instead of plain text.',
      false,
    )
    .action(
      createReviewAction({
        getGitDiff,
        getConfiguredModel,
        reviewDiff,
        formatReview,
        writeStdout: (text) => {
          process.stdout.write(text);
        },
        writeStderr: (text) => {
          process.stderr.write(text);
        },
      }),
    );

  await program.parseAsync(argv as string[]);
}

if (require.main === module) {
  runCli(process.argv).catch((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    process.stderr.write(`${message}\n`);
    process.exitCode = 1;
  });
}
