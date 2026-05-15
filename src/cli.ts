#!/usr/bin/env node

import 'dotenv/config';
import { Command } from 'commander';
import { reviewDiff } from './agent/reviewAgent.js';
import { getGitDiff } from './tools/git.js';
import { getConfiguredModel } from './tools/openai.js';

export async function runCli(argv: readonly string[]): Promise<void> {
  const program = new Command();

  program.name('code-familiar').description('A CLI agent for reviewing frontend pull requests.');

  program
    .command('review')
    .description('Generate a simple text review of the current git diff using OpenAI.')
    .option('--staged', 'Use staged changes (git diff --staged).', false)
    .option('--model <model>', 'Override the OpenAI model (or use CODE_FAMILIAR_MODEL).')
    .option('--print-diff', 'Print the raw git diff to stderr before the review.', false)
    .action(async (options: { staged: boolean; model?: string; printDiff: boolean }) => {
      const diff = await getGitDiff({ staged: options.staged });
      if (diff.trim().length === 0) {
        process.stderr.write('No changes to review (git diff is empty).\n');
        return;
      }

      if (options.printDiff) {
        process.stderr.write(diff.endsWith('\n') ? diff : `${diff}\n`);
      }

      const model = getConfiguredModel(options.model);
      const review = await reviewDiff(diff, { model });
      process.stdout.write(review.endsWith('\n') ? review : `${review}\n`);
    });

  await program.parseAsync(argv as string[]);
}

if (require.main === module) {
  runCli(process.argv).catch((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    process.stderr.write(`${message}\n`);
    process.exitCode = 1;
  });
}
