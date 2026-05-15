import { describe, expect, it } from 'vitest';

import { getConfiguredModel, getOpenAIClient } from './openai.js';

describe('openai tools', () => {
  it('chooses model from cli arg, then env, then default', () => {
    const original = process.env.CODE_FAMILIAR_MODEL;
    process.env.CODE_FAMILIAR_MODEL = 'env-model';

    expect(getConfiguredModel('cli-model')).toBe('cli-model');
    expect(getConfiguredModel(undefined)).toBe('env-model');

    delete process.env.CODE_FAMILIAR_MODEL;
    expect(getConfiguredModel(undefined)).toBe('gpt-4.1-mini');

    if (original === undefined) delete process.env.CODE_FAMILIAR_MODEL;
    else process.env.CODE_FAMILIAR_MODEL = original;
  });

  it('throws a clear error when OPENAI_API_KEY is missing', () => {
    const original = process.env.OPENAI_API_KEY;
    delete process.env.OPENAI_API_KEY;

    expect(() => getOpenAIClient()).toThrow(/Missing OPENAI_API_KEY/);

    if (original === undefined) delete process.env.OPENAI_API_KEY;
    else process.env.OPENAI_API_KEY = original;
  });
});
