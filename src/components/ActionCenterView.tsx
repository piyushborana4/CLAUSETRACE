import React, { useState, useEffect } from 'react';
import { 
  Mail, 
  Copy, 
  Check, 
  Clock, 
  ShieldCheck,
  Upload,
  Sparkles,
  Download,
  FileText,
  Printer,
  CheckSquare,
  Square,
  SlidersHorizontal,
  X,
  FileDown,
  ChevronDown,
  Info
} from 'lucide-react';
import { LegalDocument, Finding, ClarificationEmailDraft, UserProfile } from '../types';
import { exportActionCenterPdf, EmailExportItem } from '../lib/pdfExport';

interface ActionCenterViewProps {
  document: LegalDocument | null;
  preselectedFinding?: Finding | null;
  currentUser?: UserProfile | null;
  onOpenUpload?: () => void;
  onSwitchToDemo?: () => void;
}

export const ActionCenterView: React.FC<ActionCenterViewProps> = ({
  document,
  preselectedFinding,
  currentUser,
  onOpenUpload,
  onSwitchToDemo,
}) => {
  const docFindings = Array.isArray(document?.findings) ? document.findings : [];
  const defaultFinding: Finding = docFindings[0] || {
    id: 'f-default',
    title: 'General Terms',
    category: 'GENERAL' as any,
    status: 'DOCUMENT_SUPPORTED',
    summary: 'General terms in document',
    page: 1,
    section: 'Provisions',
    evidence: 'Agreement terms.',
    why_it_matters: 'Clarification on provisions.',
    suggested_action: 'Request clarification.',
    requires_professional_review: false,
  };

  const [selectedFinding, setSelectedFinding] = useState<Finding>(
    preselectedFinding || defaultFinding
  );
  const [recipientRole, setRecipientRole] = useState<string>('HR / Company');
  const [copied, setCopied] = useState<boolean>(false);

  // Multi-selection state for batch export
  const [selectedFindingIds, setSelectedFindingIds] = useState<Set<string>>(() => {
    const initialId = preselectedFinding?.id || defaultFinding.id;
    return new Set(docFindings.length > 0 ? [initialId] : []);
  });

  // Modal states
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportSuccessToast, setExportSuccessToast] = useState<string | null>(null);

  // Export options
  const [includeEvidence, setIncludeEvidence] = useState<boolean>(true);
  const [includeTimelines, setIncludeTimelines] = useState<boolean>(true);
  const [includeDisclaimer, setIncludeDisclaimer] = useState<boolean>(true);
  const [customExportNote, setCustomExportNote] = useState<string>('');
  const [reviewerName, setReviewerName] = useState<string>(currentUser?.name || 'Document Reviewer');

  // Custom edits dictionary for findings
  const [customDrafts, setCustomDrafts] = useState<Record<string, { subject: string; body: string }>>({});

  // Helper generator function
  const generatePoliteMessage = (f: Finding | undefined, role: string) => {
    const finding = f || defaultFinding;
    const isLandlord = role.includes('Landlord') || role.includes('Owner');
    const isSociety = role.includes('Society');
    const isClient = role.includes('Client');

    const greeting = isLandlord 
      ? "Hi," 
      : isSociety 
      ? "Dear Managing Committee," 
      : isClient 
      ? "Hi," 
      : "Hi [Name],";

    const docTitle = document?.title || 'Document';
    const docContext = isLandlord
      ? `I'm reviewing the draft agreement for the property (${docTitle}).`
      : isSociety
      ? `I am writing with reference to the document regarding ${docTitle}.`
      : isClient
      ? `I'm reviewing our agreement draft for ${docTitle} and wanted to confirm a few points.`
      : `I'm reviewing the ${docTitle} draft and had a quick question to make sure I understand everything correctly.`;

    const question = `Regarding Section ${finding.section || 'General'} on Page ${finding.page || 1} ("${finding.title}"):\nCould you clarify whether this applies in all situations, or if there is specific guidance on how this works?\n\n"${finding.evidence || ''}"`;

    const signoff = isSociety 
      ? "Thank you for your guidance,\nWarm regards,\n[Your Name]" 
      : "Thank you for taking the time to clarify!\n\nBest regards,\n[Your Name]";

    return {
      subject: `Question regarding ${finding.title} (Page ${finding.page || 1}, Section ${finding.section || 'General'})`,
      body: `${greeting}\n\n${docContext}\n\n${question}\n\n${signoff}`
    };
  };

  const [currentEmailDraft, setCurrentEmailDraft] = useState<ClarificationEmailDraft>(() => {
    const initial = generatePoliteMessage(selectedFinding || defaultFinding, recipientRole);
    return {
      id: 'draft-initial',
      recipientRole,
      subject: initial.subject,
      body: initial.body,
      referencedClauses: [
        {
          section: (selectedFinding || defaultFinding).section || 'Clause',
          page: (selectedFinding || defaultFinding).page || 1,
          title: (selectedFinding || defaultFinding).title || 'Finding',
        }
      ],
      tone: 'polite_inquiry'
    };
  });

  // Keep reviewer name in sync if currentUser updates
  useEffect(() => {
    if (currentUser?.name) {
      setReviewerName(currentUser.name);
    }
  }, [currentUser?.name]);

  if (!document) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-16 text-center space-y-6">
        <div className="w-16 h-16 rounded-3xl bg-[#E8F0FE] text-[#1A73E8] flex items-center justify-center mx-auto shadow-xs">
          <Mail className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h2 className="font-display font-bold text-2xl text-[#1F1F1F]">
            Draft polite clarification messages
          </h2>
          <p className="text-sm text-[#5F6368] leading-relaxed max-w-md mx-auto">
            Upload your document or switch to Demo Mode to automatically generate polite emails and questions based on exact clauses.
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

  // Update current draft when finding changes
  const handleSelectFinding = (finding: Finding) => {
    setSelectedFinding(finding);
    if (customDrafts[finding.id]) {
      const saved = customDrafts[finding.id];
      setCurrentEmailDraft({
        id: `draft-${finding.id}`,
        recipientRole,
        subject: saved.subject,
        body: saved.body,
        referencedClauses: [{ section: finding.section, page: finding.page, title: finding.title }],
        tone: 'polite_inquiry',
      });
    } else {
      const updated = generatePoliteMessage(finding, recipientRole);
      setCurrentEmailDraft({
        id: `draft-${finding.id}`,
        recipientRole,
        subject: updated.subject,
        body: updated.body,
        referencedClauses: [{ section: finding.section, page: finding.page, title: finding.title }],
        tone: 'polite_inquiry',
      });
    }
  };

  const handleRecipientChange = (newRole: string) => {
    setRecipientRole(newRole);
    const updated = generatePoliteMessage(selectedFinding, newRole);
    setCurrentEmailDraft(prev => ({
      ...prev,
      recipientRole: newRole,
      subject: updated.subject,
      body: updated.body,
    }));
    // Also update custom draft
    setCustomDrafts(prev => ({
      ...prev,
      [selectedFinding.id]: {
        subject: updated.subject,
        body: updated.body,
      }
    }));
  };

  const handleBodyChange = (newBody: string) => {
    setCurrentEmailDraft(prev => ({ ...prev, body: newBody }));
    setCustomDrafts(prev => ({
      ...prev,
      [selectedFinding.id]: {
        subject: currentEmailDraft.subject,
        body: newBody,
      }
    }));
  };

  const handleCopyEmail = () => {
    const fullText = `Subject: ${currentEmailDraft.subject}\n\n${currentEmailDraft.body}`;
    navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // Multi-select toggle
  const toggleFindingSelection = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedFindingIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        if (next.size > 1) {
          next.delete(id);
        }
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const selectAllFindings = () => {
    const allIds = new Set(docFindings.map(f => f.id));
    setSelectedFindingIds(allIds);
  };

  const selectOnlyCurrentFinding = () => {
    setSelectedFindingIds(new Set([selectedFinding.id]));
  };

  // PDF Export Executor
  const handleExportPdf = (exportOnlyCurrent: boolean = false) => {
    setIsExporting(true);

    try {
      const targetFindings = exportOnlyCurrent 
        ? [selectedFinding]
        : docFindings.filter(f => selectedFindingIds.has(f.id));

      const finalFindings = targetFindings.length > 0 ? targetFindings : [selectedFinding];

      const exportItems: EmailExportItem[] = finalFindings.map(f => {
        // If current finding, use active body/subject
        if (f.id === selectedFinding.id) {
          return {
            finding: f,
            recipientRole,
            subject: currentEmailDraft.subject,
            body: currentEmailDraft.body,
          };
        }
        // If has custom draft
        if (customDrafts[f.id]) {
          return {
            finding: f,
            recipientRole,
            subject: customDrafts[f.id].subject,
            body: customDrafts[f.id].body,
          };
        }
        // Generate default
        const generated = generatePoliteMessage(f, recipientRole);
        return {
          finding: f,
          recipientRole,
          subject: generated.subject,
          body: generated.body,
        };
      });

      exportActionCenterPdf({
        document,
        items: exportItems,
        userName: reviewerName.trim() || 'Document Reviewer',
        includeEvidenceQuotes: includeEvidence,
        includeTimelines,
        includeDisclaimer,
        customNotes: customExportNote.trim() || undefined,
      });

      setIsExportModalOpen(false);
      setExportSuccessToast(
        `Exported ${exportItems.length} finding${exportItems.length > 1 ? 's' : ''} & drafted email${exportItems.length > 1 ? 's' : ''} to PDF!`
      );
      setTimeout(() => setExportSuccessToast(null), 4000);
    } catch (err) {
      console.error('PDF export failed:', err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 space-y-8">
      {/* Toast Notification */}
      {exportSuccessToast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 bg-[#1E293B] text-white rounded-xl shadow-lg border border-slate-700 animate-in fade-in slide-in-from-bottom-2">
          <Check className="w-4 h-4 text-[#34A853]" />
          <span className="text-xs font-medium">{exportSuccessToast}</span>
        </div>
      )}

      {/* Header & Main Export Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-2xl sm:text-3xl text-[#1F1F1F]">
            Need to ask about this?
          </h1>
          <p className="text-sm text-[#5F6368] mt-1.5">
            Here is a polite, professional message you can send. Friendly, respectful, and never argumentative.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
          {/* Quick Export Current Button */}
          <button
            id="quick-export-current-pdf-btn"
            onClick={() => handleExportPdf(true)}
            disabled={isExporting}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-[#DADCE0] hover:bg-[#F1F3F4] text-xs font-semibold text-[#1F1F1F] transition-colors cursor-pointer shadow-2xs"
            title="Download PDF of the current selected finding and drafted message"
          >
            <Download className="w-3.5 h-3.5 text-[#1A73E8]" />
            <span>Export Current (PDF)</span>
          </button>

          {/* Formatted Batch PDF Export Modal Trigger */}
          <button
            id="open-export-pdf-modal-btn"
            onClick={() => setIsExportModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#1A73E8] hover:bg-[#1557B0] text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <FileDown className="w-3.5 h-3.5" />
            <span>Export Selected PDF ({selectedFindingIds.size})</span>
          </button>
        </div>
      </div>

      {/* CLARIFICATION EMAIL GENERATOR & TOPIC SELECTOR */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Topic Selector with Checkboxes */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-2xl border border-[#E0E2E6] p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="font-semibold text-xs text-[#5F6368]">
                Select topics to ask about:
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={selectAllFindings}
                  className="text-[11px] font-semibold text-[#1A73E8] hover:underline cursor-pointer"
                >
                  Select all ({docFindings.length})
                </button>
                <span className="text-gray-300 text-xs">·</span>
                <button
                  onClick={selectOnlyCurrentFinding}
                  className="text-[11px] font-semibold text-[#5F6368] hover:underline cursor-pointer"
                >
                  Only current
                </button>
              </div>
            </div>

            <div className="space-y-2 max-h-[440px] overflow-y-auto pr-1">
              {docFindings.map((f) => {
                const isCurrent = f.id === selectedFinding.id;
                const isChecked = selectedFindingIds.has(f.id);

                return (
                  <div
                    key={f.id}
                    id={`action-item-${f.id}`}
                    onClick={() => handleSelectFinding(f)}
                    className={`group w-full text-left p-3 rounded-xl border text-xs transition-all cursor-pointer flex items-start gap-2.5 ${
                      isCurrent
                        ? 'bg-[#E8F0FE] border-[#1A73E8] text-[#1A73E8]'
                        : 'bg-[#F8F9FA] border-[#E8EAED] text-[#3C4043] hover:bg-white hover:border-[#DADCE0]'
                    }`}
                  >
                    {/* Checkbox for PDF batch export inclusion */}
                    <button
                      type="button"
                      onClick={(e) => toggleFindingSelection(f.id, e)}
                      className="mt-0.5 text-[#5F6368] hover:text-[#1A73E8] transition-colors shrink-0"
                      title={isChecked ? 'Included in PDF export' : 'Click to include in PDF export'}
                    >
                      {isChecked ? (
                        <CheckSquare className="w-4 h-4 text-[#1A73E8]" />
                      ) : (
                        <Square className="w-4 h-4 text-[#9AA0A6]" />
                      )}
                    </button>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-bold text-[#5F6368]">
                          Page {f.page} · {f.section}
                        </span>
                        {isChecked && (
                          <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-blue-100 text-blue-700">
                            PDF Included
                          </span>
                        )}
                      </div>
                      <div className="font-semibold text-[#1F1F1F] mb-0.5 truncate">
                        {f.title}
                      </div>
                      <div className="text-[11px] text-[#5F6368] line-clamp-1">
                        {f.summary}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Selection Summary Pill */}
            <div className="pt-2 border-t border-[#F1F3F4] flex items-center justify-between text-xs text-[#5F6368]">
              <span>{selectedFindingIds.size} of {docFindings.length} selected for export</span>
              <button
                onClick={() => setIsExportModalOpen(true)}
                className="text-[#1A73E8] font-semibold hover:underline inline-flex items-center gap-1 cursor-pointer"
              >
                <Download className="w-3 h-3" />
                <span>Export PDF</span>
              </button>
            </div>
          </div>

          {/* Quick Key Dates / Deadlines */}
          <div className="bg-white rounded-2xl border border-[#E0E2E6] p-5 shadow-xs space-y-3">
            <div className="font-semibold text-xs text-[#5F6368] flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-[#1A73E8]" />
              <span>Key timelines mentioned in document</span>
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2 rounded-lg bg-[#F8F9FA] border border-[#E8EAED]">
                <span className="text-[#444746]">Notice requirement</span>
                <span className="font-semibold text-[#1F1F1F]">{document.keyTerms.noticePeriod || '90 Days'}</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-[#F8F9FA] border border-[#E8EAED]">
                <span className="text-[#444746]">Review period</span>
                <span className="font-semibold text-[#1F1F1F]">{document.keyTerms.probationPeriod || 'Standard review'}</span>
              </div>
              {document.keyTerms.bondOrLockIn && (
                <div className="flex items-center justify-between p-2 rounded-lg bg-[#F8F9FA] border border-[#E8EAED]">
                  <span className="text-[#444746]">Lock-in / Bond</span>
                  <span className="font-semibold text-[#1F1F1F]">{document.keyTerms.bondOrLockIn}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: Live Friendly Draft Preview & Actions */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-[#E0E2E6] p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#F1F3F4] pb-3">
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-[#1A73E8]" />
              <span className="font-display font-bold text-sm text-[#1F1F1F]">
                Ready-to-send polite message
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                id="email-recipient-select"
                value={recipientRole}
                onChange={(e) => handleRecipientChange(e.target.value)}
                className="bg-[#F8F9FA] border border-[#DADCE0] text-xs font-medium rounded-lg px-2.5 py-1.5 text-[#3C4043] cursor-pointer"
              >
                <option value="HR / Company">To: HR / Employer</option>
                <option value="Landlord / Owner">To: Landlord / Owner</option>
                <option value="Society Committee">To: Society Committee</option>
                <option value="Client / Partner">To: Client / Partner</option>
                <option value="Legal Counsel">To: Legal Counsel</option>
              </select>

              <button
                id="copy-email-btn"
                onClick={handleCopyEmail}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#F1F3F4] hover:bg-[#E8EAED] text-[#1F1F1F] text-xs font-semibold transition-colors cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5 text-[#5F6368]" />}
                <span>{copied ? 'Copied!' : 'Copy'}</span>
              </button>

              <button
                id="export-current-card-btn"
                onClick={() => handleExportPdf(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1A73E8] hover:bg-[#1557B0] text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                title="Download this specific drafted message as PDF"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export PDF</span>
              </button>
            </div>
          </div>

          {/* Finding Reference Badge */}
          <div className="p-2.5 rounded-xl bg-[#F8F9FA] border border-[#E8EAED] flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="font-bold text-[#1A73E8]">Page {selectedFinding.page} · {selectedFinding.section}</span>
              <span className="text-[#5F6368]">|</span>
              <span className="font-semibold text-[#1F1F1F] truncate">{selectedFinding.title}</span>
            </div>
            <button
              onClick={() => toggleFindingSelection(selectedFinding.id)}
              className="text-[11px] font-semibold text-[#1A73E8] hover:underline cursor-pointer"
            >
              {selectedFindingIds.has(selectedFinding.id) ? 'Included in batch export ✓' : '+ Add to batch export'}
            </button>
          </div>

          {/* Subject Line */}
          <div className="p-3 rounded-xl bg-[#F8F9FA] border border-[#DADCE0] space-y-1">
            <div className="text-[10px] uppercase font-bold tracking-wider text-[#5F6368]">
              Subject
            </div>
            <div className="font-semibold text-xs text-[#1F1F1F]">
              {currentEmailDraft.subject}
            </div>
          </div>

          {/* Body */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[10px] uppercase font-bold tracking-wider text-[#5F6368]">
              <span>Message text (feel free to edit)</span>
              <span className="font-normal text-[#70757A] lowercase">Edits will reflect in exported PDF</span>
            </div>
            <textarea
              id="email-draft-body-textarea"
              rows={12}
              value={currentEmailDraft.body}
              onChange={(e) => handleBodyChange(e.target.value)}
              className="w-full bg-[#F8F9FA] focus:bg-white p-3.5 rounded-xl border border-[#DADCE0] focus:border-[#1A73E8] outline-none text-xs text-[#202124] leading-relaxed font-sans transition-all resize-y"
            />
          </div>

          {/* Exact Quote Box */}
          {selectedFinding.evidence && (
            <div className="p-3 rounded-xl bg-[#F8F9FA] border border-[#E0E2E6] space-y-1">
              <div className="text-[10px] uppercase font-bold tracking-wider text-[#1A73E8] flex items-center gap-1">
                <FileText className="w-3 h-3" />
                <span>Exact Clause from {document.title} (Page {selectedFinding.page})</span>
              </div>
              <p className="text-xs text-[#3C4043] italic font-mono bg-white p-2.5 rounded-lg border border-[#E8EAED]">
                "{selectedFinding.evidence}"
              </p>
            </div>
          )}

          {/* Reassurance Footer */}
          <div className="p-3.5 rounded-xl bg-[#E8F0FE] border border-[#D2E3FC] text-xs text-[#1A73E8] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#1A73E8] shrink-0" />
              <span>Asking clarifying questions politely before signing is completely standard and expected.</span>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* EXPORT CONFIGURATION & PREVIEW MODAL */}
      {/* ========================================================================= */}
      {isExportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl border border-[#DADCE0] shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-6 border-b border-[#F1F3F4] flex items-center justify-between bg-[#F8F9FA]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#E8F0FE] text-[#1A73E8] flex items-center justify-center">
                  <FileDown className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-lg text-[#1F1F1F]">
                    Export Clarification Document (PDF)
                  </h3>
                  <p className="text-xs text-[#5F6368]">
                    Generate a formatted multi-page PDF with selected clause findings and drafted inquiries.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsExportModalOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-[#5F6368] hover:bg-[#E8EAED] transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6 overflow-y-auto flex-1 text-xs">
              {/* Reviewer / Export Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="font-semibold text-[#1F1F1F]">Prepared By / Sender Name</label>
                  <input
                    type="text"
                    value={reviewerName}
                    onChange={(e) => setReviewerName(e.target.value)}
                    placeholder="Your Name or Document Reviewer"
                    className="w-full px-3 py-2 bg-[#F8F9FA] border border-[#DADCE0] rounded-xl text-xs focus:bg-white focus:border-[#1A73E8] outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-[#1F1F1F]">Global Recipient Role</label>
                  <select
                    value={recipientRole}
                    onChange={(e) => handleRecipientChange(e.target.value)}
                    className="w-full px-3 py-2 bg-[#F8F9FA] border border-[#DADCE0] rounded-xl text-xs focus:bg-white focus:border-[#1A73E8] outline-none cursor-pointer"
                  >
                    <option value="HR / Company">HR / Employer</option>
                    <option value="Landlord / Owner">Landlord / Owner</option>
                    <option value="Society Committee">Society Committee</option>
                    <option value="Client / Partner">Client / Partner</option>
                    <option value="Legal Counsel">Legal Counsel</option>
                  </select>
                </div>
              </div>

              {/* Findings Checklist */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-[#1F1F1F]">
                    Select Findings to Include ({selectedFindingIds.size} of {docFindings.length})
                  </label>
                  <div className="flex gap-2 text-[11px]">
                    <button
                      onClick={selectAllFindings}
                      className="text-[#1A73E8] font-semibold hover:underline cursor-pointer"
                    >
                      Select All
                    </button>
                    <span className="text-gray-300">·</span>
                    <button
                      onClick={selectOnlyCurrentFinding}
                      className="text-[#5F6368] font-semibold hover:underline cursor-pointer"
                    >
                      Current Only
                    </button>
                  </div>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto border border-[#E0E2E6] rounded-xl p-2 bg-[#F8F9FA]">
                  {docFindings.map((f) => {
                    const isChecked = selectedFindingIds.has(f.id);
                    return (
                      <label
                        key={f.id}
                        className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${
                          isChecked ? 'bg-white border border-[#D2E3FC]' : 'hover:bg-gray-100'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleFindingSelection(f.id)}
                          className="w-4 h-4 text-[#1A73E8] rounded border-gray-300 focus:ring-[#1A73E8]"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-[#1F1F1F] truncate">{f.title}</span>
                            <span className="text-[10px] text-[#5F6368] shrink-0 font-medium">
                              Page {f.page} · {f.section}
                            </span>
                          </div>
                          <p className="text-[11px] text-[#5F6368] truncate">{f.summary}</p>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Formatting & Content Options */}
              <div className="space-y-2">
                <label className="font-semibold text-[#1F1F1F]">PDF Document Options</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label className="flex items-center gap-2 p-2.5 rounded-xl border border-[#E8EAED] bg-white cursor-pointer hover:bg-[#F8F9FA]">
                    <input
                      type="checkbox"
                      checked={includeEvidence}
                      onChange={(e) => setIncludeEvidence(e.target.checked)}
                      className="w-4 h-4 text-[#1A73E8] rounded border-gray-300"
                    />
                    <div>
                      <div className="font-medium text-[#1F1F1F]">Include Contract Clause Quotes</div>
                      <div className="text-[10px] text-[#5F6368]">Exact cited text from document</div>
                    </div>
                  </label>

                  <label className="flex items-center gap-2 p-2.5 rounded-xl border border-[#E8EAED] bg-white cursor-pointer hover:bg-[#F8F9FA]">
                    <input
                      type="checkbox"
                      checked={includeTimelines}
                      onChange={(e) => setIncludeTimelines(e.target.checked)}
                      className="w-4 h-4 text-[#1A73E8] rounded border-gray-300"
                    />
                    <div>
                      <div className="font-medium text-[#1F1F1F]">Include Key Timelines Summary</div>
                      <div className="text-[10px] text-[#5F6368]">Notice & review period cards</div>
                    </div>
                  </label>

                  <label className="flex items-center gap-2 p-2.5 rounded-xl border border-[#E8EAED] bg-white cursor-pointer hover:bg-[#F8F9FA]">
                    <input
                      type="checkbox"
                      checked={includeDisclaimer}
                      onChange={(e) => setIncludeDisclaimer(e.target.checked)}
                      className="w-4 h-4 text-[#1A73E8] rounded border-gray-300"
                    />
                    <div>
                      <div className="font-medium text-[#1F1F1F]">Professional Principles & Safety Note</div>
                      <div className="text-[10px] text-[#5F6368]">Clarification guidelines note</div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Optional Custom Note */}
              <div className="space-y-1.5">
                <label className="font-semibold text-[#1F1F1F] flex items-center gap-1.5">
                  <span>Custom Consultation Note or Memo</span>
                  <span className="text-[10px] font-normal text-[#5F6368]">(Optional)</span>
                </label>
                <input
                  type="text"
                  value={customExportNote}
                  onChange={(e) => setCustomExportNote(e.target.value)}
                  placeholder="e.g., Follow up by Friday or review with team before signing."
                  className="w-full px-3 py-2 bg-[#F8F9FA] border border-[#DADCE0] rounded-xl text-xs focus:bg-white focus:border-[#1A73E8] outline-none"
                />
              </div>

              {/* Document Summary Info */}
              <div className="p-3.5 rounded-2xl bg-[#E8F0FE] border border-[#D2E3FC] flex items-start gap-2.5">
                <Info className="w-4 h-4 text-[#1A73E8] shrink-0 mt-0.5" />
                <div className="text-[11px] text-[#1A73E8] leading-relaxed">
                  The PDF is generated directly with vector typography, ClauseTrace header branding, structured page numbering, and formatted email text ready to send or file.
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-[#F1F3F4] flex items-center justify-between bg-[#F8F9FA]">
              <button
                onClick={() => setIsExportModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-[#5F6368] hover:bg-[#E8EAED] transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                id="modal-download-pdf-btn"
                onClick={() => handleExportPdf(false)}
                disabled={isExporting || selectedFindingIds.size === 0}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#1A73E8] hover:bg-[#1557B0] disabled:bg-gray-300 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>
                  {isExporting ? 'Generating PDF...' : `Download Formatted PDF (${selectedFindingIds.size})`}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
