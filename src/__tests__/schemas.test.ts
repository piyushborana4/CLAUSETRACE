import { 
  LegalDocumentSchema, 
  FindingSchema, 
  KeyTermsSchema, 
  QuestionAnswerSchema, 
  DocumentComparisonSchema,
  ClarificationEmailDraftSchema,
  ProfessionalBriefingSchema,
  validateLegalDocument
} from '../lib/schemas';

describe('Zod Runtime Schema Validation Suite', () => {
  it('validates a well-formed Finding object', () => {
    const validFinding = {
      id: 'f-test-1',
      title: 'Notice Period Duration',
      category: 'TERMINATION',
      status: 'DOCUMENT_SUPPORTED',
      summary: '90 days written notice required.',
      page: 2,
      section: 'Section 14.2',
      evidence: 'either party may terminate by giving 90 days notice.',
      why_it_matters: 'Affects timeline.',
      suggested_action: 'Clarify with HR.',
      requires_professional_review: false,
      severity: 'attention',
    };

    const result = FindingSchema.safeParse(validFinding);
    expect(result.success).toBe(true);
  });

  it('rejects an invalid finding category', () => {
    const invalidFinding = {
      id: 'f-test-2',
      title: 'Invalid Category Finding',
      category: 'NON_EXISTENT_CATEGORY',
      status: 'DOCUMENT_SUPPORTED',
      summary: 'Test summary',
      page: 1,
      section: 'Sec 1',
      evidence: 'Evidence',
    };

    const result = FindingSchema.safeParse(invalidFinding);
    expect(result.success).toBe(false);
  });

  it('validates a complete LegalDocument entity', () => {
    const validDoc = {
      id: 'doc-valid-1',
      title: 'Employment Agreement 2026',
      documentType: 'Employment Agreement',
      parties: ['Company Inc', 'Jane Doe'],
      pageCount: 3,
      uploadedAt: new Date().toISOString(),
      keyTerms: {
        compensation: '$120,000 / year',
        noticePeriod: '30 Days',
        attentionItemsCount: 1,
      },
      findings: [
        {
          id: 'f-1',
          title: 'Base Salary',
          category: 'COMPENSATION',
          status: 'DOCUMENT_SUPPORTED',
          summary: '$120,000 base salary',
          page: 1,
          section: 'Section 3',
          evidence: 'Base salary shall be $120,000 per annum.',
          why_it_matters: 'Core compensation',
          suggested_action: 'Verify payment dates',
          requires_professional_review: false,
          severity: 'normal',
        },
      ],
      crossClauseRelationships: [],
      missingOrAmbiguous: [],
      checklist: [],
      pages: [
        {
          pageNumber: 1,
          title: 'Page 1',
          sections: [
            {
              sectionNumber: 'Section 3',
              heading: 'Salary',
              text: 'Base salary shall be $120,000 per annum.',
            },
          ],
          rawText: 'Base salary shall be $120,000 per annum.',
        },
      ],
      source: 'user',
    };

    const result = validateLegalDocument(validDoc);
    expect(result.success).toBe(true);
  });

  it('validates QuestionAnswer schema for NOT_FOUND queries', () => {
    const notFoundAnswer = {
      id: 'ans-1',
      question: 'Is relocation covered?',
      status: 'NOT_FOUND',
      shortAnswer: 'NOT FOUND',
      explanation: "I couldn't find a clause in the provided document addressing relocation allowance.",
      nextAction: 'Ask HR for written confirmation.',
    };

    const result = QuestionAnswerSchema.safeParse(notFoundAnswer);
    expect(result.success).toBe(true);
  });
});
