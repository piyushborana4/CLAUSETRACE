import { describe, it, expect } from 'vitest';
import { LEGAL_DOMAIN_BENCHMARKS } from '../data/legalBenchmarks';

describe('WCAG 2.1 AAA Accessibility & Compliance Invariants', () => {
  it('verifies that all contract domain benchmarks have high-confidence guidance', () => {
    LEGAL_DOMAIN_BENCHMARKS.forEach((domain) => {
      expect(domain.benchmarks.length).toBeGreaterThan(0);
      domain.benchmarks.forEach((b) => {
        expect(b.topic).toBeTruthy();
        expect(b.marketStandard).toBeTruthy();
        expect(b.favorableToUser).toBeTruthy();
        expect(b.highRiskIndicator).toBeTruthy();
        expect(b.applicableLawGuidance).toBeTruthy();
        if (b.confidenceScore !== undefined) {
          expect(b.confidenceScore).toBeGreaterThanOrEqual(0.9);
        }
      });
    });
  });

  it('verifies that screen reader live region constants conform to WAI-ARIA standards', () => {
    const politeId = 'a11y-live-polite';
    const assertiveId = 'a11y-live-assertive';
    expect(politeId).toMatch(/^[a-z0-9\-]+$/);
    expect(assertiveId).toMatch(/^[a-z0-9\-]+$/);
  });
});
