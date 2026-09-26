import React, { useState } from 'react';
import { 
  FileText, 
  Upload, 
  Trash2, 
  ArrowRight, 
  GitCompare, 
  Plus, 
  ShieldCheck, 
  Sparkles, 
  AlertTriangle,
  X,
  Check,
  RotateCcw
} from 'lucide-react';
import { LegalDocument, UserProfile } from '../types';
import { ActiveTab } from './Navigation';

interface MyDocumentsViewProps {
  userDocuments: LegalDocument[];
  demoDocuments: LegalDocument[];
  activeDoc: LegalDocument | null;
  currentUser: UserProfile;
  onSelectDoc: (doc: LegalDocument) => void;
  onDeleteDoc: (docId: string, isDemo?: boolean) => void;
  onRestoreDemoDocs?: () => void;
  onOpenUpload: () => void;
  onSwitchToDemo: () => void;
  setActiveTab: (tab: ActiveTab) => void;
}

export const MyDocumentsView: React.FC<MyDocumentsViewProps> = ({
  userDocuments,
  demoDocuments,
  activeDoc,
  currentUser,
  onSelectDoc,
  onDeleteDoc,
  onRestoreDemoDocs,
  onOpenUpload,
  onSwitchToDemo,
  setActiveTab,
}) => {
  const isDemoMode = currentUser.accountType === 'demo';
  const displayedDocs = isDemoMode ? demoDocuments : userDocuments;

  // In-app deletion confirmation modal state
  const [docToDelete, setDocToDelete] = useState<LegalDocument | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  const confirmDelete = async () => {
    if (!docToDelete) return;
    setIsDeleting(true);
    try {
      const isDemo = isDemoMode || docToDelete.source === 'demo' || docToDelete.isDemo === true;
      const title = docToDelete.title;
      await onDeleteDoc(docToDelete.id, isDemo);
      setDocToDelete(null);
      setToastMessage(`"${title}" was removed successfully.`);
      setTimeout(() => setToastMessage(null), 3500);
    } catch (err) {
      console.error('Delete error:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 space-y-8">
      {/* Toast Feedback */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 bg-[#1E293B] text-white rounded-xl shadow-lg border border-slate-700 animate-in fade-in slide-in-from-bottom-2">
          <Check className="w-4 h-4 text-[#34A853]" />
          <span className="text-xs font-medium">{toastMessage}</span>
        </div>
      )}

      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E0E2E6] pb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="font-display text-2xl font-bold text-[#1F1F1F]">
              {isDemoMode ? 'Demo Documents' : 'My Documents'}
            </h1>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#F1F3F4] text-[#444746]">
              {displayedDocs.length} {displayedDocs.length === 1 ? 'document' : 'documents'}
            </span>
          </div>
          <p className="text-xs text-[#5F6368] mt-1">
            {isDemoMode 
              ? 'Sample agreements prepared for feature walkthroughs and client presentations.' 
              : 'Your private legal agreements, notices, and uploaded contracts.'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isDemoMode && onRestoreDemoDocs && displayedDocs.length < 5 && (
            <button
              onClick={onRestoreDemoDocs}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-2xl bg-white border border-[#DADCE0] hover:bg-[#F8F9FA] text-[#1F1F1F] text-xs font-medium transition-colors cursor-pointer"
              title="Restore default sample walkthrough documents"
            >
              <RotateCcw className="w-3.5 h-3.5 text-[#5F6368]" />
              <span>Reset Samples</span>
            </button>
          )}

          <button
            onClick={onOpenUpload}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-[#1A73E8] hover:bg-[#1557B0] text-white text-xs font-semibold shadow-xs hover:shadow transition-all cursor-pointer shrink-0"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload document</span>
          </button>
        </div>
      </div>

      {/* Document Grid or Empty State */}
      {displayedDocs.length === 0 ? (
        <div className="p-12 text-center rounded-3xl border border-[#DADCE0] bg-white shadow-2xs space-y-5 max-w-lg mx-auto">
          <div className="w-14 h-14 rounded-2xl bg-[#F8F9FA] border border-[#E0E2E6] text-[#5F6368] flex items-center justify-center mx-auto shadow-2xs">
            <FileText className="w-7 h-7 text-[#1A73E8]" />
          </div>

          <div className="space-y-1.5">
            <h3 className="font-display font-bold text-lg text-[#1F1F1F]">
              No documents in vault
            </h3>
            <p className="text-xs text-[#5F6368] leading-relaxed max-w-sm mx-auto">
              {isDemoMode
                ? 'All demo documents have been removed. You can restore them or upload your own document.'
                : 'Upload any PDF, agreement, employment letter, or society notice to instantly analyze key terms.'}
            </p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={onOpenUpload}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#1A73E8] hover:bg-[#1557B0] text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer inline-flex items-center justify-center gap-2"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload document</span>
            </button>

            {isDemoMode && onRestoreDemoDocs ? (
              <button
                onClick={onRestoreDemoDocs}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-[#F8F9FA] hover:bg-[#F1F3F4] text-[#1F1F1F] text-xs font-medium border border-[#DADCE0] transition-colors cursor-pointer inline-flex items-center justify-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5 text-[#1A73E8]" />
                <span>Restore sample documents</span>
              </button>
            ) : (
              <button
                onClick={onSwitchToDemo}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-[#F8F9FA] hover:bg-[#F1F3F4] text-[#1F1F1F] text-xs font-medium border border-[#DADCE0] transition-colors cursor-pointer inline-flex items-center justify-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#B06000]" />
                <span>Switch to Demo Mode</span>
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayedDocs.map((doc) => {
            const isActive = activeDoc?.id === doc.id;
            return (
              <div
                key={doc.id}
                className={`p-5 rounded-2xl border transition-all flex flex-col justify-between bg-white ${
                  isActive 
                    ? 'border-[#1A73E8] ring-2 ring-[#1A73E8]/10 shadow-xs' 
                    : 'border-[#E0E2E6] hover:border-[#BDC1C6] hover:shadow-xs'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#F1F3F4] text-[#444746]">
                      {doc.documentType}
                    </span>

                    {/* Delete Trigger Button */}
                    <button
                      id={`delete-doc-btn-${doc.id}`}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDocToDelete(doc);
                      }}
                      className="p-1.5 rounded-lg text-[#70757A] hover:text-[#D93025] hover:bg-[#FCE8E6] transition-colors cursor-pointer"
                      title={`Delete "${doc.title}"`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div>
                    <h3 className="font-display font-bold text-sm text-[#1F1F1F] leading-snug line-clamp-2">
                      {doc.title}
                    </h3>
                    <div className="flex items-center gap-2 text-[11px] text-[#5F6368] mt-1.5">
                      <span>{doc.pageCount} pages</span>
                      <span>·</span>
                      <span>{doc.uploadedAt || 'Uploaded document'}</span>
                    </div>
                  </div>

                  {doc.keyTerms?.attentionItemsCount !== undefined && doc.keyTerms.attentionItemsCount > 0 && (
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-[#FEF7E0] border border-[#FEEFC3] text-[11px] font-semibold text-[#B06000]">
                      <span>{doc.keyTerms.attentionItemsCount} items need attention</span>
                    </div>
                  )}
                </div>

                <div className="pt-4 mt-4 border-t border-[#F1F3F4] flex items-center justify-between gap-2">
                  <button
                    onClick={() => {
                      onSelectDoc(doc);
                      setActiveTab('compare');
                    }}
                    className="text-[11px] font-semibold text-[#5F6368] hover:text-[#1F1F1F] inline-flex items-center gap-1 cursor-pointer"
                  >
                    <GitCompare className="w-3 h-3" />
                    <span>Compare</span>
                  </button>

                  <button
                    onClick={() => {
                      onSelectDoc(doc);
                      setActiveTab('xray');
                    }}
                    className="px-3 py-1.5 rounded-xl bg-[#1A73E8] hover:bg-[#1557B0] text-white text-xs font-semibold transition-colors inline-flex items-center gap-1 cursor-pointer"
                  >
                    <span>Analyze</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================================= */}
      {/* IN-APP DELETE CONFIRMATION MODAL (Replaces broken window.confirm) */}
      {/* ========================================================================= */}
      {docToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl border border-[#DADCE0] shadow-2xl w-full max-w-md overflow-hidden p-6 space-y-5 animate-in zoom-in-95 duration-150">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-2xl bg-[#FCE8E6] text-[#D93025] flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="font-display font-bold text-base text-[#1F1F1F]">
                  Remove Document?
                </h3>
                <p className="text-xs text-[#5F6368] leading-relaxed">
                  Are you sure you want to remove <strong className="text-[#1F1F1F]">"{docToDelete.title}"</strong> from your document vault?
                </p>
              </div>
            </div>

            <div className="p-3 bg-[#F8F9FA] rounded-xl border border-[#E8EAED] text-xs text-[#5F6368] space-y-1">
              <div className="flex justify-between">
                <span>Document Type:</span>
                <span className="font-semibold text-[#1F1F1F]">{docToDelete.documentType}</span>
              </div>
              <div className="flex justify-between">
                <span>Indexed Pages:</span>
                <span className="font-semibold text-[#1F1F1F]">{docToDelete.pageCount} pages</span>
              </div>
              <div className="flex justify-between">
                <span>Findings & Questions:</span>
                <span className="font-semibold text-[#1F1F1F]">{docToDelete.findings?.length || 0} findings</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setDocToDelete(null)}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-[#5F6368] hover:bg-[#F1F3F4] transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                id="confirm-delete-doc-btn"
                type="button"
                onClick={confirmDelete}
                disabled={isDeleting}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#D93025] hover:bg-[#B3261E] disabled:bg-red-300 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isDeleting ? 'Removing...' : 'Delete Document'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
