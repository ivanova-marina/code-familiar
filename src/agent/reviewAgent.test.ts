import { beforeEach, describe, expect, it, vi } from 'vitest';

import { reviewDiff } from './reviewAgent.js';
import { executeAgentTool } from './tools.js';

vi.mock('./tools.js', () => ({
  AGENT_TOOL_DEFINITIONS: [
    {
      type: 'function',
      name: 'read_file',
      description: 'Read a text file from the repository for review context.',
    },
  ],
  executeAgentTool: vi.fn(),
}));

const mockParsed = {
  summary: 'Looks good',
  high_risk_issues: ['issue 1', 'issue 2'],
  suggestions: ['suggestion 1', 'suggestion 2'],
  testing_notes: ['note 1', 'note 2'],
};

describe('reviewDiff', () => {
  beforeEach(() => {
    vi.mocked(executeAgentTool).mockReset();
  });

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
    expect(args.tools).toBeTruthy();

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

  it('executes function calls and sends tool outputs into the next iteration', async () => {
    vi.mocked(executeAgentTool).mockResolvedValueOnce('[mock file content]');

    const create = vi.fn();
    const parse = vi
      .fn()
      .mockResolvedValueOnce({
        id: 'response_1',
        output_text: '',
        output_parsed: null,
        output: [
          {
            type: 'function_call',
            name: 'read_file',
            call_id: 'call_1',
            arguments: '{"path":"src/a.ts"}',
          },
        ],
      })
      .mockResolvedValueOnce({
        output_text: 'ignored when parsed exists',
        output_parsed: mockParsed,
      });

    const client = { responses: { create, parse } };

    const result = await reviewDiff('diff --git a/a b/a\n', {
      model: 'gpt-4.1-mini',
      client,
    });

    expect(result).toEqual({ kind: 'parsed', review: mockParsed });
    expect(parse).toHaveBeenCalledTimes(2);
    expect(create).not.toHaveBeenCalled();
    expect(executeAgentTool).toHaveBeenCalledWith('read_file', {
      path: 'src/a.ts',
    });

    const secondCallArgs = parse.mock.calls[1]?.[0] as Record<string, unknown>;
    expect(secondCallArgs.input).toEqual([
      {
        type: 'function_call_output',
        call_id: 'call_1',
        output: '[mock file content]',
      },
    ]);
    expect(secondCallArgs.previous_response_id).toBe('response_1');
  });

  it('does not send previous_response_id on the first iteration', async () => {
    const create = vi.fn();
    const parse = vi.fn().mockResolvedValueOnce({
      output_text: 'ignored when parsed exists',
      output_parsed: mockParsed,
    });

    const client = { responses: { create, parse } };

    await reviewDiff('diff --git a/a b/a\n', {
      model: 'gpt-4.1-mini',
      client,
    });

    const firstCallArgs = parse.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(firstCallArgs.previous_response_id).toBeUndefined();
  });

  it('falls back to raw text when a function call is malformed', async () => {
    const create = vi.fn().mockResolvedValue({
      output_text: '\n  Fallback review.\n',
    });
    const parse = vi.fn().mockResolvedValueOnce({
      output_text: '',
      output_parsed: null,
      output: [
        {
          type: 'function_call',
          arguments: '{}',
        },
      ],
    });

    const client = { responses: { create, parse } };

    const result = await reviewDiff('diff --git a/a b/a\n', {
      model: 'gpt-4.1-mini',
      client,
    });

    expect(result).toEqual({
      kind: 'text',
      review: 'Fallback review.',
      reason: 'parse_error',
    });
    expect(create).toHaveBeenCalledTimes(1);
    expect(executeAgentTool).not.toHaveBeenCalled();
  });

  it('falls back to raw text when function call arguments are invalid JSON', async () => {
    const create = vi.fn().mockResolvedValue({
      output_text: 'Fallback after invalid JSON.',
    });
    const parse = vi.fn().mockResolvedValueOnce({
      output_text: '',
      output_parsed: null,
      output: [
        {
          type: 'function_call',
          name: 'read_file',
          call_id: 'call_1',
          arguments: '{bad json',
        },
      ],
    });

    const client = { responses: { create, parse } };

    const result = await reviewDiff('diff --git a/a b/a\n', {
      model: 'gpt-4.1-mini',
      client,
    });

    expect(result).toEqual({
      kind: 'text',
      review: 'Fallback after invalid JSON.',
      reason: 'parse_error',
    });
    expect(create).toHaveBeenCalledTimes(1);
    expect(executeAgentTool).not.toHaveBeenCalled();
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
