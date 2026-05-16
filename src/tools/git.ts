import { execFile } from 'node:child_process';

type RunOptions = { cwd?: string };

function execFileUtf8(
  file: string,
  args: readonly string[],
  options: RunOptions,
): Promise<{ stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    execFile(
      file,
      [...args],
      {
        ...(options.cwd ? { cwd: options.cwd } : {}),
        encoding: 'utf8',
        maxBuffer: 10 * 1024 * 1024,
      },
      (error, stdout, stderr) => {
        if (error) {
          reject(Object.assign(error, { stdout, stderr }));
          return;
        }
        resolve({ stdout, stderr });
      },
    );
  });
}

async function runGitWithExeca(
  args: readonly string[],
  options: RunOptions,
): Promise<{ stdout: string; stderr: string }> {
  const { execa } = await import('execa');
  const result = await execa('git', args, {
    ...(options.cwd ? { cwd: options.cwd } : {}),
    stdio: 'pipe',
  });
  return { stdout: result.stdout, stderr: result.stderr };
}

async function runGit(
  args: readonly string[],
  options: RunOptions,
): Promise<{ stdout: string; stderr: string }> {
  try {
    return await runGitWithExeca(args, options);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const isLikelyNodeCompatIssue =
      message.includes('ERR_REQUIRE_ESM') ||
      message.includes('does not provide an export named') ||
      message.includes('Cannot find module') ||
      message.includes('Unexpected token export');
    if (!isLikelyNodeCompatIssue) throw error;
    return await execFileUtf8('git', args, options);
  }
}

export type GitDiffOptions = {
  cwd?: string;
  staged?: boolean;
};

export async function getGitDiff(
  options: GitDiffOptions = {},
): Promise<string> {
  const args = ['diff', '--no-color', '--no-ext-diff'];
  if (options.staged) args.push('--staged');

  try {
    const { stdout } = await runGit(args, {
      ...(options.cwd ? { cwd: options.cwd } : {}),
    });
    return stdout;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to read git diff. ${message}`);
  }
}

export async function getChangedFiles(
  options: { cwd?: string; staged?: boolean } = {},
): Promise<string[]> {
  const args = ['diff', '--name-only'];
  if (options.staged) args.push('--staged');
  try {
    const { stdout } = await runGit(args, {
      ...(options.cwd ? { cwd: options.cwd } : {}),
    });
    return stdout
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to get changed files. ${message}`);
  }
}
