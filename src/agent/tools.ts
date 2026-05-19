import { z } from 'zod';
import { getGitDiff } from '../tools/git';
import { readTextFile } from '../tools/fileReader';

export const AGENT_TOOL_NAMES = {
  getGitDiff: 'get_git_diff',
  readFile: 'read_file',
} as const;

export const GetGitDiffArgsSchema = z.object({
  staged: z.boolean().default(false),
});
export const ReadFileArgsSchema = z.object({
  path: z.string().min(1),
  maxBytes: z.number().int().positive().max(50_000).optional(),
});

export type GetGitDiffArgs = z.infer<typeof GetGitDiffArgsSchema>;
export type ReadFileArgs = z.infer<typeof ReadFileArgsSchema>;

export async function executeAgentTool(
  name: string,
  args: unknown,
): Promise<string> {
  if (name === AGENT_TOOL_NAMES.getGitDiff) {
    const parsedArgs = GetGitDiffArgsSchema.parse(args);
    return getGitDiff({ staged: parsedArgs.staged });
  }

  if (name === AGENT_TOOL_NAMES.readFile) {
    const parsedArgs = ReadFileArgsSchema.parse(args);
    return readTextFile(
      parsedArgs.path,
      parsedArgs.maxBytes === undefined
        ? {}
        : { maxBytes: parsedArgs.maxBytes },
    );
  }

  throw new Error(`Unknown agent tool: ${name}`);
}
