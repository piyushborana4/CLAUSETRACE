import React, { useState, useEffect } from 'react';
import { 
  Printer, 
  Copy, 
  Check, 
  HelpCircle, 
  Download,
  Loader2,
  Clock,
  ShieldAlert,
  FileText,
  Upload,
  Sparkles
} from 'lucide-react';
import { LegalDocument, ProfessionalBriefing } from '../types';

interface ProfessionalPrepViewProps {
  document: LegalDocument | null;
  onOpenUpload?: () => void;
  onSwitchToDemo?: () => void;
}

export const ProfessionalPrepView: React.FC<ProfessionalPrepViewProps> = ({
  document,
  onOpenUpload,
  onSwitchToDemo,
}) => {
  const [briefing, setBriefing] = useState<ProfessionalBriefing | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    if (!document) return;
    const fetchBriefing = async () => {
      setIsLoading(true);
      try {
        const res = await fetch('/api/briefing', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ document }),
        });
        if (res.ok) {
          const data: ProfessionalBriefing = await res.json();
          setBriefing(data);
        }
      } catch (err) {
        console.error('Briefing error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBriefing();
  }, [document?.id]);

  if (!document) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-16 text-center space-y-6">
        <div className="w-16 h-16 rounded-3xl bg-[#E8F0FE] text-[#1A73E8] flex items-center justify-center mx-auto shadow-xs">
          <FileText className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h2 className="font-display font-bold text-2xl text-[#1F1F1F]">
            Prepare for legal consultation
          </h2>
          <p className="text-sm text-[#5F6368] leading-relaxed max-w-md mx-auto">
            Upload your document to generate a structured 1-page summary, critical clause quotes, and questions to ask your advisor.
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

  const handlePrint = () => {
    window.print();
  };

  const handleCopy = () => {
    if (!briefing) return;
    const critical = Array.isArray(briefing.criticalClauses) ? briefing.criticalClauses : [];
    const questions = Array.isArray(briefing.questionsForLegalProfessional) ? briefing.questionsForLegalProfessional : [];

    const text = `PREPARATION SUMMARY FOR LEGAL ADVISOR — ${briefing.documentTitle}\nDate Prepared: ${briefing.datePrepared}\n\n1. OVERVIEW:\n${briefing.matterSummary}\n\n2. UNUSUAL OR STRICT CLAUSES:\n${critical.map(c => `• ${c.section} (Page ${c.page}): ${c.title}\n  Text: "${c.quote}"\n  Why to check: ${c.concern}`).join('\n\n')}\n\n3. QUESTIONS TO ASK THE LAWYER:\n${questions.map(q => `• ${q}`).join('\n')}\n\nGenerated with CLAUSETRACE. For discussion and consultation preparation only. Not legal advice.`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 space-y-8">
      {/* Title & Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-2xl sm:text-3xl text-[#1F1F1F]">
            Prepare for a lawyer or advisor
          </h1>
          <p className="text-sm text-[#5F6368] mt-1.5">
            If you decide to consult a lawyer, this summary saves you time and money by organizing the key facts.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-[#DADCE0] hover:bg-[#F1F3F4] text-xs font-semibold text-[#1F1F1F] transition-colors cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-[#137333]" /> : <Copy className="w-3.5 h-3.5 text-[#5F6368]" />}
            <span>{copied ? 'Copied summary' : 'Copy summary'}</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#1A73E8] hover:bg-[#1557B0] text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print or save PDF</span>
          </button>
        </div>
      </div>

      {isLoading && (
        <div className="py-20 text-center space-y-3 bg-white rounded-2xl border border-[#E0E2E6]">
          <Loader2 className="w-8 h-8 text-[#1A73E8] animate-spin mx-auto" />
          <div className="font-display font-semibold text-sm text-[#1F1F1F]">
            Organizing your summary for a lawyer...
          </div>
          <p className="text-xs text-[#5F6368]">
            Gathering unusual clauses, exact page numbers, and strategic questions.
          </p>
        </div>
      )}

      {/* BRIEFING DOCUMENT LAYOUT */}
      {!isLoading && briefing && (
        <div 
          id="briefing-print-container"
          className="bg-white rounded-2xl border border-[#DADCE0] p-8 sm:p-10 shadow-xs space-y-8 print:p-0 print:border-none print:shadow-none"
        >
          {/* Header */}
          <div className="border-b-2 border-[#1F1F1F] pb-4 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <div className="text-[11px] font-mono uppercase tracking-widest text-[#5F6368]">
                CONSULTATION PREPARATION NOTE
              </div>
              <h2 className="font-display font-bold text-2xl text-[#1F1F1F] mt-1">
                {briefing.documentTitle}
              </h2>
            </div>
            <div className="text-right text-xs text-[#5F6368] font-mono shrink-0">
              <div>Date: {briefing.datePrepared}</div>
              <div>Source: {document.pageCount} Pages reviewed</div>
            </div>
          </div>

          {/* 1. One-Page Overview */}
          <div className="space-y-2">
            <h3 className="font-display font-bold text-sm uppercase tracking-wider text-[#1F1F1F] border-b border-[#F1F3F4] pb-1">
              1. Overview of the agreement
            </h3>
            <p className="text-xs text-[#3C4043] leading-relaxed">
              {briefing.matterSummary}
            </p>
          </div>

            {/* 2. Key Dates & Timelines */}
          <div className="space-y-2">
            <h3 className="font-display font-bold text-sm uppercase tracking-wider text-[#1F1F1F] border-b border-[#F1F3F4] pb-1">
              2. Important timelines & commitments
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {(briefing.timeline || []).map((t, idx) => (
                <div key={idx} className="p-3.5 rounded-xl bg-[#F8F9FA] border border-[#E8EAED] text-xs">
                  <div className="font-semibold text-[#1A73E8] mb-0.5">{t.event}</div>
                  <div className="font-bold text-[#1F1F1F]">{t.dateOrPeriod}</div>
                  <div className="text-[10px] text-[#70757A] mt-1">{t.documentReference}</div>
                </div>
              ))}
            </div>
          </div>

          {/* 3. Unusual or Strict Clauses */}
          <div className="space-y-3">
            <h3 className="font-display font-bold text-sm uppercase tracking-wider text-[#1F1F1F] border-b border-[#F1F3F4] pb-1">
              3. Unusual or strict clauses to discuss
            </h3>
            <div className="space-y-3">
              {(briefing.criticalClauses || []).map((c, idx) => (
                <div key={idx} className="p-4 rounded-xl border border-[#E8EAED] bg-[#FAFAFA] space-y-2 text-xs">
                  <div className="flex items-center justify-between font-semibold">
                    <span className="text-[#1F1F1F] font-bold text-sm">{c.title}</span>
                    <span className="text-[#1A73E8] text-xs font-bold">Page {c.page} · {c.section}</span>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-[#E0E2E6] font-mono text-[11px] text-[#202124] italic">
                    "{c.quote}"
                  </div>
                  <div className="text-[#7A4100] bg-[#FEFDF8] p-2.5 rounded-xl border border-[#FEEFC3]">
                    <strong>Why you should ask your lawyer:</strong> {c.concern}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 4. Suggested Questions to Ask the Lawyer */}
          <div className="p-6 rounded-2xl bg-[#E8F0FE] border border-[#CEE0FD] space-y-3">
            <div className="flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-[#1A73E8]" />
              <h3 className="font-display font-bold text-sm text-[#1A73E8]">
                4. Questions to ask the lawyer
              </h3>
            </div>
            <p className="text-xs text-[#444746]">
              Take these exact questions to your consultation to get direct, clear answers quickly:
            </p>
            <ol className="text-xs text-[#1F1F1F] space-y-2 list-decimal list-inside font-medium leading-relaxed">
              {(briefing.questionsForLegalProfessional || []).map((q, idx) => (
                <li key={idx} className="p-2.5 bg-white rounded-xl border border-[#D2E3FC]">
                  {q}
                </li>
              ))}
            </ol>
          </div>

          {/* Footer */}
          <div className="pt-6 border-t-2 border-[#1F1F1F] text-center text-xs text-[#70757A] space-y-1">
            <div className="font-bold text-[#1F1F1F]">
              Prepared with CLAUSETRACE. Not formal legal advice.
            </div>
            <div>
              Designed to help you have an informed, efficient consultation with a licensed legal practitioner.
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
