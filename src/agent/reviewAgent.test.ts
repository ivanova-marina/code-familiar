import { describe, expect, it, vi } from 'vitest';

import { reviewDiff } from './reviewAgent.js';

describe('reviewDiff', () => {
  it('calls Responses API with model, instructions, and diff input', async () => {
    const create = vi.fn().mockResolvedValue({ output_text: 'Looks good.' });
    const client = { responses: { create } };

    const diff = 'diff --git a/a.ts b/a.ts\n+console.log("hi")\n';
    const result = await reviewDiff(diff, { model: 'gpt-4.1-mini', client });

    expect(result).toBe('Looks good.');
    expect(create).toHaveBeenCalledTimes(1);
    const args = create.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(args.model).toBe('gpt-4.1-mini');
    expect(String(args.input)).toContain('```diff');
    expect(String(args.input)).toContain('diff --git');
    expect(typeof args.instructions).toBe('string');
  });

  it('trims output text', async () => {
    const create = vi.fn().mockResolvedValue({ output_text: '\n  Great.\n' });
    const client = { responses: { create } };

    const result = await reviewDiff('diff --git a/a b/a\n', {
      model: 'gpt-4.1-mini',
      client,
    });

    expect(result).toBe('Great.');
  });

  it('throws on empty diff', async () => {
    const create = vi.fn();
    const client = { responses: { create } };

    await expect(
      reviewDiff('   \n', { model: 'gpt-4.1-mini', client }),
    ).rejects.toThrow(/No diff provided\./);
  });

  it('throws if OpenAI returns an empty review', async () => {
    const create = vi.fn().mockResolvedValue({ output_text: '   \n' });
    const client = { responses: { create } };

    await expect(
      reviewDiff('diff --git a/a b/a\n', { model: 'gpt-4.1-mini', client }),
    ).rejects.toThrow(/empty review/i);
  });
});
