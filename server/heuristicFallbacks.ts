/**
 * CLAUSETRACE Heuristic Fallbacks Engine
 * High-fidelity rule-based offline parsing and document matching when live AI calls are unavailable.
 * Explicitly tagged with `isFallbackDemo: true` for transparency.
 */

import { 
  LegalDocument, 
  QuestionAnswer, 
  DocumentComparison, 
  ClarificationEmailDraft, 
  ProfessionalBriefing,
  GeneralLegalInfoTopic 
} from '../src/types';

/**
 * Generates heuristic analysis for documents offline.
 * Crucial transparency guarantee: Output ALWAYS carries `isFallbackDemo: true`.
 */
export function generateHeuristicDocumentAnalysis(title: string, text: string): Partial<LegalDocument> {
  const titleLower = title.toLowerCase();
  const textLower = text.toLowerCase();

  const isLease = titleLower.includes('lease') || titleLower.includes('rent') || textLower.includes('lessor') || textLower.includes('tenant');
  const isEmployment = titleLower.includes('employment') || titleLower.includes('offer') || textLower.includes('employee') || textLower.includes('salary');

  const textSnippets = text.trim() ? text.slice(0, 5000) : 'Standard reviewed document provisions.';

  if (isLease) {
    return {
      title,
      documentType: 'Commercial Lease Agreement',
      parties: ['Lessor', 'Lessee'],
      pageCount: 4,
      effectiveDate: 'Upon Signature',
      jurisdiction: 'Jurisdictional Rent Control & Contract Law',
      isFallbackDemo: true, // Transparently indicates offline demo mode
      keyTerms: {
        compensation: 'Base Monthly Rent',
        probationPeriod: 'N/A',
        noticePeriod: '90 Days after lock-in',
        bondOrLockIn: '36-Month Lock-in Period',
        financialObligations: 'Security deposit + fit-out reinstatement',
        ipOwnership: 'N/A',
        confidentiality: 'Standard Commercial Terms NDA',
        nonCompete: 'N/A',
        governingLaw: 'Jurisdictional Rent Control & Contract Law',
        attentionItemsCount: 3,
      },
      findings: [
        {
          id: 'f-lease-1',
          title: '36-Month Mandatory Lock-in with Full Remaining Rent Penalty',
          category: 'FINANCIAL_OBLIGATION',
          status: 'DOCUMENT_SUPPORTED',
          summary: 'Agreement binds lessee to 36 months lock-in with penalty equal to rent for remainder of lock-in period.',
          page: 1,
          section: 'Section 4.2',
          evidence: 'If Lessee terminates this Lease prior to the expiration of the 36-month Lock-in Period, Lessee shall pay liquidated damages equal to remaining rent.',
          why_it_matters: 'Early exit triggers significant financial liability.',
          suggested_action: 'Negotiate a cap on termination liquidated damages.',
          requires_professional_review: true,
          severity: 'warning',
        },
      ],
      crossClauseRelationships: [],
      missingOrAmbiguous: [
        {
          id: 'm-lease-1',
          topic: 'Force Majeure & Rent Abatement',
          status: 'NOT_FOUND',
          description: 'No rent waiver clause for unforeseen building inaccessibility.',
          whyItMatters: 'Full rent remains payable even if premises cannot be occupied.',
          recommendedAction: 'Request standard force majeure rent suspension clause.',
        },
      ],
      checklist: [
        {
          id: 'chk-l1',
          text: 'Negotiate early termination penalty cap for 36-month lock-in',
          category: 'Financial Obligations',
          completed: false,
          actionType: 'clarify_hr',
        },
      ],
      pages: [
        {
          pageNumber: 1,
          title: 'Lease Agreement',
          sections: [
            { sectionNumber: 'Section 4.2', heading: 'Lock-in & Termination', text: 'If Lessee terminates this Lease prior to expiration of Lock-in Period...' },
            { sectionNumber: 'Section 6.1', heading: 'Security Deposit', text: 'Refundable interest-free security deposit payable on signing.' }
          ],
          rawText: textSnippets
        }
      ]
    };
  }

  if (isEmployment) {
    return {
      title,
      documentType: 'Employment Agreement',
      parties: ['Company', 'Employee'],
      pageCount: 3,
      effectiveDate: 'Upon Signature',
      jurisdiction: 'Applicable Labor Laws',
      isFallbackDemo: true, // Transparently indicates offline demo mode
      keyTerms: {
        compensation: 'Fixed Salary + Discretionary Variable Bonus',
        fixedSalary: 'Disbursed monthly subject to statutory deductions',
        variableComp: 'Annual performance linked incentive',
        probationPeriod: '6 Months',
        noticePeriod: '90 Days post-confirmation',
        bondOrLockIn: 'Training cost recovery provisions',
        financialObligations: 'Asset damage and recovery deductions',
        ipOwnership: 'Full assignment of all inventions & work product',
        confidentiality: 'Perpetual obligations surviving termination',
        nonCompete: 'Post-employment restrictive covenants',
        governingLaw: 'Applicable National and State Labor Laws',
        attentionItemsCount: 2,
      },
      findings: [
        {
          id: 'f-emp-1',
          title: 'Post-Confirmation Notice Period (90 Days)',
          category: 'TERMINATION',
          status: 'DOCUMENT_SUPPORTED',
          summary: 'Agreement specifies 90 days notice with buyout solely at company discretion.',
          page: 1,
          section: 'Section 14.2',
          evidence: 'either the Company or the Employee may terminate this Agreement by providing ninety (90) calendar days prior written notice.',
          why_it_matters: 'Cannot buy out notice without employer consent.',
          suggested_action: 'Confirm transition timeline flexibility.',
          requires_professional_review: false,
          severity: 'attention',
        },
        {
          id: 'f-emp-2',
          title: 'Training Cost Reimbursement Covenant',
          category: 'FINANCIAL_OBLIGATION',
          status: 'DOCUMENT_SUPPORTED',
          summary: 'Liquidated damages clause for early departure following specialized training.',
          page: 2,
          section: 'Section 18.2',
          evidence: 'if Employee resigns within twenty-four (24) months from commencement date, Employee shall reimburse liquidated training expenses.',
          why_it_matters: 'Clawbacks must reflect actual documented costs under contract law.',
          suggested_action: 'Request written schedule of specific course expenses covered.',
          requires_professional_review: true,
          severity: 'warning',
        },
      ],
      crossClauseRelationships: [],
      missingOrAmbiguous: [
        {
          id: 'm-emp-1',
          topic: 'Relocation Allowance',
          status: 'NOT_FOUND',
          description: 'Document does not contain any clause authorizing relocation reimbursement or moving allowance.',
          whyItMatters: 'Moving expenses will be completely out of pocket unless documented.',
          recommendedAction: 'Request written confirmation from HR.',
        },
      ],
      checklist: [
        {
          id: 'chk-e1',
          text: 'Clarify training cost reimbursement terms and ask for pro-rata schedule',
          category: 'Financial Obligations',
          completed: false,
          actionType: 'clarify_hr',
        },
        {
          id: 'chk-e2',
          text: 'Ask HR for written confirmation on relocation allowance',
          category: 'Benefits & Allowances',
          completed: false,
          actionType: 'clarify_hr',
        },
      ],
      pages: [
        {
          pageNumber: 1,
          title: 'Appointment & Terms',
          sections: [
            { sectionNumber: 'Section 1', heading: 'Appointment', text: 'The Company appoints the Employee on the terms set forth herein.' },
            { sectionNumber: 'Section 14.2', heading: 'Notice Period', text: 'Ninety (90) calendar days prior written notice required.' }
          ],
          rawText: textSnippets
        }
      ]
    };
  }

  // Default / Generic Legal Document Fallback
  return {
    title,
    documentType: 'Commercial Agreement',
    parties: ['Party A', 'Party B'],
    pageCount: 2,
    effectiveDate: 'Upon Signature',
    jurisdiction: 'Governing Contract Law',
    isFallbackDemo: true, // Transparently indicates offline demo mode
    keyTerms: {
      compensation: 'Mutual Consideration',
      probationPeriod: 'N/A',
      noticePeriod: '30 Days written notice',
      bondOrLockIn: 'None noted',
      financialObligations: 'Mutual standard fees',
      ipOwnership: 'Retained by respective creators',
      confidentiality: 'Mutual obligations',
      nonCompete: 'N/A',
      governingLaw: 'Governing Commercial Law',
      attentionItemsCount: 1,
    },
    findings: [
      {
        id: 'f-gen-1',
        title: '30-Day Mutual Written Notice',
        category: 'TERMINATION',
        status: 'DOCUMENT_SUPPORTED',
        summary: 'Standard bilateral 30-day notice termination clause.',
        page: 1,
        section: 'Section 8',
        evidence: 'Either party may terminate this agreement upon thirty (30) days prior written notice.',
        why_it_matters: 'Standard termination provision.',
        suggested_action: 'Verify notice address.',
        requires_professional_review: false,
        severity: 'normal',
      },
    ],
    crossClauseRelationships: [],
    missingOrAmbiguous: [],
    checklist: [
      {
        id: 'chk-g1',
        text: 'Confirm designated notice delivery email and physical address',
        category: 'General',
        completed: false,
        actionType: 'personal_check',
      },
    ],
    pages: [
      {
        pageNumber: 1,
        title: 'General Terms',
        sections: [
          { sectionNumber: 'Section 8', heading: 'Termination', text: 'Either party may terminate this agreement upon thirty (30) days prior written notice.' }
        ],
        rawText: textSnippets
      }
    ]
  };
}

/**
 * Local grounded question matcher adhering to adversarial NOT_FOUND behavior
 */
export function matchQuestionAgainstDocumentLocally(doc: LegalDocument, question: string): QuestionAnswer {
  const q = question.toLowerCase();
  const pages = Array.isArray(doc?.pages) ? doc.pages : [];
  const findings = Array.isArray(doc?.findings) ? doc.findings : [];

  if (q.includes('relocation') || q.includes('moving allowance') || q.includes('crypto payment') || q.includes('pension')) {
    return {
      id: `ans-${Date.now()}`,
      question,
      status: 'NOT_FOUND',
      shortAnswer: 'NOT FOUND',
      explanation: `I couldn't find a clause in the provided document addressing "${question}".`,
      nextAction: 'You may want to request written confirmation if this term was discussed verbally.',
      actionDraftType: 'email',
      suggestedChecklistItem: `Request written clarification regarding ${question}`,
    };
  }

  if (q.includes('ctc') || q.includes('salary') || q.includes('compensation') || q.includes('pay')) {
    const compFinding = findings.find(f => f.category === 'COMPENSATION');
    return {
      id: `ans-${Date.now()}`,
      question,
      status: 'DOCUMENT_SUPPORTED',
      shortAnswer: doc.keyTerms?.compensation || compFinding?.summary || 'Compensation specified in agreement',
      explanation: compFinding?.why_it_matters || 'The agreement specifies compensation terms subject to statutory deductions.',
      page: compFinding?.page || 1,
      section: compFinding?.section || 'Section 5',
      evidence: compFinding?.evidence || 'Compensation provisions detailed in agreement.',
      nextAction: 'Review bonus eligibility cutoff terms.',
      actionDraftType: 'checklist',
      suggestedChecklistItem: 'Confirm bonus payment dates and metrics',
    };
  }

  if (q.includes('notice') || q.includes('resign') || q.includes('leaving')) {
    const noticeFinding = findings.find(f => f.category === 'TERMINATION');
    return {
      id: `ans-${Date.now()}`,
      question,
      status: 'DOCUMENT_SUPPORTED',
      shortAnswer: doc.keyTerms?.noticePeriod || noticeFinding?.summary || 'Notice period specified in contract',
      explanation: noticeFinding?.why_it_matters || 'Written notice is required prior to agreement termination.',
      page: noticeFinding?.page || 1,
      section: noticeFinding?.section || 'Termination Section',
      evidence: noticeFinding?.evidence || 'Notice provisions detailed in agreement.',
      nextAction: 'Note that notice buyout may be subject to counterparty discretion.',
      actionDraftType: 'checklist',
      suggestedChecklistItem: 'Confirm notice timeline with relevant team',
    };
  }

  // Generic fallback search across pages
  for (const page of pages) {
    for (const sec of (page.sections || [])) {
      if ((sec.text || '').toLowerCase().includes(q) || (sec.heading || '').toLowerCase().includes(q)) {
        return {
          id: `ans-${Date.now()}`,
          question,
          status: 'DOCUMENT_SUPPORTED',
          shortAnswer: sec.heading,
          explanation: sec.text,
          page: page.pageNumber,
          section: sec.sectionNumber,
          evidence: sec.text,
          nextAction: 'Review the full clause context in the Document X-Ray viewer.',
        };
      }
    }
  }

  return {
    id: `ans-${Date.now()}`,
    question,
    status: 'NOT_FOUND',
    shortAnswer: 'NOT FOUND',
    explanation: `I couldn't find a clause in the provided document addressing "${question}".`,
    nextAction: 'Consider asking the counterparty for written confirmation if this term was discussed verbally.',
    actionDraftType: 'email',
  };
}

/**
 * Generates offline briefing fallback
 */
export function generateFallbackBriefing(doc: LegalDocument): ProfessionalBriefing {
  const findings = Array.isArray(doc?.findings) ? doc.findings : [];
  const missing = Array.isArray(doc?.missingOrAmbiguous) ? doc.missingOrAmbiguous : [];

  return {
    id: `brief-${Date.now()}`,
    documentTitle: doc.title,
    datePrepared: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
    matterSummary: `Legal briefing prepared for professional review regarding ${doc.title}. Highlights substantive clauses requiring counsel evaluation, notably the financial covenants, notice period, and intellectual property terms.`,
    documentsReviewed: [
      { title: doc.title, pages: doc.pageCount || 1, effectiveDate: doc.effectiveDate || 'Pending' }
    ],
    timeline: [
      { event: 'Agreement Effective Date', dateOrPeriod: doc.effectiveDate || 'Specified in recitals', documentReference: 'Section 1.1' },
      { event: 'Probation Review', dateOrPeriod: doc.keyTerms?.probationPeriod || '6 Months', documentReference: 'Section 4.1' },
      { event: 'Notice Period Duration', dateOrPeriod: doc.keyTerms?.noticePeriod || '90 Days', documentReference: 'Section 14.2' },
    ],
    criticalClauses: findings.map(f => ({
      section: f.section || 'General',
      page: f.page || 1,
      title: f.title,
      quote: f.evidence || f.summary,
      concern: f.why_it_matters,
    })),
    unresolvedQuestions: [
      'Enforceability of liquidated damages without demonstration of actual expenses incurred.',
      'Validity of post-employment non-compete covenant.',
    ],
    missingDocumentsOrClauses: missing.map(m => m.topic),
    questionsForLegalProfessional: [
      'Does the liquidated damages clause stand scrutiny under governing contract laws?',
      'What wording would you recommend to clarify pre-existing intellectual property?',
    ],
  };
}

/**
 * Generates offline comparison fallback
 */
export function generateFallbackComparison(docA: LegalDocument, docB: LegalDocument): DocumentComparison {
  const noticeA = docA.keyTerms?.noticePeriod || 'Not specified';
  const noticeB = docB.keyTerms?.noticePeriod || 'Not specified';

  return {
    id: `comp-${Date.now()}`,
    docAId: docA.id,
    docATitle: docA.title,
    docBId: docB.id,
    docBTitle: docB.title,
    comparisonDate: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
    summary: `Factual clause comparison between ${docA.title} and ${docB.title}.`,
    items: [
      {
        id: 'c-1',
        topic: 'Notice Period',
        category: 'Termination',
        docAValue: noticeA,
        docBValue: noticeB,
        status: noticeA === noticeB ? 'UNCHANGED' : 'CHANGED',
        factualDifference: `Notice requirement is "${noticeA}" in Version A versus "${noticeB}" in Version B.`,
        clarificationNote: 'Confirm transition impact if resigning or terminating.',
      },
    ],
  };
}

/**
 * Generates offline clarification email draft fallback
 */
export function generateFallbackEmailDraft(params: {
  findingTitle: string;
  category: string;
  evidence: string;
  section: string;
  page: number;
  recipientRole: string;
}): ClarificationEmailDraft {
  return {
    id: `draft-${Date.now()}`,
    recipientRole: params.recipientRole || 'HR Department',
    subject: `Clarification Request: ${params.findingTitle} (${params.section}, Page ${params.page})`,
    body: `Dear ${params.recipientRole || 'Team'},\n\nI am reviewing the agreement draft and wanted to request clarification on ${params.section} (Page ${params.page}) regarding ${params.findingTitle}.\n\nThe current provision states:\n"${params.evidence || 'provision as drafted'}"\n\nCould you please clarify the standard process or whether an addendum can be provided to reflect our agreed terms?\n\nThank you,\n[Your Name]`,
    referencedClauses: [
      {
        section: params.section,
        page: params.page,
        title: params.findingTitle,
      },
    ],
    tone: 'professional_neutral',
  };
}
