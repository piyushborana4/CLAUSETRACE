import React, { useState } from 'react';
import { 
  GitCompare, 
  CheckCircle2, 
  AlertCircle, 
  Plus, 
  Minus, 
  RefreshCw, 
  Info,
  Upload,
  Sparkles,
  FileText
} from 'lucide-react';
import { LegalDocument, DocumentComparison, DocumentComparisonItem } from '../types';

interface CompareViewProps {
  documents: LegalDocument[];
  initialComparison?: DocumentComparison;
  onOpenUpload?: () => void;
  onSwitchToDemo?: () => void;
}

export const CompareView: React.FC<CompareViewProps> = ({
  documents,
  initialComparison,
  onOpenUpload,
  onSwitchToDemo,
}) => {
  const [docAId, setDocAId] = useState<string>(
    initialComparison?.docAId || documents[0]?.id || ''
  );
  const [docBId, setDocBId] = useState<string>(
    initialComparison?.docBId || documents[1]?.id || documents[0]?.id || ''
  );
  const [comparison, setComparison] = useState<DocumentComparison | null>(
    initialComparison || null
  );
  const [isComparing, setIsComparing] = useState<boolean>(false);
  const [selectedFilter, setSelectedFilter] = useState<string>('ALL');

  React.useEffect(() => {
    const validA = documents.find(d => d.id === docAId) ? docAId : (initialComparison?.docAId || documents[0]?.id || '');
    const validB = documents.find(d => d.id === docBId) ? docBId : (initialComparison?.docBId || documents[1]?.id || documents[0]?.id || '');
    setDocAId(validA);
    setDocBId(validB);
    setComparison(initialComparison || null);
  }, [initialComparison, documents, docAId, docBId]);

  if (documents.length < 2) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-16 text-center space-y-6">
        <div className="w-16 h-16 rounded-3xl bg-[#E8F0FE] text-[#1A73E8] flex items-center justify-center mx-auto shadow-xs">
          <GitCompare className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h2 className="font-display font-bold text-2xl text-[#1F1F1F]">
            Compare two versions or agreements
          </h2>
          <p className="text-sm text-[#5F6368] leading-relaxed max-w-md mx-auto">
            Upload at least two documents (e.g. original offer vs revised contract) to view a plain-language diff and highlighted changes.
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
              <span>Switch to Demo Mode (Includes 5 sample docs)</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  const docA = documents.find(d => d.id === docAId) || documents[0];
  const docB = documents.find(d => d.id === docBId) || documents[1] || documents[0];

  const handleRunComparison = async () => {
    if (!docA || !docB) return;
    setIsComparing(true);
    try {
      const res = await fetch('/api/compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ docA, docB }),
      });
      if (res.ok) {
        const data: DocumentComparison = await res.json();
        setComparison(data);
      }
    } catch (err) {
      console.error('Comparison error:', err);
    } finally {
      setIsComparing(false);
    }
  };

  const getStatusBadge = (status: DocumentComparisonItem['status']) => {
    switch (status) {
      case 'ADDED':
        return (
          <span className="flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#E6F4EA] text-[#137333] border border-[#CEEAD6]">
            <Plus className="w-3 h-3" />
            Added in second document
          </span>
        );
      case 'REMOVED':
        return (
          <span className="flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#FCE8E6] text-[#C5221F] border border-[#FAD2CF]">
            <Minus className="w-3 h-3" />
            Removed in second document
          </span>
        );
      case 'CHANGED':
        return (
          <span className="flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#E8F0FE] text-[#1A73E8] border border-[#D2E3FC]">
            <RefreshCw className="w-3 h-3" />
            Different terms
          </span>
        );
      case 'UNCHANGED':
        return (
          <span className="flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#F1F3F4] text-[#5F6368] border border-[#DADCE0]">
            <CheckCircle2 className="w-3 h-3" />
            Same in both
          </span>
        );
      case 'POSSIBLE_INCONSISTENCY':
        return (
          <span className="flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#FEF7E0] text-[#B06000] border border-[#FEEFC3]">
            <AlertCircle className="w-3 h-3" />
            Needs attention
          </span>
        );
    }
  };

  const filteredItems = comparison?.items.filter(item => {
    if (selectedFilter === 'ALL') return true;
    if (selectedFilter === 'DIFFERENCES') return item.status !== 'UNCHANGED';
    return item.status === selectedFilter;
  }) || [];

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 space-y-8">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-2xl sm:text-3xl text-[#1F1F1F]">
            Compare two documents
          </h1>
          <p className="text-sm text-[#5F6368] mt-1.5">
            See the differences side by side in plain words. No complicated legal jargon.
          </p>
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#F8F9FA] border border-[#E0E2E6] text-xs text-[#5F6368]">
          <Info className="w-3.5 h-3.5 text-[#1A73E8]" />
          <span>Factual side-by-side view</span>
        </div>
      </div>

      {/* Document Selectors Header */}
      <div className="bg-white rounded-2xl border border-[#E0E2E6] p-6 shadow-xs space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
          {/* Doc A */}
          <div className="md:col-span-5 space-y-1.5">
            <label className="text-xs font-semibold text-[#5F6368]">
              First Document
            </label>
            <select
              id="compare-doc-a-select"
              value={docAId}
              onChange={(e) => setDocAId(e.target.value)}
              className="w-full bg-[#F8F9FA] border border-[#DADCE0] rounded-xl px-3.5 py-2.5 text-xs font-semibold text-[#1F1F1F] outline-none focus:border-[#1A73E8]"
            >
              {documents.filter(d => d.source === 'user').length > 0 && (
                <optgroup label="Uploaded Documents">
                  {documents.filter(d => d.source === 'user').map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.title} ({d.pageCount} pages)
                    </option>
                  ))}
                </optgroup>
              )}
              {documents.filter(d => d.source !== 'user').length > 0 && (
                <optgroup label="Sample Documents">
                  {documents.filter(d => d.source !== 'user').map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.title} ({d.pageCount} pages)
                    </option>
                  ))}
                </optgroup>
              )}
            </select>
          </div>

          {/* Compare Button */}
          <div className="md:col-span-2 text-center pt-5">
            <button
              id="run-compare-btn"
              onClick={handleRunComparison}
              disabled={isComparing || docAId === docBId}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#1A73E8] hover:bg-[#1557B0] disabled:opacity-40 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <GitCompare className="w-4 h-4" />
              <span>{isComparing ? 'Comparing...' : 'Compare'}</span>
            </button>
          </div>

          {/* Doc B */}
          <div className="md:col-span-5 space-y-1.5">
            <label className="text-xs font-semibold text-[#5F6368]">
              Second Document
            </label>
            <select
              id="compare-doc-b-select"
              value={docBId}
              onChange={(e) => setDocBId(e.target.value)}
              className="w-full bg-[#F8F9FA] border border-[#DADCE0] rounded-xl px-3.5 py-2.5 text-xs font-semibold text-[#1F1F1F] outline-none focus:border-[#1A73E8]"
            >
              {documents.filter(d => d.source === 'user').length > 0 && (
                <optgroup label="Uploaded Documents">
                  {documents.filter(d => d.source === 'user').map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.title} ({d.pageCount} pages)
                    </option>
                  ))}
                </optgroup>
              )}
              {documents.filter(d => d.source !== 'user').length > 0 && (
                <optgroup label="Sample Documents">
                  {documents.filter(d => d.source !== 'user').map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.title} ({d.pageCount} pages)
                    </option>
                  ))}
                </optgroup>
              )}
            </select>
          </div>
        </div>
      </div>

      {/* Comparison Summary & Filter Pills */}
      {!comparison ? (
        <div className="bg-white rounded-2xl border border-[#DADCE0] p-10 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-[#E8F0FE] text-[#1A73E8] flex items-center justify-center mx-auto shadow-2xs">
            <GitCompare className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="font-display font-semibold text-base text-[#1F1F1F]">
              Ready to compare
            </h3>
            <p className="text-xs text-[#5F6368] max-w-md mx-auto">
              Choose two documents above and click "Compare" to view side-by-side differences and clause modifications.
            </p>
          </div>
          <button
            onClick={handleRunComparison}
            disabled={isComparing || docAId === docBId}
            className="px-5 py-2.5 rounded-xl bg-[#1A73E8] hover:bg-[#1557B0] disabled:opacity-40 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer inline-flex items-center gap-2"
          >
            <GitCompare className="w-4 h-4" />
            <span>{isComparing ? 'Analyzing...' : 'Run comparison now'}</span>
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-[#F8F9FA] p-4 rounded-xl border border-[#E0E2E6] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <p className="text-[#3C4043] leading-relaxed max-w-3xl">
              <strong className="text-[#1F1F1F]">Summary:</strong> {comparison.summary}
            </p>
            <span className="text-[11px] text-[#70757A] shrink-0 font-medium">
              Checked on {comparison.comparisonDate}
            </span>
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-xs font-semibold text-[#5F6368] mr-1">Show:</span>
            {[
              { label: 'All topics', value: 'ALL' },
              { label: 'Differences only', value: 'DIFFERENCES' },
              { label: 'Changed', value: 'CHANGED' },
              { label: 'Removed', value: 'REMOVED' },
              { label: 'Added', value: 'ADDED' },
              { label: 'Same in both', value: 'UNCHANGED' },
            ].map((f) => (
              <button
                key={f.value}
                onClick={() => setSelectedFilter(f.value)}
                className={`text-xs font-semibold px-3 py-1.5 rounded-full transition-colors ${
                  selectedFilter === f.value
                    ? 'bg-[#1A73E8] text-white'
                    : 'bg-white border border-[#DADCE0] text-[#444746] hover:bg-[#F1F3F4]'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Comparison Cards */}
          <div className="space-y-3">
            {filteredItems.map((item) => (
              <div 
                key={item.id}
                className="bg-white rounded-2xl border border-[#E0E2E6] p-6 shadow-xs space-y-3.5"
              >
                {/* Topic Header & Status */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#F1F3F4] pb-3">
                  <div>
                    <h3 className="font-display font-bold text-base text-[#1F1F1F]">
                      {item.topic}
                    </h3>
                  </div>
                  <div>
                    {getStatusBadge(item.status)}
                  </div>
                </div>

                {/* Side-by-side values */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Doc A Value */}
                  <div className="p-4 rounded-xl bg-[#F8F9FA] border border-[#E8EAED] space-y-1.5">
                    <div className="text-xs font-semibold text-[#5F6368] flex items-center justify-between">
                      <span className="truncate">{comparison.docATitle}</span>
                      {item.docAPage && (
                        <span className="text-[11px] text-[#1A73E8] font-bold shrink-0">
                          Page {item.docAPage} · {item.docASection}
                        </span>
                      )}
                    </div>
                    <div className="text-sm font-medium text-[#1F1F1F]">
                      {item.docAValue}
                    </div>
                  </div>

                  {/* Doc B Value */}
                  <div className="p-4 rounded-xl bg-[#F8F9FA] border border-[#E8EAED] space-y-1.5">
                    <div className="text-xs font-semibold text-[#5F6368] flex items-center justify-between">
                      <span className="truncate">{comparison.docBTitle}</span>
                      {item.docBPage && (
                        <span className="text-[11px] text-[#1A73E8] font-bold shrink-0">
                          Page {item.docBPage} · {item.docBSection}
                        </span>
                      )}
                    </div>
                    <div className="text-sm font-medium text-[#1F1F1F]">
                      {item.docBValue}
                    </div>
                  </div>
                </div>

                {/* Plain Difference & Clarification Note */}
                <div className="pt-1 space-y-2 text-xs">
                  <div>
                    <span className="font-semibold text-[#1F1F1F]">What this means: </span>
                    <span className="text-[#444746]">{item.factualDifference}</span>
                  </div>
                  {item.clarificationNote && (
                    <div className="bg-[#FEFDF8] border border-[#FEEFC3] p-2.5 rounded-xl text-[#7A4100]">
                      <span className="font-semibold">Helpful tip: </span>
                      <span>{item.clarificationNote}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
