import type { Review } from '../agent/schemas.js';

function formatBullets(items: string[]): string {
  if (items.length === 0) {
    return '- None';
  }

  return items.map((item) => `- ${item}`).join('\n');
}

export function formatReview(review: Review): string {
  const { summary, high_risk_issues, suggestions, testing_notes } = review;

  return [
    'Summary:',
    formatBullets([summary]),
    '',
    'High Risk Issues:',
    formatBullets(high_risk_issues),
    '',
    'Suggestions:',
    formatBullets(suggestions),
    '',
    'Testing Notes:',
    formatBullets(testing_notes),
    '',
  ].join('\n');
}
