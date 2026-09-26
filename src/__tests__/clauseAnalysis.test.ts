import { SAMPLE_RESIDENTIAL_RENTAL, SAMPLE_EMPLOYMENT_AGREEMENT } from '../data/sampleDocuments';

describe('Document Analysis Invariants & Grounding', () => {
  it('enforces that every finding contains page, section, and evidence citations', () => {
    const docs = [SAMPLE_RESIDENTIAL_RENTAL, SAMPLE_EMPLOYMENT_AGREEMENT];

    docs.forEach((doc) => {
      expect(doc.findings.length).toBeGreaterThan(0);
      doc.findings.forEach((finding) => {
        expect(finding.page).toBeGreaterThanOrEqual(1);
        expect(finding.section).toBeTruthy();
        expect(finding.evidence).toBeTruthy();
        expect(typeof finding.evidence).toBe('string');
        expect(finding.evidence.length).toBeGreaterThan(5);
        expect(['DOCUMENT_SUPPORTED', 'DOCUMENT_INTERPRETATION', 'NOT_FOUND', 'AMBIGUOUS']).toContain(finding.status);
      });
    });
  });

  it('accurately tallies warning and attention counts in key terms', () => {
    const doc = SAMPLE_RESIDENTIAL_RENTAL;
    const attentionFindings = doc.findings.filter(
      (f) => f.severity === 'warning' || f.severity === 'attention'
    );
    expect(doc.keyTerms.attentionItemsCount).toBe(attentionFindings.length);
  });
});
