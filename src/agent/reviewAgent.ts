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
  | { kind: 'parsed'; review: Review }
  | { kind: 'text'; review: string; reason: 'unparsed' | 'parse_error' }
> {
  if (diff.trim().length === 0) {
    throw new Error('No diff provided.');
  }

  const client = options.client ?? getOpenAIClient();
  try {
    const response = await client.responses.parse({
      model: options.model,
      instructions: REVIEW_INSTRUCTIONS,
      input: buildReviewInput(diff),
      text: { format: zodTextFormat(ReviewSchema, 'pr_review') },
    });

    const parsed = response.output_parsed;
    if (!parsed) {
      const raw = response.output_text.trim();
      if (!raw) throw new Error('OpenAI returned an empty review.');
      return { kind: 'text', review: raw, reason: 'unparsed' };
    }

    return { kind: 'parsed', review: parsed };
  } catch {
    const fallback = await client.responses.create({
      model: options.model,
      instructions: REVIEW_INSTRUCTIONS,
      input: buildReviewInput(diff),
    });

    const raw = fallback.output_text.trim();
    if (!raw) throw new Error('OpenAI returned an empty review.');
    return { kind: 'text', review: raw, reason: 'parse_error' };
  }
}
