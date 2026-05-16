import { zodTextFormat } from 'openai/helpers/zod.js';
import type { OpenAIClient } from '../tools/openai.js';
import { getOpenAIClient } from '../tools/openai.js';
import { buildReviewInput, REVIEW_INSTRUCTIONS } from './prompts.js';
import { type Review, ReviewSchema } from './schemas.js';

export type ReviewOptions = {
  model: string;
  client?: OpenAIClient;
};

export async function reviewDiff(
  diff: string,
  options: ReviewOptions,
): Promise<
  { kind: 'parsed'; review: Review } | { kind: 'text'; review: string }
> {
  if (diff.trim().length === 0) {
    throw new Error('No diff provided.');
  }

  const client = options.client ?? getOpenAIClient();
  const response = await client.responses.parse({
    model: options.model,
    instructions: `${REVIEW_INSTRUCTIONS}\n\nOutput JSON only matching the schema.`,
    input: buildReviewInput(diff),
    text: { format: zodTextFormat(ReviewSchema, 'pr_review') },
  });

  const parsedReview = response.output_parsed;

  if (parsedReview === null) {
    const fallbackText = response.output_text;
    if (fallbackText.trim().length === 0) {
      throw new Error('OpenAI returned an empty review.');
    }
    return { kind: 'text', review: fallbackText.trim() };
  }

  return { kind: 'parsed', review: parsedReview };
}
