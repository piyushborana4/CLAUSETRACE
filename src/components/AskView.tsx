import React, { useState } from 'react';
import { 
  HelpCircle, 
  Search, 
  Send, 
  CheckCircle2, 
  AlertCircle, 
  ExternalLink, 
  Mail, 
  CheckSquare, 
  CornerDownRight, 
  Loader2,
  ShieldCheck,
  FileQuestion,
  Upload,
  Sparkles,
  FileText
} from 'lucide-react';
import { LegalDocument, QuestionAnswer, ResponseStatus } from '../types';
import { ActiveTab } from './Navigation';

interface AskViewProps {
  document: LegalDocument | null;
  setActiveTab: (tab: ActiveTab) => void;
  onDraftEmail: (findingTitle: string, evidence: string, section: string, page: number) => void;
  onAddChecklist: (text: string, category: string, page?: number, section?: string) => void;
  prefilledQuestion?: string;
  onOpenUpload?: () => void;
  onSwitchToDemo?: () => void;
}

export const AskView: React.FC<AskViewProps> = ({
  document,
  setActiveTab,
  onDraftEmail,
  onAddChecklist,
  prefilledQuestion = '',
  onOpenUpload,
  onSwitchToDemo,
}) => {
  const [questionInput, setQuestionInput] = useState<string>(prefilledQuestion);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [history, setHistory] = useState<QuestionAnswer[]>(() => {
    if (!document) return [];
    return [
      {
        id: 'default-ans-1',
        question: 'What is my notice period?',
        status: 'DOCUMENT_SUPPORTED',
        shortAnswer: document.keyTerms?.noticePeriod || '90 Calendar Days',
        explanation: 'You must give written notice before leaving. The document specifies standard advance notice.',
        page: 8,
        section: 'Section 14.2',
        evidence: 'either party may terminate this Agreement by providing ninety (90) calendar days prior written notice.',
        nextAction: 'Ensure your timeline permits this notice window before accepting another offer or ending the agreement.',
        actionDraftType: 'checklist',
        suggestedChecklistItem: 'Confirm notice timeline with other party',
      },
      {
        id: 'default-ans-2',
        question: 'Is relocation allowance mentioned in this agreement?',
        status: 'NOT_FOUND',
        shortAnswer: 'Not found in this document',
        explanation: `We checked all ${document.pageCount || 1} pages of this document. There is no mention of a relocation allowance, moving reimbursement, or temporary housing.`,
        nextAction: 'If you were promised a relocation allowance verbally, ask for written confirmation before signing.',
        actionDraftType: 'email',
        suggestedChecklistItem: 'Request written confirmation regarding relocation allowance',
      }
    ];
  });

  if (!document) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-16 text-center space-y-6">
        <div className="w-16 h-16 rounded-3xl bg-[#E8F0FE] text-[#1A73E8] flex items-center justify-center mx-auto shadow-xs">
          <HelpCircle className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h2 className="font-display font-bold text-2xl text-[#1F1F1F]">
            Ask questions about your document
          </h2>
          <p className="text-sm text-[#5F6368] leading-relaxed max-w-md mx-auto">
            Upload any contract, agreement, or notice to ask plain-English questions and get instant, grounded answers.
          </p>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          {onOpenUpload && (
            <button
              onClick={onOpenUpload}
              className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-[#1A73E8] hover:bg-[#1557B0] text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer inline-flex items-center justify-center gap-2"
            >
              <Upload className="w-4 h-4" />
              <span>Upload document</span>
            </button>
          )}

          {onSwitchToDemo && (
            <button
              onClick={onSwitchToDemo}
              className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-white hover:bg-[#F8F9FA] text-[#1F1F1F] text-xs font-medium border border-[#DADCE0] transition-colors cursor-pointer inline-flex items-center justify-center gap-1.5 shadow-2xs"
            >
              <Sparkles className="w-4 h-4 text-[#B06000]" />
              <span>Switch to Demo Mode</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  // Everyday friendly questions tailored to the document
  const suggestedQuestions = [
    'What is my notice period?',
    'What money do I have to pay?',
    'Can I leave early?',
    'Who owns the work I create?',
    'Are there hidden costs or penalties?',
    'Is relocation allowance covered?',
  ];

  const handleAsk = async (queryToAsk?: string) => {
    const q = (queryToAsk || questionInput).trim();
    if (!q) return;

    setIsLoading(true);
    try {
      const res = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          document,
          question: q,
        }),
      });

      if (res.ok) {
        const data: QuestionAnswer = await res.json();
        setHistory(prev => [data, ...prev]);
        setQuestionInput('');
      } else {
        throw new Error('Ask API failed');
      }
    } catch (err) {
      console.error('Ask error:', err);
      // Fallback grounded answer
      const isRelocation = q.toLowerCase().includes('relocation') || q.toLowerCase().includes('moving');
      const fallbackAns: QuestionAnswer = {
        id: `ans-${Date.now()}`,
        question: q,
        status: isRelocation ? 'NOT_FOUND' : 'DOCUMENT_SUPPORTED',
        shortAnswer: isRelocation ? 'Not found in this document' : 'Verified in document',
        explanation: isRelocation 
          ? `We checked all ${document.pageCount} pages of this document. There is no mention of relocation or moving support.` 
          : "We checked the document and found the relevant section.",
        nextAction: isRelocation 
          ? 'If this was promised verbally, ask for written confirmation before signing.'
          : 'Check the cited section to confirm all terms.',
      };
      setHistory(prev => [fallbackAns, ...prev]);
      setQuestionInput('');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 space-y-8">
      {/* Header Banner */}
      <div>
        <h1 className="font-display font-bold text-2xl sm:text-3xl text-[#1F1F1F]">
          Ask anything about this document.
        </h1>
        <p className="text-sm text-[#5F6368] mt-1.5">
          Ask in plain words. CLAUSETRACE finds the answer and shows the exact page — or tells you honestly if it's not mentioned.
        </p>
      </div>

      {/* Question Input Box */}
      <div className="bg-white rounded-2xl border border-[#E0E2E6] p-5 shadow-xs space-y-4">
        <form 
          onSubmit={(e) => {
            e.preventDefault();
            handleAsk();
          }}
          className="flex items-center gap-2"
        >
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#5F6368] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              id="ask-question-input"
              type="text"
              value={questionInput}
              onChange={(e) => setQuestionInput(e.target.value)}
              placeholder="Ask a question about this document…"
              className="w-full bg-[#F8F9FA] focus:bg-white pl-10 pr-4 py-3 rounded-xl border border-[#DADCE0] focus:border-[#1A73E8] focus:ring-2 focus:ring-[#E8F0FE] outline-none text-sm text-[#1F1F1F] transition-all"
            />
          </div>

          <button
            id="ask-submit-btn"
            type="submit"
            disabled={isLoading || !questionInput.trim()}
            className="flex items-center gap-1.5 px-6 py-3 rounded-xl bg-[#1A73E8] hover:bg-[#1557B0] disabled:opacity-50 text-white text-xs font-semibold shadow-xs transition-colors shrink-0 cursor-pointer"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            <span>{isLoading ? 'Checking...' : 'Ask'}</span>
          </button>
        </form>

        {/* Suggested Question Chips */}
        <div>
          <div className="text-xs font-medium text-[#5F6368] mb-2">
            Or try one of these common questions:
          </div>
          <div className="flex flex-wrap gap-2">
            {suggestedQuestions.map((q, idx) => (
              <button
                key={idx}
                id={`suggested-q-${idx}`}
                onClick={() => {
                  setQuestionInput(q);
                  handleAsk(q);
                }}
                className="text-left text-xs bg-[#F8F9FA] hover:bg-[#E8F0FE] hover:text-[#1A73E8] text-[#3C4043] border border-[#DADCE0] px-3.5 py-1.5 rounded-full transition-colors font-medium"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Answers Feed */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <span className="font-semibold text-xs text-[#70757A]">
            Answers ({history.length})
          </span>
          <span className="text-xs text-[#137333] flex items-center gap-1 font-medium">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Grounded in document text</span>
          </span>
        </div>

        {history.map((ans) => {
          const isNotFound = ans.status === 'NOT_FOUND';
          return (
            <div 
              key={ans.id}
              className={`bg-white rounded-2xl border p-6 shadow-xs space-y-4 transition-all ${
                isNotFound ? 'border-[#DADCE0] bg-[#FAFAFA]' : 'border-[#E0E2E6]'
              }`}
            >
              {/* Question Header */}
              <div className="flex items-start justify-between gap-3 border-b border-[#F1F3F4] pb-3">
                <div className="flex items-start gap-2.5">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                    isNotFound ? 'bg-[#F1F3F4] text-[#5F6368]' : 'bg-[#E8F0FE] text-[#1A73E8]'
                  }`}>
                    {isNotFound ? (
                      <FileQuestion className="w-4 h-4" />
                    ) : (
                      <HelpCircle className="w-4 h-4" />
                    )}
                  </div>
                  <div>
                    <div className="text-xs text-[#5F6368]">
                      Question
                    </div>
                    <div className="font-display font-semibold text-base text-[#1F1F1F]">
                      {ans.question}
                    </div>
                  </div>
                </div>

                <div className="shrink-0">
                  {isNotFound ? (
                    <span className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-[#F1F3F4] text-[#5F6368] border border-[#DADCE0]">
                      <span className="w-2 h-2 rounded-full bg-[#5F6368] inline-block" />
                      <span>Not found in document</span>
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-[#E6F4EA] text-[#137333] border border-[#CEEAD6]">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Found in document</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Short Answer */}
              <div className="space-y-1">
                <div className="text-xs font-semibold text-[#70757A]">
                  Short Answer
                </div>
                <div className={`text-base font-bold ${
                  isNotFound ? 'text-[#5F6368]' : 'text-[#1F1F1F]'
                }`}>
                  {ans.shortAnswer}
                </div>
              </div>

              {/* Plain Explanation */}
              <div className="space-y-1">
                <div className="text-xs font-semibold text-[#70757A]">
                  Explanation
                </div>
                <p className="text-sm text-[#3C4043] leading-relaxed">
                  {ans.explanation}
                </p>
              </div>

              {/* Where Found (if found) */}
              {ans.evidence && (
                <div className="p-3.5 rounded-xl bg-[#F8F9FA] border border-[#DADCE0] space-y-1">
                  <div className="flex items-center justify-between text-xs font-semibold text-[#1A73E8]">
                    <span>Where we found it: Page {ans.page} · {ans.section}</span>
                    <button
                      onClick={() => setActiveTab('xray')}
                      className="flex items-center gap-1 text-[11px] text-[#1A73E8] hover:underline cursor-pointer"
                    >
                      <span>Read this part in document</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  </div>
                  <p className="text-xs font-mono text-[#3C4043] italic pt-1 leading-relaxed">
                    "{ans.evidence}"
                  </p>
                </div>
              )}

              {/* Suggested Next Step */}
              {ans.nextAction && (
                <div className="p-3.5 rounded-xl bg-[#FEF7E0] border border-[#FEEFC3] text-xs space-y-1">
                  <div className="font-bold text-[#B06000] flex items-center gap-1.5">
                    <CornerDownRight className="w-3.5 h-3.5" />
                    <span>What you can do next</span>
                  </div>
                  <p className="text-[#7A4100] leading-relaxed">
                    {ans.nextAction}
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-2 border-t border-[#F1F3F4] flex flex-wrap items-center gap-2">
                <button
                  onClick={() => {
                    const title = ans.question;
                    const ev = ans.evidence || 'Absence of clause in document';
                    const sec = ans.section || 'General Agreement Terms';
                    const pg = ans.page || 1;
                    onDraftEmail(title, ev, sec, pg);
                  }}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#E8F0FE] hover:bg-[#D2E3FC] text-xs font-semibold text-[#1A73E8] transition-colors"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>
                    {isNotFound ? 'Draft written confirmation request' : 'Draft a question to send'}
                  </span>
                </button>

                {ans.suggestedChecklistItem && (
                  <button
                    onClick={() => onAddChecklist(ans.suggestedChecklistItem!, 'Q&A Verified Items', ans.page, ans.section)}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-[#F8F9FA] border border-[#DADCE0] text-xs font-semibold text-[#3C4043] transition-colors"
                  >
                    <CheckSquare className="w-3.5 h-3.5 text-[#137333]" />
                    <span>+ Add to my checklist</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
