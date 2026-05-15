import { describe, expect, it, vi } from 'vitest';

vi.mock('execa', () => ({
  execa: vi.fn(),
}));

import { execa } from 'execa';
import { getGitDiff } from './git.js';

describe('getGitDiff', () => {
  it('runs git diff and returns stdout', async () => {
    const execaMock = vi.mocked(execa);
    type ExecaReturn = Awaited<ReturnType<typeof execa>>;
    execaMock.mockResolvedValueOnce({
      stdout: 'diff-output',
    } as unknown as ExecaReturn);

    const diff = await getGitDiff();

    expect(diff).toBe('diff-output');
    expect(execaMock).toHaveBeenCalledWith(
      'git',
      ['diff', '--no-color', '--no-ext-diff'],
      expect.objectContaining({ stdio: 'pipe' }),
    );
  });

  it('supports staged diffs', async () => {
    const execaMock = vi.mocked(execa);
    type ExecaReturn = Awaited<ReturnType<typeof execa>>;
    execaMock.mockResolvedValueOnce({
      stdout: 'staged-diff',
    } as unknown as ExecaReturn);

    const diff = await getGitDiff({ staged: true });

    expect(diff).toBe('staged-diff');
    expect(execaMock).toHaveBeenCalledWith(
      'git',
      ['diff', '--no-color', '--no-ext-diff', '--staged'],
      expect.anything(),
    );
  });

  it('wraps git errors with a useful message', async () => {
    const execaMock = vi.mocked(execa);
    execaMock.mockRejectedValueOnce(new Error('not a git repository'));

    await expect(getGitDiff()).rejects.toThrow(/Failed to read git diff\./);
  });
});
