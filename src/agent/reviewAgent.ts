import type { OpenAIClient } from '../tools/openai.js';
import { getOpenAIClient } from '../tools/openai.js';
import { buildReviewInput, REVIEW_INSTRUCTIONS } from './prompts.js';

export type ReviewOptions = {
  model: string;
  client?: OpenAIClient;
};

export async function reviewDiff(diff: string, options: ReviewOptions): Promise<string> {
  if (diff.trim().length === 0) {
    throw new Error('No diff provided.');
  }

  const client = options.client ?? getOpenAIClient();
  const response = await client.responses.create({
    model: options.model,
    instructions: REVIEW_INSTRUCTIONS,
    input: buildReviewInput(diff),
  });

  const text = response.output_text.trim();
  if (text.length === 0) {
    throw new Error('OpenAI returned an empty review.');
  }

  return text;
}
