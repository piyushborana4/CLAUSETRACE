import { describe, it, expect } from 'vitest';
import { 
  generateHeuristicDocumentAnalysis, 
  matchQuestionAgainstDocumentLocally,
  generateFallbackBriefing,
  generateFallbackComparison,
  generateFallbackEmailDraft
} from '../../server/heuristicFallbacks';
import { askQuestionWithGemini } from '../../server/geminiService';
import { LegalDocument } from '../types';

describe('Heuristic Fallback Engine & Grounding Logic', () => {
  describe('Document Type Branching Logic', () => {
    it('branches into Commercial Lease Agreement when keywords (lease/rent/lessor/tenant) are detected', () => {
      const leaseAnalysisByTitle = generateHeuristicDocumentAnalysis('Office Lease Agreement', 'Standard terms.');
      expect(leaseAnalysisByTitle.documentType).toBe('Commercial Lease Agreement');
      expect(leaseAnalysisByTitle.isFallbackDemo).toBe(true);
      expect(leaseAnalysisByTitle.pageCount).toBe(4);
      expect(leaseAnalysisByTitle.parties).toContain('Lessor');
      expect(leaseAnalysisByTitle.parties).toContain('Lessee');
      expect(leaseAnalysisByTitle.findings?.[0]?.title).toContain('Lock-in');

      const leaseAnalysisByText = generateHeuristicDocumentAnalysis('Property Contract', 'The tenant agrees to pay rent to lessor.');
      expect(leaseAnalysisByText.documentType).toBe('Commercial Lease Agreement');
      expect(leaseAnalysisByText.isFallbackDemo).toBe(true);
    });

    it('branches into Employment Agreement when keywords (employment/offer/employee/salary) are detected', () => {
      const employmentByTitle = generateHeuristicDocumentAnalysis('Offer Letter & Employment Agreement', 'Terms of work.');
      expect(employmentByTitle.documentType).toBe('Employment Agreement');
      expect(employmentByTitle.isFallbackDemo).toBe(true);
      expect(employmentByTitle.pageCount).toBe(3);
      expect(employmentByTitle.parties).toContain('Company');
      expect(employmentByTitle.parties).toContain('Employee');
      expect(employmentByTitle.keyTerms?.fixedSalary).toBeDefined();
      expect(employmentByTitle.findings?.some(f => f.category === 'TERMINATION')).toBe(true);

      const employmentByText = generateHeuristicDocumentAnalysis('General Letter', 'The employee compensation and annual salary shall be determined.');
      expect(employmentByText.documentType).toBe('Employment Agreement');
      expect(employmentByText.isFallbackDemo).toBe(true);
    });

    it('branches into Commercial Agreement default fallback when no specific category is matched', () => {
      const defaultAnalysis = generateHeuristicDocumentAnalysis('Partnership Accord', 'Two parties mutually agree to collaborate on research.');
      expect(defaultAnalysis.documentType).toBe('Commercial Agreement');
      expect(defaultAnalysis.isFallbackDemo).toBe(true);
      expect(defaultAnalysis.pageCount).toBe(2);
      expect(defaultAnalysis.parties).toEqual(['Party A', 'Party B']);
      expect(defaultAnalysis.findings?.[0]?.severity).toBe('normal');
    });

    it('always attaches isFallbackDemo: true to prevent deceptive presentation as live AI analysis', () => {
      const docs = [
        generateHeuristicDocumentAnalysis('Lease Doc', ''),
        generateHeuristicDocumentAnalysis('Employment Doc', ''),
        generateHeuristicDocumentAnalysis('Misc Doc', '')
      ];
      docs.forEach(doc => {
        expect(doc.isFallbackDemo).toBe(true);
      });
    });
  });

  describe('Adversarial NOT_FOUND Behavior & Strict Grounding', () => {
    const mockDoc: LegalDocument = {
      id: 'doc-test-1',
      title: 'Senior Software Engineer Employment Agreement',
      documentType: 'Employment Agreement',
      parties: ['TechCorp Inc.', 'Jane Doe'],
      pageCount: 2,
      uploadedAt: new Date().toISOString(),
      source: 'user',
      keyTerms: {
        compensation: '$150,000 Annual Base Salary',
        noticePeriod: '60 Days Written Notice',
        probationPeriod: '3 Months',
        attentionItemsCount: 1,
      },
      findings: [
        {
          id: 'f-1',
          title: 'Notice Period Duration',
          category: 'TERMINATION',
          status: 'DOCUMENT_SUPPORTED',
          summary: '60 days written notice required.',
          page: 1,
          section: 'Section 4.1',
          evidence: 'either party may terminate employment by giving sixty (60) days prior written notice.',
          why_it_matters: 'Defines departure timeline.',
          suggested_action: 'Negotiate shorter notice.',
          requires_professional_review: false,
          severity: 'attention',
        },
      ],
      crossClauseRelationships: [],
      missingOrAmbiguous: [],
      checklist: [],
      pages: [
        {
          pageNumber: 1,
          title: 'Terms of Employment',
          sections: [
            {
              sectionNumber: 'Section 4.1',
              heading: 'Notice of Termination',
              text: 'either party may terminate employment by giving sixty (60) days prior written notice.',
            },
          ],
          rawText: 'Full agreement text covering standard employee duties, compensation, and office policies.',
        },
      ],
    };

    it('adversarially flags NOT_FOUND for queries with no supporting evidence (Relocation)', async () => {
      const ans = await askQuestionWithGemini({
        document: mockDoc,
        question: 'Does the company reimburse relocation expenses or moving costs?',
      });

      expect(ans.status).toBe('NOT_FOUND');
      expect(ans.shortAnswer).toBe('NOT FOUND');
      expect(ans.explanation.toLowerCase()).toContain("couldn't find a clause");
      expect(ans.actionDraftType).toBe('email');
    });

    it('adversarially flags NOT_FOUND for queries with no supporting evidence (Crypto / Pension)', () => {
      const cryptoAns = matchQuestionAgainstDocumentLocally(mockDoc, 'Can I receive my salary in crypto payment?');
      expect(cryptoAns.status).toBe('NOT_FOUND');
      expect(cryptoAns.shortAnswer).toBe('NOT FOUND');

      const pensionAns = matchQuestionAgainstDocumentLocally(mockDoc, 'What is the employer pension contribution match?');
      expect(pensionAns.status).toBe('NOT_FOUND');
      expect(pensionAns.shortAnswer).toBe('NOT FOUND');
    });

    it('accurately identifies DOCUMENT_SUPPORTED findings for questions with textual evidence', () => {
      const noticeAns = matchQuestionAgainstDocumentLocally(mockDoc, 'What is my notice period if I resign?');
      expect(noticeAns.status).toBe('DOCUMENT_SUPPORTED');
      expect(noticeAns.page).toBe(1);
      expect(noticeAns.section).toBeTruthy();
      expect(noticeAns.evidence).toBeTruthy();
      expect(noticeAns.evidence).toContain('sixty (60) days');
    });
  });

  describe('Pure Fallback Helper Functions', () => {
    const sampleDoc: LegalDocument = {
      id: 'doc-briefing-test',
      title: 'Master Service Agreement',
      documentType: 'Commercial Agreement',
      parties: ['Vendor LLC', 'Client Corp'],
      pageCount: 5,
      effectiveDate: 'Jan 1, 2026',
      uploadedAt: new Date().toISOString(),
      source: 'user',
      keyTerms: {
        compensation: 'Fixed fee milestone billing',
        noticePeriod: '30 Days',
        attentionItemsCount: 1,
      },
      findings: [
        {
          id: 'f-1',
          title: 'Audit Rights',
          category: 'CONFIDENTIALITY',
          status: 'DOCUMENT_SUPPORTED',
          summary: 'Client retains annual audit right.',
          page: 3,
          section: 'Section 9',
          evidence: 'Client shall have the right to audit books annually.',
          why_it_matters: 'Vendor compliance verification.',
          suggested_action: 'Ensure books are up to date.',
          requires_professional_review: false,
          severity: 'normal',
        },
      ],
      crossClauseRelationships: [],
      missingOrAmbiguous: [
        {
          id: 'm-1',
          topic: 'Service Level Agreement (SLA) Remedies',
          status: 'NOT_FOUND',
          description: 'No penalty specified for downtime.',
          whyItMatters: 'No recourse for service interruption.',
          recommendedAction: 'Request SLA uptime credit schedule.',
        }
      ],
      checklist: [],
      pages: [],
    };

    it('generateFallbackBriefing creates structured timeline and legal review questions', () => {
      const briefing = generateFallbackBriefing(sampleDoc);
      expect(briefing.documentTitle).toBe('Master Service Agreement');
      expect(briefing.timeline.length).toBeGreaterThan(0);
      expect(briefing.criticalClauses.length).toBe(1);
      expect(briefing.criticalClauses[0].quote).toContain('Client shall have the right');
      expect(briefing.missingDocumentsOrClauses).toContain('Service Level Agreement (SLA) Remedies');
      expect(briefing.questionsForLegalProfessional.length).toBeGreaterThan(0);
    });

    it('generateFallbackComparison computes factual differences across document revisions', () => {
      const docB: LegalDocument = {
        ...sampleDoc,
        id: 'doc-b',
        title: 'Master Service Agreement V2',
        keyTerms: {
          ...sampleDoc.keyTerms,
          noticePeriod: '60 Days',
        }
      };

      const comparison = generateFallbackComparison(sampleDoc, docB);
      expect(comparison.items.length).toBeGreaterThan(0);
      const noticeItem = comparison.items.find(i => i.topic === 'Notice Period');
      expect(noticeItem?.status).toBe('CHANGED');
      expect(noticeItem?.docAValue).toBe('30 Days');
      expect(noticeItem?.docBValue).toBe('60 Days');
    });

    it('generateFallbackEmailDraft formats professional communication with referenced clauses', () => {
      const draft = generateFallbackEmailDraft({
        findingTitle: 'Mandatory Non-Compete Scope',
        category: 'RESTRICTIVE_COVENANTS',
        evidence: 'Employee covenants not to compete globally for 24 months.',
        section: 'Section 12.3',
        page: 4,
        recipientRole: 'HR Director',
      });

      expect(draft.recipientRole).toBe('HR Director');
      expect(draft.subject).toContain('Mandatory Non-Compete Scope');
      expect(draft.body).toContain('Section 12.3');
      expect(draft.body).toContain('Page 4');
      expect(draft.referencedClauses[0].section).toBe('Section 12.3');
    });
  });
});
