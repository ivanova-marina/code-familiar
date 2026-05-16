import { describe, expect, it, vi } from 'vitest';

import { reviewDiff } from './reviewAgent.js';

const mockParsed = {
  summary: 'Looks good',
  high_risk_issues: ['issue 1', 'issue 2'],
  suggestions: ['suggestion 1', 'suggestion 2'],
  testing_notes: ['note 1', 'note 2'],
};

describe('reviewDiff', () => {
  it('calls Responses parse() with model/instructions/input and returns parsed review', async () => {
    const create = vi.fn();
    const parse = vi.fn().mockResolvedValue({
      output_text: 'ignored when parsed exists',
      output_parsed: mockParsed,
    });

    const client = { responses: { create, parse } };

    const diff = 'diff --git a/a.ts b/a.ts\n+console.log("hi")\n';
    const result = await reviewDiff(diff, { model: 'gpt-4.1-mini', client });

    expect(parse).toHaveBeenCalledTimes(1);
    expect(create).not.toHaveBeenCalled();

    const args = parse.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(args.model).toBe('gpt-4.1-mini');
    expect(String(args.input)).toContain('```diff');
    expect(String(args.input)).toContain('diff --git');
    expect(typeof args.instructions).toBe('string');
    expect(args.text).toBeTruthy();

    expect(result.kind).toBe('parsed');
    if (result.kind === 'parsed') {
      expect(result.review.summary).toBe('Looks good');
      expect(result.review.high_risk_issues.length).toBeGreaterThan(0);
    }
  });

  it('falls back to trimmed output_text when parsing fails', async () => {
    const create = vi.fn();
    const parse = vi.fn().mockResolvedValue({
      output_text: '\n  Great.\n',
      output_parsed: null,
    });

    const client = { responses: { create, parse } };

    const result = await reviewDiff('diff --git a/a b/a\n', {
      model: 'gpt-4.1-mini',
      client,
    });

    expect(result).toEqual({
      kind: 'text',
      review: 'Great.',
      reason: 'unparsed',
    });
  });

  it('throws on empty diff', async () => {
    const create = vi.fn();
    const parse = vi.fn();
    const client = { responses: { create, parse } };

    await expect(
      reviewDiff('   \n', { model: 'gpt-4.1-mini', client }),
    ).rejects.toThrow(/No diff provided\./);
  });

  it('throws if parse fails and output_text is empty/whitespace', async () => {
    const create = vi.fn().mockResolvedValue({
      output_text: '   \n',
    });
    const parse = vi.fn().mockResolvedValue({
      output_text: '   \n',
      output_parsed: null,
    });

    const client = { responses: { create, parse } };

    await expect(
      reviewDiff('diff --git a/a b/a\n', { model: 'gpt-4.1-mini', client }),
    ).rejects.toThrow(/empty review/i);

    expect(create).toHaveBeenCalledTimes(1);
  });
});
