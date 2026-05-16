import { describe, expect, it } from 'vitest';

import { formatReview } from './terminalFormatter.js';

describe('formatReview', () => {
  it('renders all sections and bullets', () => {
    const output = formatReview({
      summary: 'Adds a new CLI flag.',
      high_risk_issues: ['May break Windows paths.'],
      suggestions: ['Add tests for path parsing.'],
      testing_notes: ['Run on macOS + Windows.'],
    });

    expect(output).toContain('Summary');
    expect(output).toContain('- Adds a new CLI flag.');

    expect(output).toContain('High Risk Issues');
    expect(output).toContain('- May break Windows paths.');

    expect(output).toContain('Suggestions');
    expect(output).toContain('- Add tests for path parsing.');

    expect(output).toContain('Testing Notes');
    expect(output).toContain('- Run on macOS + Windows.');
  });

  it('prints "- None" for empty sections', () => {
    const output = formatReview({
      summary: 'Refactors formatting.',
      high_risk_issues: [],
      suggestions: [],
      testing_notes: [],
    });

    expect(output).toContain('High Risk Issues');
    expect(output).toContain('- None');
  });

  it('ends with a trailing newline', () => {
    const output = formatReview({
      summary: 'Tweaks output.',
      high_risk_issues: [],
      suggestions: [],
      testing_notes: [],
    });

    expect(output.endsWith('\n')).toBe(true);
  });
});
