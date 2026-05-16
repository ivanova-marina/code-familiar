import { describe, expect, it } from 'vitest';

import { createReviewAction } from './cli.js';

describe('review command output', () => {
  it('prints JSON when --json is set and the review is parsed', async () => {
    const stdout: string[] = [];
    const stderr: string[] = [];

    const action = createReviewAction({
      getGitDiff: async () => 'diff --git a/a b/a\n+hi\n',
      getChangedFiles: async () => [],
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
      getChangedFiles: async () => [],
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
});
