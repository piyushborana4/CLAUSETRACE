import { 
  SAMPLE_RESIDENTIAL_RENTAL, 
  SAMPLE_EMPLOYMENT_AGREEMENT, 
  SAMPLE_COMMERCIAL_LEASE, 
  SAMPLE_COMPARISON 
} from '../data/sampleDocuments';
import { LEGAL_DOMAIN_BENCHMARKS } from '../data/legalBenchmarks';
import { processDocumentTextAsync, computeDocumentHash } from '../lib/documentProcessor';

describe('Property-Based Invariant Verification Suite', () => {
  const allSampleDocs = [
    SAMPLE_RESIDENTIAL_RENTAL,
    SAMPLE_EMPLOYMENT_AGREEMENT,
    SAMPLE_COMMERCIAL_LEASE,
  ];

  it('Invariant: Every DOCUMENT_SUPPORTED finding MUST cite a positive page number and non-empty verbatim evidence quote', () => {
    for (const doc of allSampleDocs) {
      for (const finding of doc.findings) {
        if (finding.status === 'DOCUMENT_SUPPORTED') {
          expect(finding.page).toBeGreaterThan(0);
          expect(finding.evidence).toBeDefined();
          expect(finding.evidence.trim().length).toBeGreaterThan(0);
          expect(finding.section).toBeDefined();
          expect(finding.section.trim().length).toBeGreaterThan(0);
        }
      }
    }
  });

  it('Invariant: Every document comparison item MUST preserve strict factual neutrality (No ranking or better/worse declarations)', () => {
    const prohibitedWords = ['better', 'worse', 'superior', 'inferior', 'loser', 'winner'];
    for (const item of SAMPLE_COMPARISON.items) {
      const textToAnalyze = `${item.factualDifference} ${item.clarificationNote}`.toLowerCase();
      for (const word of prohibitedWords) {
        expect(textToAnalyze.includes(` ${word} `)).toBe(false);
      }
      expect(['ADDED', 'REMOVED', 'CHANGED', 'UNCHANGED', 'POSSIBLE_INCONSISTENCY']).toContain(item.status);
    }
  });

  it('Invariant: Legal domain benchmarks must cover high-risk indicators and market standard guidance', () => {
    for (const domain of LEGAL_DOMAIN_BENCHMARKS) {
      expect(domain.benchmarks.length).toBeGreaterThan(0);
      for (const b of domain.benchmarks) {
        expect(b.marketStandard.length).toBeGreaterThan(10);
        expect(b.highRiskIndicator.length).toBeGreaterThan(10);
        expect(b.applicableLawGuidance.length).toBeGreaterThan(10);
      }
    }
  });

  it('Async Processing: Document hash is deterministic and produces valid 64-character SHA-256 hex string', async () => {
    const textSample = 'Agreement executed on October 1st, 2026 by and between parties.';
    const hash1 = await computeDocumentHash(textSample);
    const hash2 = await computeDocumentHash(textSample);

    expect(hash1).toBe(hash2);
    expect(hash1).toHaveLength(64);
    expect(/^[0-9a-f]{64}$/.test(hash1)).toBe(true);

    const processed = await processDocumentTextAsync(textSample);
    expect(processed.wordCount).toBeGreaterThan(0);
    expect(processed.estimatedTokens).toBeGreaterThan(0);
    expect(processed.detectedClauses.length).toBeGreaterThan(0);
  });
});
