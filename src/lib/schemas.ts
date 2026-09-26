import { z } from 'zod';

/**
 * CLAUSETRACE Enterprise Runtime Validation Schemas (Powered by Zod)
 * Ensures strict runtime integrity across API boundaries, Firestore sync, and Local Cache.
 */

export const ResponseStatusSchema = z.enum([
  'DOCUMENT_SUPPORTED',
  'DOCUMENT_INTERPRETATION',
  'NOT_FOUND',
  'AMBIGUOUS',
]);

export const FindingCategorySchema = z.enum([
  'COMPENSATION',
  'TERMINATION',
  'FINANCIAL_OBLIGATION',
  'RESTRICTION',
  'INTELLECTUAL_PROPERTY',
  'CONFIDENTIALITY',
  'RENEWAL_CANCELLATION',
  'DISPUTE_RESOLUTION',
  'COMPLIANCE',
  'GENERAL',
]);

export const FindingSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  category: FindingCategorySchema,
  status: ResponseStatusSchema,
  summary: z.string(),
  page: z.number().int().positive().default(1),
  section: z.string().default('Section 1'),
  evidence: z.string().default(''),
  why_it_matters: z.string().default(''),
  suggested_action: z.string().default(''),
  requires_professional_review: z.boolean().default(false),
  severity: z.enum(['normal', 'attention', 'warning']).default('normal'),
});

export const KeyTermsSchema = z.object({
  compensation: z.string().optional(),
  fixedSalary: z.string().optional(),
  variableComp: z.string().optional(),
  probationPeriod: z.string().optional(),
  noticePeriod: z.string().optional(),
  bondOrLockIn: z.string().optional(),
  financialObligations: z.string().optional(),
  ipOwnership: z.string().optional(),
  confidentiality: z.string().optional(),
  nonCompete: z.string().optional(),
  governingLaw: z.string().optional(),
  attentionItemsCount: z.number().int().nonnegative().default(0),
});

export const SectionSchema = z.object({
  sectionNumber: z.string(),
  heading: z.string(),
  text: z.string(),
});

export const DocumentPageSchema = z.object({
  pageNumber: z.number().int().positive(),
  title: z.string().optional(),
  sections: z.array(SectionSchema).default([]),
  rawText: z.string().default(''),
});

export const CrossClauseRelationshipSchema = z.object({
  id: z.string(),
  title: z.string(),
  clauseA: z.object({
    section: z.string(),
    page: z.number().int().positive(),
    title: z.string(),
    excerpt: z.string(),
  }),
  clauseB: z.object({
    section: z.string(),
    page: z.number().int().positive(),
    title: z.string(),
    excerpt: z.string(),
  }),
  relationshipExplanation: z.string(),
  reviewImplication: z.string(),
});

export const MissingOrAmbiguousItemSchema = z.object({
  id: z.string(),
  topic: z.string(),
  status: z.enum(['NOT_FOUND', 'AMBIGUOUS']),
  description: z.string(),
  whyItMatters: z.string(),
  recommendedAction: z.string(),
  relatedSections: z
    .array(
      z.object({
        section: z.string(),
        page: z.number().int().positive(),
        note: z.string(),
      })
    )
    .optional(),
});

export const ChecklistItemSchema = z.object({
  id: z.string(),
  text: z.string().min(1),
  category: z.string().default('General'),
  linkedFindingId: z.string().optional(),
  page: z.number().int().positive().optional(),
  section: z.string().optional(),
  completed: z.boolean().default(false),
  actionType: z
    .enum(['clarify_hr', 'request_doc', 'review_lawyer', 'personal_check'])
    .optional(),
  evidenceSnippet: z.string().optional(),
  actionDraftType: z.string().optional(),
});

export const UserProfileSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  email: z.string().email(),
  avatarUrl: z.string().optional(),
  accountType: z.enum(['personal', 'demo']),
  provider: z.enum(['google', 'password', 'demo']),
});

export const LegalDocumentSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  documentType: z.string().default('Contract'),
  parties: z.array(z.string()).default([]),
  effectiveDate: z.string().optional(),
  jurisdiction: z.string().optional(),
  pageCount: z.number().int().positive().default(1),
  uploadedAt: z.string(),
  fileSize: z.string().optional(),
  keyTerms: KeyTermsSchema,
  findings: z.array(FindingSchema).default([]),
  crossClauseRelationships: z.array(CrossClauseRelationshipSchema).default([]),
  missingOrAmbiguous: z.array(MissingOrAmbiguousItemSchema).default([]),
  checklist: z.array(ChecklistItemSchema).default([]),
  pages: z.array(DocumentPageSchema).default([]),
  source: z.enum(['demo', 'user']).default('user'),
  isDemo: z.boolean().optional(),
  isFallbackDemo: z.boolean().optional(),
  status: z.enum(['analyzing', 'ready', 'error']).optional(),
  lastOpened: z.string().optional(),
});

export const QuestionAnswerSchema = z.object({
  id: z.string(),
  question: z.string().min(1),
  status: ResponseStatusSchema,
  shortAnswer: z.string(),
  explanation: z.string(),
  page: z.number().int().positive().optional(),
  section: z.string().optional(),
  evidence: z.string().optional(),
  nextAction: z.string().optional(),
  actionDraftType: z.enum(['email', 'checklist', 'professional_note']).optional(),
  confidenceNote: z.string().optional(),
  suggestedChecklistItem: z.string().optional(),
});

export const DocumentComparisonItemSchema = z.object({
  id: z.string(),
  topic: z.string(),
  category: z.string(),
  docAValue: z.string(),
  docAPage: z.number().int().positive().optional(),
  docASection: z.string().optional(),
  docBValue: z.string(),
  docBPage: z.number().int().positive().optional(),
  docBSection: z.string().optional(),
  status: z.enum(['ADDED', 'REMOVED', 'CHANGED', 'UNCHANGED', 'POSSIBLE_INCONSISTENCY']),
  factualDifference: z.string(),
  clarificationNote: z.string(),
});

export const DocumentComparisonSchema = z.object({
  id: z.string(),
  docAId: z.string(),
  docATitle: z.string(),
  docBId: z.string(),
  docBTitle: z.string(),
  comparisonDate: z.string(),
  summary: z.string(),
  items: z.array(DocumentComparisonItemSchema),
});

export const ClarificationEmailDraftSchema = z.object({
  id: z.string(),
  findingId: z.string().optional(),
  recipientRole: z.string(),
  subject: z.string().min(1),
  body: z.string().min(1),
  referencedClauses: z.array(
    z.object({
      section: z.string(),
      page: z.number().int().positive(),
      title: z.string(),
    })
  ),
  tone: z.enum(['professional_neutral', 'polite_inquiry', 'formal_clarification']),
});

export const ProfessionalBriefingSchema = z.object({
  id: z.string(),
  documentTitle: z.string(),
  datePrepared: z.string(),
  matterSummary: z.string(),
  documentsReviewed: z.array(
    z.object({
      title: z.string(),
      pages: z.number().int().positive(),
      effectiveDate: z.string().optional(),
    })
  ),
  timeline: z.array(
    z.object({
      event: z.string(),
      dateOrPeriod: z.string(),
      documentReference: z.string(),
    })
  ),
  criticalClauses: z.array(
    z.object({
      section: z.string(),
      page: z.number().int().positive(),
      title: z.string(),
      quote: z.string(),
      concern: z.string(),
    })
  ),
  unresolvedQuestions: z.array(z.string()),
  missingDocumentsOrClauses: z.array(z.string()),
  questionsForLegalProfessional: z.array(z.string()),
});

// Safe parse helpers
export function validateLegalDocument(data: unknown) {
  return LegalDocumentSchema.safeParse(data);
}

export function validateQuestionAnswer(data: unknown) {
  return QuestionAnswerSchema.safeParse(data);
}

export function validateUserProfile(data: unknown) {
  return UserProfileSchema.safeParse(data);
}
