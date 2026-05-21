import { describe, expect, it, vi } from 'vitest';

vi.mock('../tools/git', () => ({
  getGitDiff: vi.fn(),
}));

vi.mock('../tools/fileReader', () => ({
  readTextFile: vi.fn(),
}));

import { readTextFile } from '../tools/fileReader';
import { getGitDiff } from '../tools/git';
import { AGENT_TOOL_NAMES, executeAgentTool } from './tools';

describe('executeAgentTool', () => {
  it('runs get_git_diff with unstaged diff by default', async () => {
    const getGitDiffMock = vi.mocked(getGitDiff);
    getGitDiffMock.mockResolvedValueOnce('diff-output');

    const result = await executeAgentTool(AGENT_TOOL_NAMES.getGitDiff, {});

    expect(result).toBe('diff-output');
    expect(getGitDiffMock).toHaveBeenCalledWith({ staged: false });
  });

  it('runs get_git_diff with staged diff when requested', async () => {
    const getGitDiffMock = vi.mocked(getGitDiff);
    getGitDiffMock.mockResolvedValueOnce('staged-diff-output');

    const result = await executeAgentTool(AGENT_TOOL_NAMES.getGitDiff, {
      staged: true,
    });

    expect(result).toBe('staged-diff-output');
    expect(getGitDiffMock).toHaveBeenCalledWith({ staged: true });
  });

  it('runs read_file with file path and maxBytes', async () => {
    const readTextFileMock = vi.mocked(readTextFile);
    readTextFileMock.mockResolvedValueOnce('file contents');

    const result = await executeAgentTool(AGENT_TOOL_NAMES.readFile, {
      path: 'src/example.ts',
      maxBytes: 1000,
    });

    expect(result).toBe('file contents');
    expect(readTextFileMock).toHaveBeenCalledWith('src/example.ts', {
      maxBytes: 1000,
    });
  });

  it('throws for invalid read_file args', async () => {
    await expect(
      executeAgentTool(AGENT_TOOL_NAMES.readFile, { path: '' }),
    ).rejects.toThrow();
  });

  it('throws for unknown tool names', async () => {
    await expect(executeAgentTool('unknown_tool', {})).rejects.toThrow(
      /Unknown agent tool: unknown_tool/,
    );
  });
});
