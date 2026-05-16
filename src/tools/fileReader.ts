import { readFile } from 'node:fs/promises';

export type ReadTextFileOptions = {
  maxBytes?: number;
};

export async function readTextFile(
  filePath: string,
  options: ReadTextFileOptions = {},
): Promise<string> {
  const maxBytes = options.maxBytes ?? 50_000; // Default to 50KB

  try {
    const data = await readFile(filePath);

    if (data.length <= maxBytes) {
      return data.toString('utf8');
    }

    const sliced = data.subarray(0, maxBytes);
    return sliced.toString('utf8') + '\n…(truncated)';
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    const message = error instanceof Error ? error.message : String(error);

    if (code === 'ENOENT') {
      return `[File missing on disk]`;
    }
    throw new Error(`Failed to read file ${filePath}. ${message}`);
  }
}
