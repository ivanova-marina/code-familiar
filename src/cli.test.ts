import { describe, expect, it, vi } from 'vitest';

import { createReviewAction } from './cli.js';

describe('review command output', () => {
  it('prints JSON when --json is set and the review is parsed', async () => {
    const stdout: string[] = [];
    const stderr: string[] = [];

    const action = createReviewAction({
      getGitDiff: async () => 'diff --git a/a b/a\n+hi\n',
      getChangedFilesWithStatus: async () => [],
      readTextFile: async () => '',
      getConfiguredModel: () => 'gpt-4.1-mini',
      reviewDiff: async () => ({
        kind: 'parsed',
        review: {
          summary: 'ok',
          high_risk_issues: [],
          suggestions: [],
          testing_notes: [],
        },
      }),
      formatReview: () => 'FORMATTED',
      writeStdout: (text) => stdout.push(text),
      writeStderr: (text) => stderr.push(text),
    });

    await action({
      staged: false,
      printDiff: false,
      json: true,
      context: false,
    });

    expect(stderr.join('')).toBe('');
    expect(stdout.join('')).toBe(
      `${JSON.stringify(
        {
          summary: 'ok',
          high_risk_issues: [],
          suggestions: [],
          testing_notes: [],
        },
        null,
        2,
      )}\n`,
    );
  });

  it('prints formatted text when --json is not set and the review is parsed', async () => {
    const stdout: string[] = [];

    const action = createReviewAction({
      getGitDiff: async () => 'diff --git a/a b/a\n+hi\n',
      getChangedFilesWithStatus: async () => [],
      readTextFile: async () => '',
      getConfiguredModel: () => 'gpt-4.1-mini',
      reviewDiff: async () => ({
        kind: 'parsed',
        review: {
          summary: 'ok',
          high_risk_issues: [],
          suggestions: [],
          testing_notes: [],
        },
      }),
      formatReview: () => 'FORMATTED\n',
      writeStdout: (text) => stdout.push(text),
      writeStderr: () => {},
    });

    await action({
      staged: false,
      printDiff: false,
      json: false,
      context: false,
    });

    expect(stdout.join('')).toBe('FORMATTED\n');
  });

  it('includes changed file contents when context is enabled', async () => {
    const reviewDiffMock = vi.fn(async () => ({
      kind: 'parsed' as const,
      review: {
        summary: 'ok',
        high_risk_issues: [],
        suggestions: [],
        testing_notes: [],
      },
    }));

    const getChangedFilesWithStatusMock = vi.fn(async () => [
      { status: 'M', path: 'src/a.ts' },
    ]);
    const readTextFileMock = vi.fn(async () => 'console.log("hi");\n');

    const action = createReviewAction({
      getGitDiff: async () => 'diff --git a/a b/a\n+hi\n',
      getChangedFilesWithStatus: getChangedFilesWithStatusMock,
      readTextFile: readTextFileMock,
      getConfiguredModel: () => 'gpt-4.1-mini',
      reviewDiff: reviewDiffMock,
      formatReview: () => 'FORMATTED\n',
      writeStdout: () => {},
      writeStderr: () => {},
    });

    await action({
      staged: false,
      printDiff: false,
      json: false,
      context: true,
    });

    expect(getChangedFilesWithStatusMock).toHaveBeenCalledWith({
      staged: false,
    });
    expect(readTextFileMock).toHaveBeenCalledWith('src/a.ts', {
      maxBytes: 50_000,
    });
    expect(reviewDiffMock).toHaveBeenCalledWith('diff --git a/a b/a\n+hi\n', {
      model: 'gpt-4.1-mini',
      files: [{ path: 'src/a.ts', content: 'console.log("hi");\n' }],
    });
  });
});
