import { describe, expect, it, vi } from 'vitest';

vi.mock('execa', () => ({
  execa: vi.fn(),
}));

import { execa } from 'execa';
import {
  getChangedFiles,
  getChangedFilesWithStatus,
  getGitDiff,
} from './git.js';

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

describe('getChangedFiles', () => {
  it('runs git diff --name-only and returns array of filenames', async () => {
    const execaMock = vi.mocked(execa);
    type ExecaReturn = Awaited<ReturnType<typeof execa>>;
    execaMock.mockResolvedValueOnce({
      stdout: 'file1.txt\nfile2.txt\n',
    } as unknown as ExecaReturn);

    const files = await getChangedFiles();

    expect(files).toEqual(['file1.txt', 'file2.txt']);
    expect(execaMock).toHaveBeenCalledWith(
      'git',
      ['diff', '--name-only'],
      expect.objectContaining({ stdio: 'pipe' }),
    );
  });

  it('supports staged files', async () => {
    const execaMock = vi.mocked(execa);
    type ExecaReturn = Awaited<ReturnType<typeof execa>>;
    execaMock.mockResolvedValueOnce({
      stdout: 'file1.txt\nfile2.txt\n',
    } as unknown as ExecaReturn);

    const files = await getChangedFiles({ staged: true });

    expect(files).toEqual(['file1.txt', 'file2.txt']);
    expect(execaMock).toHaveBeenCalledWith(
      'git',
      ['diff', '--name-only', '--staged'],
      expect.objectContaining({ stdio: 'pipe' }),
    );
  });

  it('wraps git errors with a useful message', async () => {
    const execaMock = vi.mocked(execa);
    execaMock.mockRejectedValueOnce(new Error('not a git repository'));

    await expect(getChangedFiles()).rejects.toThrow(
      /Failed to get changed files\./,
    );
  });
});

describe('getChangedFilesWithStatus', () => {
  it('parses name-status output including deletes and renames', async () => {
    const execaMock = vi.mocked(execa);
    type ExecaReturn = Awaited<ReturnType<typeof execa>>;
    execaMock.mockResolvedValueOnce({
      stdout:
        'M\tsrc/a.ts\n' +
        'D\tsrc/deleted.ts\n' +
        'R100\tsrc/old.ts\tsrc/new.ts\n' +
        'C75\tsrc/original.ts\tsrc/copy.ts\n',
    } as unknown as ExecaReturn);

    const files = await getChangedFilesWithStatus({});

    expect(files).toEqual([
      { status: 'M', path: 'src/a.ts' },
      { status: 'D', path: 'src/deleted.ts' },
      { status: 'R', path: 'src/new.ts', oldPath: 'src/old.ts' },
      { status: 'C', path: 'src/copy.ts', oldPath: 'src/original.ts' },
    ]);
    expect(execaMock).toHaveBeenCalledWith(
      'git',
      ['diff', '--name-status'],
      expect.objectContaining({ stdio: 'pipe' }),
    );
  });

  it('supports staged name-status output', async () => {
    const execaMock = vi.mocked(execa);
    type ExecaReturn = Awaited<ReturnType<typeof execa>>;
    execaMock.mockResolvedValueOnce({
      stdout: 'M\tsrc/a.ts\n',
    } as unknown as ExecaReturn);

    const files = await getChangedFilesWithStatus({ staged: true });

    expect(files).toEqual([{ status: 'M', path: 'src/a.ts' }]);
    expect(execaMock).toHaveBeenCalledWith(
      'git',
      ['diff', '--name-status', '--staged'],
      expect.objectContaining({ stdio: 'pipe' }),
    );
  });

  it('wraps git errors with a useful message', async () => {
    const execaMock = vi.mocked(execa);
    execaMock.mockRejectedValueOnce(new Error('not a git repository'));

    await expect(getChangedFilesWithStatus({})).rejects.toThrow(
      /Failed to get changed files with status\./,
    );
  });
});
