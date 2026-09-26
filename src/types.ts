export type ResponseStatus = 
  | 'DOCUMENT_SUPPORTED'
  | 'DOCUMENT_INTERPRETATION'
  | 'NOT_FOUND'
  | 'AMBIGUOUS';

export type FindingCategory = 
  | 'COMPENSATION'
  | 'TERMINATION'
  | 'FINANCIAL_OBLIGATION'
  | 'RESTRICTION'
  | 'INTELLECTUAL_PROPERTY'
  | 'CONFIDENTIALITY'
  | 'RENEWAL_CANCELLATION'
  | 'DISPUTE_RESOLUTION'
  | 'COMPLIANCE'
  | 'GENERAL';

export interface Finding {
  id: string;
  title: string;
  category: FindingCategory;
  status: ResponseStatus;
  summary: string;
  page: number;
  section: string;
  evidence: string; // Exact quote from document
  why_it_matters: string;
  suggested_action: string;
  requires_professional_review: boolean;
  severity?: 'normal' | 'attention' | 'warning';
}

export interface KeyTerms {
  compensation?: string;
  fixedSalary?: string;
  variableComp?: string;
  probationPeriod?: string;
  noticePeriod?: string;
  bondOrLockIn?: string;
  financialObligations?: string;
  ipOwnership?: string;
  confidentiality?: string;
  nonCompete?: string;
  governingLaw?: string;
  attentionItemsCount: number;
}

export interface DocumentPage {
  pageNumber: number;
  title?: string;
  sections: {
    sectionNumber: string;
    heading: string;
    text: string;
  }[];
  rawText: string;
}

export interface CrossClauseRelationship {
  id: string;
  title: string;
  clauseA: {
    section: string;
    page: number;
    title: string;
    excerpt: string;
  };
  clauseB: {
    section: string;
    page: number;
    title: string;
    excerpt: string;
  };
  relationshipExplanation: string;
  reviewImplication: string;
}

export interface MissingOrAmbiguousItem {
  id: string;
  topic: string;
  status: 'NOT_FOUND' | 'AMBIGUOUS';
  description: string;
  whyItMatters: string;
  recommendedAction: string;
  relatedSections?: { section: string; page: number; note: string }[];
}

export interface ChecklistItem {
  id: string;
  text: string;
  category: string;
  linkedFindingId?: string;
  page?: number;
  section?: string;
  completed: boolean;
  actionType?: 'clarify_hr' | 'request_doc' | 'review_lawyer' | 'personal_check';
  evidenceSnippet?: string;
  actionDraftType?: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  accountType: 'personal' | 'demo';
  provider: 'google' | 'password' | 'demo';
}

export interface LegalDocument {
  id: string;
  title: string;
  documentType: string;
  parties: string[];
  effectiveDate?: string;
  jurisdiction?: string;
  pageCount: number;
  uploadedAt: string;
  fileSize?: string;
  keyTerms: KeyTerms;
  findings: Finding[];
  crossClauseRelationships: CrossClauseRelationship[];
  missingOrAmbiguous: MissingOrAmbiguousItem[];
  checklist: ChecklistItem[];
  pages: DocumentPage[];
  source: 'demo' | 'user';
  isDemo?: boolean;
  isFallbackDemo?: boolean;
  status?: 'analyzing' | 'ready' | 'error';
  lastOpened?: string;
}

export interface QuestionAnswer {
  id: string;
  question: string;
  status: ResponseStatus;
  shortAnswer: string;
  explanation: string;
  page?: number;
  section?: string;
  evidence?: string; // Exact quote from document
  nextAction?: string;
  actionDraftType?: 'email' | 'checklist' | 'professional_note';
  confidenceNote?: string;
  suggestedChecklistItem?: string;
}

export interface DocumentComparisonItem {
  id: string;
  topic: string;
  category: string;
  docAValue: string;
  docAPage?: number;
  docASection?: string;
  docBValue: string;
  docBPage?: number;
  docBSection?: string;
  status: 'ADDED' | 'REMOVED' | 'CHANGED' | 'UNCHANGED' | 'POSSIBLE_INCONSISTENCY';
  factualDifference: string;
  clarificationNote: string;
}

export interface DocumentComparison {
  id: string;
  docAId: string;
  docATitle: string;
  docBId: string;
  docBTitle: string;
  comparisonDate: string;
  summary: string;
  items: DocumentComparisonItem[];
}

export interface GeneralLegalInfoTopic {
  id: string;
  query: string;
  jurisdiction: string;
  category: string;
  plainLanguageExplanation: string;
  generalProcess: {
    step: number;
    title: string;
    description: string;
  }[];
  relevantDocuments: string[];
  possibleNextSteps: string[];
  questionsToConsider: string[];
  statutorySources: string[];
  limitations: string;
  title?: string;
  plainSummary?: string;
  commonScenarios?: string[];
  whatToLookFor?: string[];
  questionsToAsk?: string[];
}

export interface ClarificationEmailDraft {
  id: string;
  findingId?: string;
  recipientRole: string; // e.g., 'HR Department', 'Legal Counsel', 'Hiring Manager', 'Landlord'
  subject: string;
  body: string;
  referencedClauses: { section: string; page: number; title: string }[];
  tone: 'professional_neutral' | 'polite_inquiry' | 'formal_clarification';
}

export interface ProfessionalBriefing {
  id: string;
  documentTitle: string;
  datePrepared: string;
  matterSummary: string;
  documentsReviewed: {
    title: string;
    pages: number;
    effectiveDate?: string;
  }[];
  timeline: {
    event: string;
    dateOrPeriod: string;
    documentReference: string;
  }[];
  criticalClauses: {
    section: string;
    page: number;
    title: string;
    quote: string;
    concern: string;
  }[];
  unresolvedQuestions: string[];
  missingDocumentsOrClauses: string[];
  questionsForLegalProfessional: string[];
}
