#!/usr/bin/env node

import 'dotenv/config';
import { Command } from 'commander';
import { reviewDiff } from './agent/reviewAgent.js';
import { getGitDiff } from './tools/git.js';
import { getConfiguredModel } from './tools/openai.js';

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
      async (options: {
        staged: boolean;
        model?: string;
        printDiff: boolean;
        json: boolean;
      }) => {
        const diff = await getGitDiff({ staged: options.staged });
        if (diff.trim().length === 0) {
          process.stderr.write('No changes to review (git diff is empty).\n');
          return;
        }

        if (options.printDiff) {
          process.stderr.write(diff.endsWith('\n') ? diff : `${diff}\n`);
        }

        const model = getConfiguredModel(options.model);
        const result = await reviewDiff(diff, { model });
        // result kind === 'text'
        if (result.kind === 'text') {
          process.stderr.write(
            'Warning: Structured output failed, printing raw model text.\n',
          );
          process.stdout.write(
            result.review.endsWith('\n') ? result.review : `${result.review}\n`,
          );
          return;
        }

        // result kind === 'parsed'
        if (options.json) {
          const jsonOutput = JSON.stringify(result.review, null, 2);
          process.stdout.write(`${jsonOutput}\n`);
          return;
        }

        // TODO: implement formatReview() in terminalFormatter.ts and use it here instead of just printing the summary
        process.stdout.write(
          result.review.summary.endsWith('\n')
            ? result.review.summary
            : `${result.review.summary}\n`,
        );
      },
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
