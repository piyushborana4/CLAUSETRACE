import React, { useState } from 'react';
import { 
  AlertCircle, 
  HelpCircle, 
  Mail, 
  CheckSquare, 
  ChevronLeft, 
  ChevronRight, 
  ExternalLink, 
  BookOpen, 
  Info, 
  ChevronDown, 
  ChevronUp, 
  ShieldCheck, 
  FileQuestion, 
  Layers, 
  ArrowRight, 
  Upload, 
  Sparkles, 
  FileText,
  Scale,
  Award,
  Volume2,
  VolumeX,
  Search,
  Compass
} from 'lucide-react';
import { LegalDocument, Finding, FindingCategory, ResponseStatus } from '../types';
import { ActiveTab } from './Navigation';
import { LEGAL_DOMAIN_BENCHMARKS, ContractDomainBenchmark, ClauseBenchmark } from '../data/legalBenchmarks';
import { playBase64Pcm, stopCurrentAudio } from '../lib/audioPlayer';

interface DocumentXRayViewProps {
  document: LegalDocument | null;
  setActiveTab: (tab: ActiveTab) => void;
  onDraftEmailForFinding: (finding: Finding) => void;
  onAddFindingToChecklist: (finding: Finding) => void;
  onAskAboutFinding: (question: string) => void;
  onOpenUpload?: () => void;
  onSwitchToDemo?: () => void;
}

type HumanCategoryFilter = 'ALL' | 'IMPORTANT' | 'PAY_ATTENTION' | 'GOOD_TO_KNOW' | 'BENCHMARKS' | 'NOT_FOUND';

export const DocumentXRayView: React.FC<DocumentXRayViewProps> = ({
  document,
  setActiveTab,
  onDraftEmailForFinding,
  onAddFindingToChecklist,
  onAskAboutFinding,
  onOpenUpload,
  onSwitchToDemo,
}) => {
  const [selectedFindingId, setSelectedFindingId] = useState<string>(
    document?.findings?.[0]?.id || ''
  );
  const [currentPage, setCurrentPage] = useState<number>(
    document?.findings?.[0]?.page || 1
  );
  const [activeCategory, setActiveCategory] = useState<HumanCategoryFilter>('ALL');
  const [showOriginalWording, setShowOriginalWording] = useState<boolean>(false);
  const [addedChecklistIds, setAddedChecklistIds] = useState<Set<string>>(new Set());
  const [clauseSearchQuery, setClauseSearchQuery] = useState<string>('');
  const [isPlayingTTS, setIsPlayingTTS] = useState<boolean>(false);
  const [isAudioLoading, setIsAudioLoading] = useState<boolean>(false);

  const handlePlayTTS = async (text: string) => {
    if (isPlayingTTS) {
      stopCurrentAudio();
      setIsPlayingTTS(false);
      return;
    }
    setIsAudioLoading(true);
    try {
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.audioBase64) {
          setIsPlayingTTS(true);
          await playBase64Pcm(data.audioBase64, () => {
            setIsPlayingTTS(false);
          });
        }
      }
    } catch (err) {
      console.warn('TTS playback error:', err);
    } finally {
      setIsAudioLoading(false);
    }
  };

  if (!document) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-16 text-center space-y-6">
        <div className="w-16 h-16 rounded-3xl bg-[#E8F0FE] text-[#1A73E8] flex items-center justify-center mx-auto shadow-xs">
          <FileText className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h2 className="font-display font-bold text-2xl text-[#1F1F1F]">
            No document loaded
          </h2>
          <p className="text-sm text-[#5F6368] leading-relaxed max-w-md mx-auto">
            Upload your agreement, notice, employment offer, or contract to see plain-English explanations and critical clauses.
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

  const docFindings = Array.isArray(document.findings) ? document.findings : [];
  const docPages = Array.isArray(document.pages) ? document.pages : [];
  const notFoundItems = Array.isArray(document.missingOrAmbiguous) ? document.missingOrAmbiguous : [];

  const selectedFinding = docFindings.find((f) => f.id === selectedFindingId) || docFindings[0];

  const importantFindings = docFindings.filter((f) => f.severity === 'warning' || f.requires_professional_review);
  const payAttentionFindings = docFindings.filter((f) => f.severity === 'attention' && !f.requires_professional_review);
  const goodToKnowFindings = docFindings.filter((f) => (!f.severity || f.severity === 'normal') && !f.requires_professional_review);

  const getVisibleFindings = () => {
    let list = docFindings;
    if (activeCategory === 'IMPORTANT') list = importantFindings;
    if (activeCategory === 'PAY_ATTENTION') list = payAttentionFindings;
    if (activeCategory === 'GOOD_TO_KNOW') list = goodToKnowFindings;

    if (clauseSearchQuery.trim()) {
      const q = clauseSearchQuery.toLowerCase();
      list = list.filter((f) => 
        f.title.toLowerCase().includes(q) ||
        f.summary.toLowerCase().includes(q) ||
        f.evidence.toLowerCase().includes(q) ||
        f.section.toLowerCase().includes(q)
      );
    }
    return list;
  };

  const visibleFindings = getVisibleFindings();

  const handleSelectFinding = (finding: Finding) => {
    setSelectedFindingId(finding.id);
    if (finding.page) {
      setCurrentPage(finding.page);
    }
  };

  const handleAddChecklist = (finding: Finding) => {
    onAddFindingToChecklist(finding);
    setAddedChecklistIds((prev) => new Set(prev).add(finding.id));
  };

  const pageData = docPages.find((p) => p.pageNumber === currentPage) || docPages[0] || {
    pageNumber: currentPage,
    title: `Page ${currentPage}`,
    sections: [],
    rawText: `[Document text for page ${currentPage}]`,
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'FINANCIAL_OBLIGATION':
      case 'COMPENSATION':
        return '💰';
      case 'TERMINATION':
        return '🚪';
      case 'RESTRICTION':
        return '⚠️';
      case 'INTELLECTUAL_PROPERTY':
        return '💡';
      default:
        return '📌';
    }
  };

  // Determine matching domain benchmark
  const matchedDomain: ContractDomainBenchmark = 
    document.documentType.toLowerCase().includes('lease') || document.documentType.toLowerCase().includes('rent')
      ? LEGAL_DOMAIN_BENCHMARKS[1]
      : LEGAL_DOMAIN_BENCHMARKS[0];

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
      {/* Transparency Banner: Shown when live AI analysis was unavailable and heuristic fallback was engaged */}
      {document.isFallbackDemo && (
        <div 
          role="alert" 
          className="p-4 rounded-2xl bg-[#FEF7E0] border border-[#FEEFC3] text-[#7A4100] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs"
        >
          <div className="flex items-start sm:items-center gap-2.5">
            <AlertCircle className="w-5 h-5 text-[#B06000] shrink-0 mt-0.5 sm:mt-0" />
            <div>
              <div className="font-bold text-xs text-[#B06000]">Demo mode — live AI analysis unavailable</div>
              <p className="text-xs text-[#7A4100] mt-0.5">
                This document is displayed with simulated heuristic findings because live Gemini API analysis was unavailable. Findings are illustrative and not verified live claims.
              </p>
            </div>
          </div>
          <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-white text-[#B06000] border border-[#FEEFC3] shrink-0 self-start sm:self-auto">
            Simulated Fallback
          </span>
        </div>
      )}

      {/* Friendly Header */}
      <div className="bg-white rounded-2xl border border-[#E0E2E6] p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#E8F0FE] text-[#1A73E8]">
                {document.documentType}
              </span>
              <span className="text-xs text-[#5F6368]">
                {document.pageCount} pages · {document.parties.join(' & ')}
              </span>
            </div>
            <h1 className="font-display font-bold text-2xl sm:text-3xl text-[#1F1F1F]">
              We found a few things worth knowing.
            </h1>
            <p className="text-sm text-[#5F6368] mt-1">
              Here is what this document says about money, endings, rules, and what's missing — explained in everyday language.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-[#E6F4EA] px-3.5 py-2 rounded-xl text-xs font-semibold text-[#137333] shrink-0 border border-[#CEEAD6]">
            <ShieldCheck className="w-4 h-4 text-[#137333]" />
            <span>Every point sourced from document text</span>
          </div>
        </div>

        {/* Quick Numbers Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-[#F1F3F4]">
          <div className="p-3 bg-[#F8F9FA] rounded-xl border border-[#E8EAED]">
            <div className="text-xs text-[#5F6368]">Payment / Rent / Fee</div>
            <div className="font-semibold text-sm text-[#1F1F1F] truncate mt-0.5">
              {document.keyTerms.compensation || 'As stated'}
            </div>
          </div>
          <div className="p-3 bg-[#F8F9FA] rounded-xl border border-[#E8EAED]">
            <div className="text-xs text-[#5F6368]">Notice period</div>
            <div className="font-semibold text-sm text-[#1F1F1F] truncate mt-0.5">
              {document.keyTerms.noticePeriod || 'Standard'}
            </div>
          </div>
          <div className="p-3 bg-[#F8F9FA] rounded-xl border border-[#E8EAED]">
            <div className="text-xs text-[#5F6368]">Lock-in / Bond</div>
            <div className="font-semibold text-sm text-[#1F1F1F] truncate mt-0.5">
              {document.keyTerms.bondOrLockIn || 'None found'}
            </div>
          </div>
          <div className="p-3 bg-[#FEF7E0] rounded-xl border border-[#FEEFC3]">
            <div className="text-xs text-[#B06000] font-medium">Things needing attention</div>
            <div className="font-semibold text-sm text-[#B06000] truncate mt-0.5">
              {document.keyTerms.attentionItemsCount} key points
            </div>
          </div>
        </div>
      </div>

      {/* 5 HUMAN CATEGORY TABS */}
      <div className="flex flex-wrap items-center gap-2" role="tablist" aria-label="Finding Categories">
        <button
          role="tab"
          aria-selected={activeCategory === 'ALL'}
          onClick={() => setActiveCategory('ALL')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeCategory === 'ALL'
              ? 'bg-[#1F1F1F] text-white shadow-xs'
              : 'bg-white text-[#444746] border border-[#DADCE0] hover:bg-[#F8F9FA]'
          }`}
        >
          All points ({document.findings.length})
        </button>

        <button
          role="tab"
          aria-selected={activeCategory === 'IMPORTANT'}
          onClick={() => setActiveCategory('IMPORTANT')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeCategory === 'IMPORTANT'
              ? 'bg-[#D93025] text-white shadow-xs'
              : 'bg-white text-[#C5221F] border border-[#FCE8E6] hover:bg-[#FDF2F2]'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-[#D93025] inline-block" />
          <span>Important ({importantFindings.length})</span>
        </button>

        <button
          role="tab"
          aria-selected={activeCategory === 'PAY_ATTENTION'}
          onClick={() => setActiveCategory('PAY_ATTENTION')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeCategory === 'PAY_ATTENTION'
              ? 'bg-[#B06000] text-white shadow-xs'
              : 'bg-white text-[#B06000] border border-[#FEF7E0] hover:bg-[#FEFDF8]'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-[#B06000] inline-block" />
          <span>Pay attention ({payAttentionFindings.length})</span>
        </button>

        <button
          role="tab"
          aria-selected={activeCategory === 'GOOD_TO_KNOW'}
          onClick={() => setActiveCategory('GOOD_TO_KNOW')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeCategory === 'GOOD_TO_KNOW'
              ? 'bg-[#137333] text-white shadow-xs'
              : 'bg-white text-[#137333] border border-[#E6F4EA] hover:bg-[#F6FAF7]'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-[#137333] inline-block" />
          <span>Good to know ({goodToKnowFindings.length})</span>
        </button>

        <button
          role="tab"
          aria-selected={activeCategory === 'BENCHMARKS'}
          onClick={() => setActiveCategory('BENCHMARKS')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeCategory === 'BENCHMARKS'
              ? 'bg-[#004A77] text-white shadow-xs'
              : 'bg-white text-[#004A77] border border-[#C2E7FF] hover:bg-[#F0F7FF]'
          }`}
        >
          <Scale className="w-3.5 h-3.5" />
          <span>Fair Market Benchmarks</span>
        </button>

        {notFoundItems.length > 0 && (
          <button
            role="tab"
            aria-selected={activeCategory === 'NOT_FOUND'}
            onClick={() => setActiveCategory('NOT_FOUND')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeCategory === 'NOT_FOUND'
                ? 'bg-[#5F6368] text-white shadow-xs'
                : 'bg-white text-[#5F6368] border border-[#DADCE0] hover:bg-[#F8F9FA]'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-[#5F6368] inline-block" />
            <span>Not found ({notFoundItems.length})</span>
          </button>
        )}
      </div>

      {/* Screen Reader Live Region for filter state */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        Showing {visibleFindings.length} items in category {activeCategory}.
      </div>

      {/* MAIN TWO-COLUMN WORKSPACE */}
      {activeCategory === 'BENCHMARKS' ? (
        /* BENCHMARKS COMPARISON PANEL */
        <div className="bg-white rounded-2xl border border-[#E0E2E6] p-6 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#F1F3F4] pb-4">
            <div>
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-[#004A77]" />
                <h2 className="font-display font-bold text-xl text-[#1F1F1F]">
                  {matchedDomain.domainName} — Fair Standards & Risk Benchmarks
                </h2>
              </div>
              <p className="text-xs text-[#5F6368] mt-1">
                {matchedDomain.description} (Audience: {matchedDomain.targetAudience})
              </p>
            </div>
            <span className="text-xs font-semibold px-3 py-1 bg-[#E8F0FE] text-[#1A73E8] rounded-full self-start">
              Domain Standard Verified
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {matchedDomain.benchmarks.map((b) => (
              <div key={b.id} className="p-5 rounded-2xl border border-[#E0E2EC] bg-[#F8F9FA] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#004A77] uppercase tracking-wider">{b.category}</span>
                  {b.statutoryReference && (
                    <span className="text-[10px] font-medium px-2 py-0.5 bg-[#E6F4EA] text-[#137333] rounded-md">
                      {b.statutoryReference}
                    </span>
                  )}
                </div>
                <h3 className="font-bold text-sm text-[#1F1F1F]">{b.topic}</h3>
                
                <div className="space-y-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-white border border-[#E8EAED]">
                    <span className="font-semibold text-[#137333] block mb-0.5">✓ Standard / Favorable:</span>
                    <span className="text-[#444746]">{b.favorableToUser}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[#FFF8E1] border border-[#FFE082]">
                    <span className="font-semibold text-[#B06000] block mb-0.5">⚠️ High-Risk Indicator:</span>
                    <span className="text-[#7A4100]">{b.highRiskIndicator}</span>
                  </div>
                </div>

                <p className="text-[11px] text-[#5F6368] italic pt-1">
                  <strong>Legal context:</strong> {b.applicableLawGuidance}
                </p>
              </div>
            ))}
          </div>
        </div>
      ) : activeCategory !== 'NOT_FOUND' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT: DOCUMENT VIEWER */}
          <div className="lg:col-span-6 bg-white rounded-2xl border border-[#E0E2E6] flex flex-col h-[650px] overflow-hidden shadow-xs">
            <div className="px-5 py-3 border-b border-[#E0E2E6] bg-[#F8F9FA] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-[#1A73E8]" />
                <span className="font-semibold text-xs text-[#1F1F1F]">See it in the document</span>
                <span className="text-xs text-[#5F6368]">(Page {currentPage} of {document.pageCount})</span>
              </div>

              {/* Page Controls */}
              <div className="flex items-center gap-1.5">
                <button
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="p-1 rounded-lg hover:bg-[#E8EAED] disabled:opacity-30 text-[#444746]"
                  title="Previous page"
                  aria-label="Previous page"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <select
                  value={currentPage}
                  onChange={(e) => setCurrentPage(Number(e.target.value))}
                  aria-label="Select document page"
                  className="bg-white border border-[#DADCE0] text-xs rounded-lg px-2 py-1 font-medium text-[#1F1F1F]"
                >
                  {Array.from({ length: document.pageCount }, (_, i) => i + 1).map((p) => (
                    <option key={p} value={p}>Page {p}</option>
                  ))}
                </select>
                <button
                  disabled={currentPage >= document.pageCount}
                  onClick={() => setCurrentPage((p) => Math.min(document.pageCount, p + 1))}
                  className="p-1 rounded-lg hover:bg-[#E8EAED] disabled:opacity-30 text-[#444746]"
                  title="Next page"
                  aria-label="Next page"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Document Content with Plain Highlighting */}
            <div className="flex-1 overflow-y-auto p-5 font-mono text-xs leading-relaxed text-[#1F1F1F] bg-[#FFFFFF] selection:bg-[#D3E3FD]">
              <div className="max-w-prose mx-auto space-y-4 font-sans">
                <div className="text-center pb-2 text-[11px] text-[#70757A] border-b border-[#F1F3F4]">
                  Document page {currentPage} of {document.pageCount}
                </div>

                {pageData.sections.length > 0 ? (
                  pageData.sections.map((sec, idx) => {
                    const isCited =
                      selectedFinding &&
                      (sec.sectionNumber.includes(selectedFinding.section.replace('Section ', '')) ||
                        selectedFinding.evidence.includes(sec.text.slice(0, 30)));

                    return (
                      <div
                        key={idx}
                        className={`p-3.5 rounded-xl transition-all ${
                          isCited
                            ? 'bg-[#FEF7E0] border-2 border-[#F9AB00] shadow-xs'
                            : 'bg-[#F8F9FA] border border-[#E8EAED]'
                        }`}
                      >
                        <div className="font-bold text-xs text-[#1F1F1F] mb-1 flex items-center justify-between">
                          <span>{sec.sectionNumber} {sec.heading}</span>
                          {isCited && (
                            <span className="text-[10px] font-bold text-[#B06000] uppercase tracking-wider px-2 py-0.5 rounded-md bg-[#FCE8B2]">
                              Cited here
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-[#3C4043] leading-relaxed">{sec.text}</p>
                      </div>
                    );
                  })
                ) : (
                  <div className="p-4 bg-[#F8F9FA] rounded-xl text-xs text-[#5F6368] whitespace-pre-wrap leading-relaxed font-mono">
                    {pageData.rawText}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT: PLAIN-LANGUAGE FINDINGS & EXPLANATION */}
          <div className="lg:col-span-6 space-y-4">
            <div className="bg-white rounded-2xl border border-[#E0E2E6] p-4 shadow-xs">
              <div className="flex items-center justify-between mb-2 px-1">
                <span className="text-xs font-semibold text-[#5F6368]">Select a point to read explanation:</span>
                <span className="text-[11px] text-[#70757A]">{visibleFindings.length} found</span>
              </div>

              {/* Instant Search Bar */}
              <div className="relative mb-2.5">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-[#70757A]" />
                <input
                  type="text"
                  placeholder="Search or filter clauses..."
                  value={clauseSearchQuery}
                  onChange={(e) => setClauseSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-[#F8F9FA] border border-[#DADCE0] text-xs text-[#1F1F1F] focus:outline-none focus:border-[#1A73E8]"
                />
              </div>

              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {visibleFindings.map((finding) => {
                  const isSelected = finding.id === selectedFinding?.id;
                  const icon = getCategoryIcon(finding.category);

                  return (
                    <button
                      key={finding.id}
                      onClick={() => handleSelectFinding(finding)}
                      className={`w-full text-left p-2.5 rounded-xl border text-xs transition-all flex items-center justify-between ${
                        isSelected
                          ? 'bg-[#E8F0FE] border-[#1A73E8] font-semibold text-[#1A73E8]'
                          : 'bg-[#F8F9FA] border-[#E8EAED] text-[#3C4043] hover:bg-white'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate mr-2">
                        <span>{icon}</span>
                        <span className="truncate">{finding.title}</span>
                      </div>
                      <span className="text-[11px] font-medium text-[#70757A] shrink-0">
                        Page {finding.page}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {selectedFinding && (() => {
              const matchingBenchmark = LEGAL_DOMAIN_BENCHMARKS
                .flatMap((d) => d.benchmarks)
                .find(
                  (b) =>
                    b.category === selectedFinding.category ||
                    selectedFinding.title.toLowerCase().includes(b.topic.toLowerCase().slice(0, 8))
                );

              return (
                <div className="bg-white rounded-2xl border border-[#E0E2E6] p-6 shadow-xs space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 text-xs text-[#5F6368] mb-1">
                        <span className="font-semibold text-[#1A73E8]">
                          Where it says this: Page {selectedFinding.page} · {selectedFinding.section}
                        </span>
                      </div>
                      <h3 className="font-display font-bold text-lg text-[#1F1F1F] leading-snug">
                        {getCategoryIcon(selectedFinding.category)} {selectedFinding.title}
                      </h3>
                    </div>

                    {/* Gemini TTS Audio Readout */}
                    <button
                      onClick={() => handlePlayTTS(selectedFinding.evidence || selectedFinding.summary)}
                      disabled={isAudioLoading}
                      className="px-3 py-1.5 rounded-xl bg-[#E8F0FE] hover:bg-[#D2E3FC] text-[#1A73E8] text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                      aria-label={isPlayingTTS ? 'Stop reading aloud' : 'Read clause aloud with Gemini TTS'}
                    >
                      {isAudioLoading ? (
                        <span className="animate-spin w-3.5 h-3.5 border-2 border-[#1A73E8] border-t-transparent rounded-full" />
                      ) : isPlayingTTS ? (
                        <VolumeX className="w-3.5 h-3.5 text-[#D93025]" />
                      ) : (
                        <Volume2 className="w-3.5 h-3.5 text-[#1A73E8]" />
                      )}
                      <span>{isPlayingTTS ? 'Stop Audio' : 'Listen (TTS)'}</span>
                    </button>
                  </div>

                  <div className="space-y-1">
                    <div className="text-xs font-semibold text-[#1F1F1F]">What it says</div>
                    <p className="text-sm text-[#3C4043] leading-relaxed">{selectedFinding.summary}</p>
                  </div>

                  <div className="p-4 rounded-xl bg-[#FEF7E0] border border-[#FEEFC3] space-y-1">
                    <div className="text-xs font-bold text-[#B06000] flex items-center gap-1.5">
                      <Info className="w-3.5 h-3.5" />
                      <span>What this means for you</span>
                    </div>
                    <p className="text-xs text-[#7A4100] leading-relaxed">{selectedFinding.why_it_matters}</p>
                  </div>

                  {/* Benchmark & Statutory Explainability Card */}
                  {matchingBenchmark && (
                    <div className="p-4 rounded-xl bg-[#F0F4F9] border border-[#D2E3FC] space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="text-xs font-bold text-[#1A73E8] flex items-center gap-1.5">
                          <Scale className="w-3.5 h-3.5" />
                          <span>Fair Market Benchmark Standard</span>
                        </div>
                        {matchingBenchmark.statutoryReference && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-white text-[#1A73E8] border border-[#C2D7FA]">
                            {matchingBenchmark.statutoryReference}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-[#3C4043] leading-relaxed">
                        <strong className="text-[#137333]">Market Standard:</strong> {matchingBenchmark.marketStandard}
                      </div>
                      <div className="text-xs text-[#3C4043] leading-relaxed">
                        <strong className="text-[#1A73E8]">Fair Alternative:</strong> {matchingBenchmark.favorableToUser}
                      </div>
                    </div>
                  )}

                  <div className="border-t border-[#F1F3F4] pt-3">
                    <button
                      onClick={() => setShowOriginalWording(!showOriginalWording)}
                      className="flex items-center justify-between w-full text-xs font-semibold text-[#5F6368] hover:text-[#1F1F1F]"
                    >
                      <span>Original text from document</span>
                      {showOriginalWording ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>

                    {showOriginalWording && (
                      <div className="mt-2.5 p-3 rounded-xl bg-[#F8F9FA] border border-[#DADCE0] text-xs font-mono text-[#202124] italic leading-relaxed">
                        "{selectedFinding.evidence}"
                      </div>
                    )}
                  </div>

                  <div className="pt-3 border-t border-[#F1F3F4] flex flex-wrap gap-2">
                    <button
                      onClick={() => setCurrentPage(selectedFinding.page)}
                      className="flex-1 min-w-[130px] flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-[#F1F3F4] hover:bg-[#E8EAED] text-xs font-semibold text-[#1F1F1F] transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-[#1A73E8]" />
                      <span>See on page {selectedFinding.page}</span>
                    </button>

                    <button
                      onClick={() => handleAddChecklist(selectedFinding)}
                      className={`flex-1 min-w-[130px] flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
                        addedChecklistIds.has(selectedFinding.id)
                          ? 'bg-[#E6F4EA] text-[#137333] border border-[#CEEAD6]'
                          : 'bg-[#E8F0FE] hover:bg-[#D2E3FC] text-[#1A73E8]'
                      }`}
                    >
                      <CheckSquare className="w-3.5 h-3.5" />
                      <span>{addedChecklistIds.has(selectedFinding.id) ? 'Added to checklist' : '+ Add to checklist'}</span>
                    </button>

                    <button
                      onClick={() => onDraftEmailForFinding(selectedFinding)}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#1A73E8] hover:bg-[#1557B0] text-white text-xs font-semibold shadow-xs transition-colors"
                    >
                      <Mail className="w-3.5 h-3.5" />
                      <span>Draft a question to send</span>
                    </button>

                    <button
                      onClick={() => onAskAboutFinding(`Explain ${selectedFinding.title} in simple terms`)}
                      className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs text-[#5F6368] hover:text-[#1A73E8] transition-colors"
                    >
                      <HelpCircle className="w-3.5 h-3.5" />
                      <span>Ask something about this part</span>
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      ) : (
        /* NOT FOUND SECTION VIEW */
        <div className="bg-white rounded-2xl border border-[#E0E2E6] p-6 shadow-xs space-y-6">
          <div className="max-w-2xl">
            <h2 className="font-display font-bold text-xl text-[#1F1F1F]">Things not mentioned in this document</h2>
            <p className="text-xs text-[#5F6368] mt-1">
              If something you expected isn't here, do not assume it is included. You can ask for written confirmation.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {notFoundItems.map((item) => (
              <div key={item.id} className="p-5 rounded-2xl border border-[#DADCE0] bg-[#F8F9FA] space-y-3">
                <div className="flex items-center gap-2 text-xs font-semibold text-[#5F6368]">
                  <FileQuestion className="w-4 h-4 text-[#70757A]" />
                  <span className="uppercase tracking-wider">Not Found</span>
                </div>
                <h4 className="font-bold text-sm text-[#1F1F1F]">{item.topic}</h4>
                <p className="text-xs text-[#444746] leading-relaxed">{item.description}</p>
                <div className="p-3 rounded-xl bg-white border border-[#E0E2E6] text-xs text-[#B06000] space-y-1">
                  <div className="font-bold">What you can do</div>
                  <p>{item.recommendedAction}</p>
                </div>
                <button
                  onClick={() => onAskAboutFinding(`Is ${item.topic} covered in this document?`)}
                  className="text-xs font-semibold text-[#1A73E8] hover:text-[#1557B0] flex items-center gap-1 pt-1"
                >
                  <span>Draft clarification request</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CROSS-CLAUSE ANALYSIS */}
      {document.crossClauseRelationships.length > 0 && (
        <div className="bg-white rounded-2xl border border-[#E0E2E6] p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-[#1A73E8]" />
            <h3 className="font-display font-bold text-base text-[#1F1F1F]">
              Related parts to read together ({document.crossClauseRelationships.length})
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {document.crossClauseRelationships.map((rel) => (
              <div key={rel.id} className="p-4 rounded-xl border border-[#E8EAED] bg-[#F8F9FA] space-y-2.5">
                <div className="font-bold text-sm text-[#1F1F1F]">{rel.title}</div>
                <p className="text-xs text-[#444746] leading-relaxed">{rel.relationshipExplanation}</p>
                <div className="text-[11px] text-[#B06000] bg-white p-2.5 rounded-lg border border-[#FEEFC3]">
                  <strong>Practical tip:</strong> {rel.reviewImplication}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
