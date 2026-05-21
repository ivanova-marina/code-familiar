import { zodTextFormat } from 'openai/helpers/zod.js';
import type {
  OpenAIClient,
  OpenAIResponseOutputItem,
} from '../tools/openai.js';
import { getOpenAIClient } from '../tools/openai.js';
import {
  buildFileContext,
  buildReviewInput,
  REVIEW_INSTRUCTIONS,
} from './prompts.js';
import { type Review, ReviewSchema } from './schemas.js';
import { AGENT_TOOL_DEFINITIONS, executeAgentTool } from './tools.js';

export type ReviewOptions = {
  model: string;
  client?: OpenAIClient;
  files?: Array<{ path: string; content: string }>;
};

type ToolResultInputItem = {
  type: 'function_call_output';
  call_id: string;
  output: string;
};

const MAX_AGENT_ITERATIONS = 5;

function getFunctionCalls(output: OpenAIResponseOutputItem[] | undefined) {
  return (output ?? []).filter((item) => item.type === 'function_call');
}

async function executeFunctionCalls(
  functionCalls: OpenAIResponseOutputItem[],
): Promise<ToolResultInputItem[]> {
  return Promise.all(
    functionCalls.map(async (call) => {
      if (!call.name || !call.call_id) {
        throw new Error('Tool call is missing name or call_id');
      }

      const args = call.arguments ? JSON.parse(call.arguments) : {};
      const output = await executeAgentTool(call.name, args);

      return {
        type: 'function_call_output',
        call_id: call.call_id,
        output,
      };
    }),
  );
}

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
    let input: unknown = buildReviewInput(
      diff,
      buildFileContext(options.files ?? []),
    );

    for (let iteration = 0; iteration < MAX_AGENT_ITERATIONS; iteration += 1) {
      const response = await client.responses.parse({
        tools: AGENT_TOOL_DEFINITIONS,
        model: options.model,
        instructions: REVIEW_INSTRUCTIONS,
        input,
        text: { format: zodTextFormat(ReviewSchema, 'pr_review') },
      });

      const parsed = response.output_parsed;
      if (parsed) {
        return { kind: 'parsed', review: parsed };
      }

      const functionCalls = getFunctionCalls(response.output);
      if (functionCalls.length > 0) {
        input = await executeFunctionCalls(functionCalls);
        continue;
      }

      const raw = response.output_text.trim();
      if (!raw) throw new Error('OpenAI returned an empty review');
      return { kind: 'text', review: raw, reason: 'unparsed' };
    }

    throw new Error('Agent loop reached the maximum number of iterations.');
  } catch {
    const fallback = await client.responses.create({
      model: options.model,
      instructions: REVIEW_INSTRUCTIONS,
      input: buildReviewInput(diff, buildFileContext(options.files ?? [])),
    });

    const raw = fallback.output_text.trim();
    if (!raw) throw new Error('OpenAI returned an empty review.');
    return { kind: 'text', review: raw, reason: 'parse_error' };
  }
}
