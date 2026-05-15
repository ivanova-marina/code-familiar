#!/usr/bin/env node

import 'dotenv/config';
import { Command } from 'commander';
import { getGitDiff } from './tools/git.js';

export async function runCli(argv: readonly string[]): Promise<void> {
  const program = new Command();

  program.name('code-familiar').description('A CLI agent for reviewing frontend pull requests.');

  program
    .command('review')
    .description('Print the current git diff.')
    .option('--staged', 'Use staged changes (git diff --staged).', false)
    .action(async (options: { staged: boolean }) => {
      const diff = await getGitDiff({ staged: options.staged });
      if (diff.length === 0) {
        process.stderr.write('git diff is empty.\n');
        return;
      }
      process.stdout.write(diff.endsWith('\n') ? diff : `${diff}\n`);
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
