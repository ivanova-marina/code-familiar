import * as z from 'zod';

export const ReviewSchema = z.object({
  summary: z.string(),
  high_risk_issues: z.array(z.string()).default([]),
  suggestions: z.array(z.string()).default([]),
  testing_notes: z.array(z.string()).default([]),
});

export type Review = z.infer<typeof ReviewSchema>;
