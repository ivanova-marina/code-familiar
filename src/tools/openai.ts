import OpenAI from 'openai';
import { type Review } from '../agent/schemas';

export type OpenAIClient = {
  responses: {
    create: (args: unknown) => Promise<{ output_text: string }>;
    parse: (
      args: unknown,
    ) => Promise<{ output_text: string; output_parsed: Review | null }>;
  };
};

let openAIClient: OpenAIClient | null = null;

export function getOpenAIClient(): OpenAIClient {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error(
      'Missing OPENAI_API_KEY. Set it in your environment (or .env).',
    );
  }

  if (openAIClient) return openAIClient;

  openAIClient = new OpenAI({ apiKey }) as unknown as OpenAIClient;
  return openAIClient;
}

export function getConfiguredModel(cliModel: string | undefined): string {
  return cliModel ?? process.env.CODE_FAMILIAR_MODEL ?? 'gpt-4.1-mini';
}
