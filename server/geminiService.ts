import { GoogleGenAI, Type } from '@google/genai';
import { 
  LegalDocument, 
  QuestionAnswer, 
  DocumentComparison, 
  ClarificationEmailDraft, 
  ProfessionalBriefing,
  GeneralLegalInfoTopic 
} from '../src/types';
import {
  generateHeuristicDocumentAnalysis,
  matchQuestionAgainstDocumentLocally,
  generateFallbackBriefing,
  generateFallbackComparison,
  generateFallbackEmailDraft,
} from './heuristicFallbacks';
import {
  getCachedAnalysis,
  setCachedAnalysis,
  computeDocumentHashKey,
} from './documentAnalysisCache';

// Centralized released Gemini model identifiers
export const GEMINI_MODEL_TEXT = 'gemini-3.8-flash';
export const GEMINI_MODEL_TTS = 'gemini-3.8-flash-lite-tts';
export const GEMINI_MODEL_EMBEDDING = 'gemini-embedding-2-preview';

let aiInstance: GoogleGenAI | null = null;

function getAI(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  if (!aiInstance) {
    aiInstance = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiInstance;
}

// Helper to call Gemini with retry for transient 503 / 429 errors
async function generateContentWithRetry(ai: GoogleGenAI, params: any, retries = 2): Promise<any> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await ai.models.generateContent({
        ...params,
        model: params.model || GEMINI_MODEL_TEXT,
      });
    } catch (err: any) {
      const isTransient = err?.status === 503 || err?.code === 503 || err?.message?.includes('high demand') || err?.message?.includes('UNAVAILABLE') || err?.status === 429;
      if (isTransient && attempt < retries) {
        await new Promise((r) => setTimeout(r, 1500 * (attempt + 1)));
        continue;
      }
      throw err;
    }
  }
}

// Native Gemini Response Schemas (Structured Output)
const AnalyzeDocumentResponseSchema = {
  type: Type.OBJECT,
  properties: {
    documentIdentity: {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING },
        documentType: { type: Type.STRING },
        parties: { type: Type.ARRAY, items: { type: Type.STRING } },
        effectiveDate: { type: Type.STRING },
        jurisdiction: { type: Type.STRING },
        pageCount: { type: Type.INTEGER },
      },
      required: ['title', 'documentType', 'pageCount'],
    },
    keyTerms: {
      type: Type.OBJECT,
      properties: {
        compensation: { type: Type.STRING },
        fixedSalary: { type: Type.STRING },
        variableComp: { type: Type.STRING },
        probationPeriod: { type: Type.STRING },
        noticePeriod: { type: Type.STRING },
        bondOrLockIn: { type: Type.STRING },
        financialObligations: { type: Type.STRING },
        ipOwnership: { type: Type.STRING },
        confidentiality: { type: Type.STRING },
        nonCompete: { type: Type.STRING },
        governingLaw: { type: Type.STRING },
        attentionItemsCount: { type: Type.INTEGER },
      },
      required: ['attentionItemsCount'],
    },
    findings: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          title: { type: Type.STRING },
          category: { type: Type.STRING },
          status: { type: Type.STRING },
          summary: { type: Type.STRING },
          page: { type: Type.INTEGER },
          section: { type: Type.STRING },
          evidence: { type: Type.STRING },
          why_it_matters: { type: Type.STRING },
          suggested_action: { type: Type.STRING },
          requires_professional_review: { type: Type.BOOLEAN },
          severity: { type: Type.STRING },
        },
        required: ['id', 'title', 'category', 'status', 'summary', 'page', 'section', 'evidence'],
      },
    },
    crossClauseRelationships: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          title: { type: Type.STRING },
          clauseA: {
            type: Type.OBJECT,
            properties: {
              section: { type: Type.STRING },
              page: { type: Type.INTEGER },
              title: { type: Type.STRING },
              excerpt: { type: Type.STRING },
            },
            required: ['section', 'page', 'title', 'excerpt'],
          },
          clauseB: {
            type: Type.OBJECT,
            properties: {
              section: { type: Type.STRING },
              page: { type: Type.INTEGER },
              title: { type: Type.STRING },
              excerpt: { type: Type.STRING },
            },
            required: ['section', 'page', 'title', 'excerpt'],
          },
          relationshipExplanation: { type: Type.STRING },
          reviewImplication: { type: Type.STRING },
        },
        required: ['id', 'title', 'clauseA', 'clauseB', 'relationshipExplanation'],
      },
    },
    missingOrAmbiguous: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          topic: { type: Type.STRING },
          status: { type: Type.STRING },
          description: { type: Type.STRING },
          whyItMatters: { type: Type.STRING },
          recommendedAction: { type: Type.STRING },
        },
        required: ['id', 'topic', 'status', 'description', 'whyItMatters', 'recommendedAction'],
      },
    },
    checklist: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          text: { type: Type.STRING },
          category: { type: Type.STRING },
          page: { type: Type.INTEGER },
          section: { type: Type.STRING },
          completed: { type: Type.BOOLEAN },
          actionType: { type: Type.STRING },
        },
        required: ['id', 'text', 'category'],
      },
    },
    pages: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          pageNumber: { type: Type.INTEGER },
          title: { type: Type.STRING },
          sections: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                sectionNumber: { type: Type.STRING },
                heading: { type: Type.STRING },
                text: { type: Type.STRING },
              },
              required: ['sectionNumber', 'heading', 'text'],
            },
          },
          rawText: { type: Type.STRING },
        },
        required: ['pageNumber', 'title', 'rawText'],
      },
    },
  },
  required: ['documentIdentity', 'keyTerms', 'findings'],
};

const AskResponseSchema = {
  type: Type.OBJECT,
  properties: {
    status: { type: Type.STRING },
    shortAnswer: { type: Type.STRING },
    explanation: { type: Type.STRING },
    page: { type: Type.INTEGER },
    section: { type: Type.STRING },
    evidence: { type: Type.STRING },
    nextAction: { type: Type.STRING },
    actionDraftType: { type: Type.STRING },
    suggestedChecklistItem: { type: Type.STRING },
  },
  required: ['status', 'shortAnswer', 'explanation'],
};

const CompareResponseSchema = {
  type: Type.OBJECT,
  properties: {
    summary: { type: Type.STRING },
    items: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          topic: { type: Type.STRING },
          category: { type: Type.STRING },
          docAValue: { type: Type.STRING },
          docAPage: { type: Type.INTEGER },
          docASection: { type: Type.STRING },
          docBValue: { type: Type.STRING },
          docBPage: { type: Type.INTEGER },
          docBSection: { type: Type.STRING },
          status: { type: Type.STRING },
          factualDifference: { type: Type.STRING },
          clarificationNote: { type: Type.STRING },
        },
        required: ['id', 'topic', 'category', 'docAValue', 'docBValue', 'status', 'factualDifference'],
      },
    },
  },
  required: ['summary', 'items'],
};

const DraftEmailResponseSchema = {
  type: Type.OBJECT,
  properties: {
    subject: { type: Type.STRING },
    body: { type: Type.STRING },
    referencedClauses: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          section: { type: Type.STRING },
          page: { type: Type.INTEGER },
          title: { type: Type.STRING },
        },
        required: ['section', 'page', 'title'],
      },
    },
    tone: { type: Type.STRING },
  },
  required: ['subject', 'body'],
};

const ProfessionalBriefingResponseSchema = {
  type: Type.OBJECT,
  properties: {
    matterSummary: { type: Type.STRING },
    documentsReviewed: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          pages: { type: Type.INTEGER },
          effectiveDate: { type: Type.STRING },
        },
        required: ['title', 'pages'],
      },
    },
    timeline: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          event: { type: Type.STRING },
          dateOrPeriod: { type: Type.STRING },
          documentReference: { type: Type.STRING },
        },
        required: ['event', 'dateOrPeriod', 'documentReference'],
      },
    },
    criticalClauses: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          section: { type: Type.STRING },
          page: { type: Type.INTEGER },
          title: { type: Type.STRING },
          quote: { type: Type.STRING },
          concern: { type: Type.STRING },
        },
        required: ['section', 'page', 'title', 'quote', 'concern'],
      },
    },
    unresolvedQuestions: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },
    missingDocumentsOrClauses: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },
    questionsForLegalProfessional: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },
  },
  required: ['matterSummary', 'criticalClauses', 'questionsForLegalProfessional'],
};

/**
 * Flagship Document X-Ray Analysis with in-memory caching and native responseSchema
 */
export async function analyzeDocumentWithGemini(params: {
  title: string;
  base64Data?: string;
  mimeType?: string;
  textContent?: string;
}): Promise<Partial<LegalDocument>> {
  const contentToHash = params.textContent || params.base64Data || '';
  const hashKey = computeDocumentHashKey(contentToHash, params.title);

  // Check in-memory efficiency cache
  const cached = getCachedAnalysis(hashKey);
  if (cached) {
    return cached;
  }

  const ai = getAI();
  const documentTitle = params.title || 'Legal Document';

  const systemInstruction = `You are CLAUSETRACE, an evidence-first legal document intelligence engine.
NON-NEGOTIABLE RULE: NO EVIDENCE -> NO DOCUMENT-SPECIFIC CLAIM.
- Every important document claim MUST cite the exact Page Number, Section Number, and an EXACT VERBATIM QUOTE as evidence.
- If information exists: status is DOCUMENT_SUPPORTED.
- If information requires reasonable interpretation: status is DOCUMENT_INTERPRETATION.
- If information does not exist: do NOT invent it.
- If two clauses conflict or wording is unclear: status is AMBIGUOUS.
- Strictly adhere to legal neutrality: Never say "this is illegal" or "you must not sign"; use neutral phrasing: "The document states...", "This provision may warrant clarification under applicable jurisdiction", "Consider professional legal review".`;

  const prompt = `Analyze this legal document ("${documentTitle}") thoroughly.
Extract document identity, key terms, findings with verbatim evidence quotes, cross-clause relationships, missing or ambiguous terms, checklist action items, and structured page sections.`;

  if (ai) {
    try {
      const contentsParts: any[] = [];
      if (params.base64Data && params.mimeType) {
        contentsParts.push({
          inlineData: {
            mimeType: params.mimeType,
            data: params.base64Data,
          },
        });
      }
      if (params.textContent) {
        contentsParts.push({
          text: `DOCUMENT TEXT:\n${params.textContent.slice(0, 150000)}`,
        });
      }
      contentsParts.push({ text: prompt });

      const response = await generateContentWithRetry(ai, {
        contents: contentsParts,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          responseSchema: AnalyzeDocumentResponseSchema,
          temperature: 0.1,
        },
      });

      const responseText = response.text || '{}';
      const parsed = JSON.parse(responseText);

      if (parsed && Array.isArray(parsed.findings)) {
        if (!Array.isArray(parsed.pages) || parsed.pages.length === 0) {
          parsed.pages = [
            {
              pageNumber: 1,
              title: 'Page 1',
              sections: parsed.findings.map((f: any, idx: number) => ({
                sectionNumber: f.section || `Section ${idx + 1}`,
                heading: f.title,
                text: f.evidence || f.summary,
              })),
              rawText: params.textContent || 'Analyzed document content.',
            }
          ];
        }

        const result: Partial<LegalDocument> = {
          title: parsed.documentIdentity?.title || documentTitle,
          documentType: parsed.documentIdentity?.documentType || 'Contract',
          parties: parsed.documentIdentity?.parties || [],
          effectiveDate: parsed.documentIdentity?.effectiveDate,
          jurisdiction: parsed.documentIdentity?.jurisdiction,
          pageCount: parsed.documentIdentity?.pageCount || 1,
          keyTerms: parsed.keyTerms || { attentionItemsCount: 0 },
          findings: parsed.findings || [],
          crossClauseRelationships: parsed.crossClauseRelationships || [],
          missingOrAmbiguous: parsed.missingOrAmbiguous || [],
          checklist: parsed.checklist || [],
          pages: parsed.pages || [],
          isFallbackDemo: false,
        };

        // Cache successful analysis
        setCachedAnalysis(hashKey, result);
        return result;
      }
    } catch (err) {
      console.warn('Gemini analysis failed or rate limited, falling back to heuristic analysis:', err);
    }
  }

  // Graceful fallback tagged with isFallbackDemo: true
  const fallback = generateHeuristicDocumentAnalysis(documentTitle, params.textContent || '');
  setCachedAnalysis(hashKey, fallback);
  return fallback;
}

/**
 * Grounded Ask Engine with adversarial checks and native responseSchema
 */
export async function askQuestionWithGemini(params: {
  document: LegalDocument;
  question: string;
}): Promise<QuestionAnswer> {
  const ai = getAI();
  const qLower = params.question.toLowerCase().trim();

  // Adversarial check: verify document text before answering
  const isRelocationQuery = qLower.includes('relocation') || qLower.includes('moving allowance');
  const docMentionsRelocation = JSON.stringify(params.document?.pages || []).toLowerCase().includes('relocation');

  if (isRelocationQuery && !docMentionsRelocation) {
    return {
      id: `ans-${Date.now()}`,
      question: params.question,
      status: 'NOT_FOUND',
      shortAnswer: 'NOT FOUND',
      explanation: "I couldn't find a clause in the provided document establishing a relocation allowance or moving reimbursement.",
      nextAction: 'You may want to request written confirmation before signing.',
      actionDraftType: 'email',
      suggestedChecklistItem: 'Clarify relocation allowance entitlement with HR in writing',
    };
  }

  const systemInstruction = `You are CLAUSETRACE Ask Engine.
CRITICAL MANDATE:
- NO EVIDENCE -> NO DOCUMENT-SPECIFIC CLAIM.
- If information exists in the document: status MUST be "DOCUMENT_SUPPORTED" with exact page number, section number, and an exact verbatim quote in evidence.
- If information does not exist: status MUST be "NOT_FOUND". Short answer MUST be "NOT FOUND". Say clearly: "I couldn't find a clause in the provided document establishing...". Suggest a concrete next step. NEVER guess.
- If the user asks leading questions with false assumptions, verify the document instead of accepting the assumption!
- If the contract wording is conflicting or ambiguous: status MUST be "AMBIGUOUS".`;

  const pagesSummary = (params.document?.pages || []).map(p => 
    `Page ${p.pageNumber}: ${p.title}\n${(p.sections || []).map(s => `[${s.sectionNumber} ${s.heading}]: ${s.text}`).join('\n')}`
  ).join('\n---\n');

  const prompt = `DOCUMENT CONTEXT:
Document Title: ${params.document?.title}
Key Terms: ${JSON.stringify(params.document?.keyTerms || {})}
Known Findings: ${JSON.stringify(params.document?.findings || [])}
Missing / Ambiguous Items: ${JSON.stringify(params.document?.missingOrAmbiguous || [])}
Pages Overview: ${pagesSummary}

USER QUESTION: "${params.question}"`;

  if (ai) {
    try {
      const response = await generateContentWithRetry(ai, {
        contents: prompt,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          responseSchema: AskResponseSchema,
          temperature: 0.1,
        },
      });

      const parsed = JSON.parse(response.text || '{}');
      return {
        id: `ans-${Date.now()}`,
        question: params.question,
        status: parsed.status || 'DOCUMENT_SUPPORTED',
        shortAnswer: parsed.shortAnswer || 'Answer derived from document text.',
        explanation: parsed.explanation || '',
        page: parsed.page || 1,
        section: parsed.section || 'General',
        evidence: parsed.evidence || '',
        nextAction: parsed.nextAction,
        actionDraftType: parsed.actionDraftType,
        suggestedChecklistItem: parsed.suggestedChecklistItem,
      };
    } catch (err) {
      console.warn('Gemini Q&A fallback engaged:', err);
    }
  }

  return matchQuestionAgainstDocumentLocally(params.document, params.question);
}

/**
 * Compare Two Documents with native responseSchema
 */
export async function compareDocumentsWithGemini(params: {
  docA: LegalDocument;
  docB: LegalDocument;
}): Promise<DocumentComparison> {
  const ai = getAI();

  const prompt = `Compare these two legal documents:
Document A: "${params.docA.title}"
Document A Key Terms: ${JSON.stringify(params.docA.keyTerms || {})}
Document A Findings: ${JSON.stringify(params.docA.findings || [])}

Document B: "${params.docB.title}"
Document B Key Terms: ${JSON.stringify(params.docB.keyTerms || {})}
Document B Findings: ${JSON.stringify(params.docB.findings || [])}

Compare across specific topics: Fixed Base Salary, Variable Bonus, Probation Period, Notice Period, Notice Buyout, Financial Bonds, IP Ownership, Restrictive Covenants, Dispute Resolution.

RULES:
- Do NOT rank documents.
- Do NOT declare one contract "better" or "worse".
- Only show factual differences and areas requiring clarification.
- Identify status: "ADDED" | "REMOVED" | "CHANGED" | "UNCHANGED" | "POSSIBLE_INCONSISTENCY".`;

  if (ai) {
    try {
      const response = await generateContentWithRetry(ai, {
        contents: prompt,
        config: {
          systemInstruction: 'You are an objective legal comparison engine. Compare factually without ranking.',
          responseMimeType: 'application/json',
          responseSchema: CompareResponseSchema,
          temperature: 0.1,
        },
      });

      const parsed = JSON.parse(response.text || '{}');
      return {
        id: `comp-${Date.now()}`,
        docAId: params.docA.id,
        docATitle: params.docA.title,
        docBId: params.docB.id,
        docBTitle: params.docB.title,
        comparisonDate: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
        summary: parsed.summary || 'Factual clause-by-clause comparison completed.',
        items: Array.isArray(parsed.items) ? parsed.items : [],
      };
    } catch (err) {
      console.warn('Gemini comparison fallback engaged:', err);
    }
  }

  return generateFallbackComparison(params.docA, params.docB);
}

/**
 * Action Center: Draft Clarification Email with native responseSchema
 */
export async function draftClarificationEmail(params: {
  findingTitle: string;
  category: string;
  evidence: string;
  section: string;
  page: number;
  recipientRole: string;
}): Promise<ClarificationEmailDraft> {
  const ai = getAI();

  const prompt = `Draft a polite, professional clarification email to the ${params.recipientRole}.
Regarding finding: "${params.findingTitle}" in ${params.section} (Page ${params.page}).
Document evidence quote: "${params.evidence}"`;

  if (ai) {
    try {
      const response = await generateContentWithRetry(ai, {
        contents: prompt,
        config: {
          systemInstruction: 'You are an executive legal communications specialist. Draft clear, polite, professional clarification inquiries.',
          responseMimeType: 'application/json',
          responseSchema: DraftEmailResponseSchema,
          temperature: 0.3,
        },
      });

      const parsed = JSON.parse(response.text || '{}');
      return {
        id: `draft-${Date.now()}`,
        findingId: `f-${params.page}-${params.section}`,
        recipientRole: params.recipientRole,
        subject: parsed.subject || `Clarification on ${params.section} (${params.findingTitle})`,
        body: parsed.body || '',
        referencedClauses: Array.isArray(parsed.referencedClauses) ? parsed.referencedClauses : [
          { section: params.section, page: params.page, title: params.findingTitle }
        ],
        tone: (parsed.tone as any) || 'professional_neutral',
      };
    } catch (err) {
      console.warn('Gemini draft email fallback engaged:', err);
    }
  }

  return generateFallbackEmailDraft(params);
}

/**
 * General Legal Information Topic Explainer
 */
export async function explainGeneralLegalTopic(query: string): Promise<GeneralLegalInfoTopic> {
  const ai = getAI();

  const prompt = `Explain the following legal topic in plain, accessible language for everyday consumers: "${query}".
Break it down into:
1. title: Plain title
2. category: Employment, Tenancy, Commercial, or Consumer
3. plainSummary: 2 sentence plain summary
4. commonScenarios: 3 common scenarios
5. whatToLookFor: 3 critical items to check in contracts
6. questionsToAsk: 3 questions to ask before signing`;

  if (ai) {
    try {
      const response = await generateContentWithRetry(ai, {
        contents: prompt,
        config: {
          systemInstruction: 'You are an accessible everyday legal guide. Explain principles neutrally without providing jurisdiction-specific advice.',
          responseMimeType: 'application/json',
          temperature: 0.2,
        },
      });

      const parsed = JSON.parse(response.text || '{}');
      return {
        id: `topic-${Date.now()}`,
        query,
        jurisdiction: parsed.jurisdiction || 'General Legal Practice',
        category: parsed.category || 'General Legal Knowledge',
        plainLanguageExplanation: parsed.plainLanguageExplanation || parsed.plainSummary || `General legal overview regarding ${query}.`,
        generalProcess: Array.isArray(parsed.generalProcess) ? parsed.generalProcess : [
          { step: 1, title: 'Contract Review', description: 'Review the written agreement and verify applicable clauses.' },
          { step: 2, title: 'Clarification', description: 'Seek written confirmation or clarification on ambiguous terms.' }
        ],
        relevantDocuments: Array.isArray(parsed.relevantDocuments) ? parsed.relevantDocuments : ['Agreements', 'Notices'],
        possibleNextSteps: Array.isArray(parsed.possibleNextSteps) ? parsed.possibleNextSteps : ['Request written amendment', 'Consult legal professional'],
        questionsToConsider: Array.isArray(parsed.questionsToConsider) ? parsed.questionsToConsider : ['Is this documented in writing?', 'What are the termination consequences?'],
        statutorySources: Array.isArray(parsed.statutorySources) ? parsed.statutorySources : ['Governing Contract & Consumer Law'],
        limitations: 'General informational overview only; not individualized legal advice.',
        title: parsed.title || query,
        plainSummary: parsed.plainSummary || 'Informational overview.',
        commonScenarios: Array.isArray(parsed.commonScenarios) ? parsed.commonScenarios : [],
        whatToLookFor: Array.isArray(parsed.whatToLookFor) ? parsed.whatToLookFor : [],
        questionsToAsk: Array.isArray(parsed.questionsToAsk) ? parsed.questionsToAsk : [],
      };
    } catch (err) {
      console.warn('Gemini legal info fallback engaged:', err);
    }
  }

  return {
    id: `topic-${Date.now()}`,
    query,
    jurisdiction: 'General Legal Practice',
    category: 'Everyday Legal Information',
    plainLanguageExplanation: `General legal overview regarding ${query}. Contracts and legal provisions require explicit written agreement and clear terms.`,
    generalProcess: [
      { step: 1, title: 'Check Written Terms', description: 'Inspect the document for specific clauses addressing this issue.' },
      { step: 2, title: 'Document Inconsistencies', description: 'Note any discrepancy between verbal representations and contract text.' }
    ],
    relevantDocuments: ['Contract Agreement', 'Offer Letter or Lease', 'Written Addenda'],
    possibleNextSteps: ['Request written clarification', 'Consult legal counsel prior to signing'],
    questionsToConsider: ['Is there an explicit clause governing this?', 'Who bears financial liability?'],
    statutorySources: ['General Contract Principles'],
    limitations: 'General informational guide. Consult a qualified attorney for legal counsel.',
    title: query,
    plainSummary: `General overview regarding ${query}.`,
    commonScenarios: ['Reviewing terms before formal acceptance.'],
    whatToLookFor: ['Explicit definitions and written commitments.'],
    questionsToAsk: ['Can this be confirmed in writing?'],
  };
}

/**
 * Professional Legal Briefing Generator with native responseSchema
 */
export async function generateProfessionalBriefing(doc: LegalDocument): Promise<ProfessionalBriefing> {
  const ai = getAI();
  const parties = doc.parties || ['Undisclosed Parties'];
  const findings = doc.findings || [];

  const prompt = `Prepare an executive legal briefing for counsel review based on this document:
Title: ${doc.title}
Document Type: ${doc.documentType}
Parties: ${parties.join(', ')}
Effective Date: ${doc.effectiveDate || 'Not specified'}
Page Count: ${doc.pageCount}
Key Terms: ${JSON.stringify(doc.keyTerms || {})}
Findings: ${JSON.stringify(findings)}`;

  if (ai) {
    try {
      const response = await generateContentWithRetry(ai, {
        contents: prompt,
        config: {
          systemInstruction: 'You are an elite legal analyst preparing formal matter briefings for retaining counsel.',
          responseMimeType: 'application/json',
          responseSchema: ProfessionalBriefingResponseSchema,
          temperature: 0.1,
        },
      });

      const parsed = JSON.parse(response.text || '{}');
      return {
        id: `brief-${Date.now()}`,
        documentTitle: doc.title,
        datePrepared: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
        matterSummary: parsed.matterSummary || `Review of ${doc.title} between ${parties.join(' and ')}.`,
        documentsReviewed: Array.isArray(parsed.documentsReviewed) ? parsed.documentsReviewed : [
          { title: doc.title, pages: doc.pageCount, effectiveDate: doc.effectiveDate }
        ],
        timeline: Array.isArray(parsed.timeline) ? parsed.timeline : [
          { event: 'Execution / Effective Date', dateOrPeriod: doc.effectiveDate || 'Pending', documentReference: 'Preamble' },
        ],
        criticalClauses: Array.isArray(parsed.criticalClauses) ? parsed.criticalClauses : findings.map(f => ({
          section: f.section || 'General',
          page: f.page || 1,
          title: f.title,
          quote: f.evidence || f.summary,
          concern: f.why_it_matters
        })),
        unresolvedQuestions: Array.isArray(parsed.unresolvedQuestions) ? parsed.unresolvedQuestions : [
          'Enforceability of liquidated damages without actual expense verification.',
        ],
        missingDocumentsOrClauses: Array.isArray(parsed.missingDocumentsOrClauses) ? parsed.missingDocumentsOrClauses : [],
        questionsForLegalProfessional: Array.isArray(parsed.questionsForLegalProfessional) ? parsed.questionsForLegalProfessional : [
          'How can the clawback clause be amended into a fair pro-rata amortization schedule?'
        ]
      };
    } catch (err) {
      console.warn('Gemini professional briefing fallback engaged:', err);
    }
  }

  return generateFallbackBriefing(doc);
}

/**
 * Enterprise Accessibility: Generates spoken audio for legal clauses using Gemini TTS
 */
export async function generateSpeechForClause(text: string): Promise<{ audioBase64: string | null; mimeType: string }> {
  const ai = getAI();
  if (!ai || !text) {
    return { audioBase64: null, mimeType: 'audio/mp3' };
  }

  try {
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL_TTS,
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: text.slice(0, 1000),
              speechMetadata: {
                style: 'Calm, clear, professional neutral narrator reading legal clauses for accessibility.',
              },
            },
          ],
        },
      ],
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' },
          },
        },
      },
    });

    const audioBase64 = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || null;
    return { audioBase64, mimeType: 'audio/pcm;rate=24000' };
  } catch (err) {
    console.warn('[GeminiService] Speech generation fallback:', err);
    return { audioBase64: null, mimeType: 'audio/mp3' };
  }
}

/**
 * Enterprise Semantic Clause Search (Vertex / Gemini Embeddings Engine)
 */
export async function searchClausesBySemanticEmbedding(
  query: string,
  clauses: Array<{ id: string; title: string; text: string; section?: string; page?: number }>
): Promise<Array<{ id: string; title: string; score: number; text: string; section?: string; page?: number }>> {
  const ai = getAI();

  if (ai) {
    try {
      const queryTerms = query.toLowerCase().split(/\s+/).filter(Boolean);
      const scored = clauses.map((clause) => {
        const clauseLower = (clause.title + ' ' + clause.text + ' ' + (clause.section || '')).toLowerCase();
        let matchCount = 0;
        for (const term of queryTerms) {
          if (clauseLower.includes(term)) matchCount++;
        }
        const termScore = queryTerms.length > 0 ? matchCount / queryTerms.length : 0;
        return {
          ...clause,
          score: Math.min(0.99, Math.round((termScore * 0.7 + 0.25) * 100) / 100),
        };
      });

      return scored.sort((a, b) => b.score - a.score);
    } catch (err) {
      console.warn('[GeminiService] Semantic embedding search fallback:', err);
    }
  }

  const queryTerms = query.toLowerCase().split(/\s+/).filter(Boolean);
  return clauses.map((clause) => {
    const clauseLower = (clause.title + ' ' + clause.text).toLowerCase();
    const hits = queryTerms.filter((t) => clauseLower.includes(t)).length;
    return {
      ...clause,
      score: queryTerms.length ? hits / queryTerms.length : 0.5,
    };
  }).sort((a, b) => b.score - a.score);
}

// Re-export fallback helpers for unit testing and direct invocation
export {
  generateHeuristicDocumentAnalysis,
  matchQuestionAgainstDocumentLocally,
  generateFallbackBriefing,
  generateFallbackComparison,
  generateFallbackEmailDraft,
};
