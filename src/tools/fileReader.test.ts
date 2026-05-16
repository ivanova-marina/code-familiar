import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

import { readTextFile } from './fileReader.js';

describe('readTextFile', () => {
  it('reads a text file', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'code-familiar-'));
    try {
      const filePath = join(dir, 'a.txt');
      await writeFile(filePath, 'hello', 'utf8');

      const content = await readTextFile(filePath);

      expect(content).toBe('hello');
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it('truncates large files and appends a marker', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'code-familiar-'));
    try {
      const filePath = join(dir, 'big.txt');
      await writeFile(filePath, 'a'.repeat(100), 'utf8');

      const content = await readTextFile(filePath, { maxBytes: 10 });

      expect(content.startsWith('a'.repeat(10))).toBe(true);
      expect(content.endsWith('\n…(truncated)')).toBe(true);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it('returns a placeholder when the file is missing', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'code-familiar-'));
    try {
      const filePath = join(dir, 'missing.txt');

      const content = await readTextFile(filePath);

      expect(content).toBe('[File missing on disk]');
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
});
