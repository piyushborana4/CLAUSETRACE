import React from 'react';
import { 
  Upload, 
  ArrowRight, 
  FileText, 
  CheckCircle2, 
  ShieldCheck,
  HelpCircle,
  FileSearch,
  Mail,
  CheckSquare,
  Sparkles,
  TrendingUp,
  AlertCircle,
  FileCheck2,
  FolderOpen
} from 'lucide-react';
import { LegalDocument, UserProfile, ChecklistItem } from '../types';
import { ActiveTab } from './Navigation';

interface HomeViewProps {
  onOpenUpload: () => void;
  setActiveTab: (tab: ActiveTab) => void;
  userDocuments: LegalDocument[];
  demoDocuments: LegalDocument[];
  activeDoc: LegalDocument | null;
  currentUser: UserProfile;
  checklist?: ChecklistItem[];
  onSelectDoc: (doc: LegalDocument) => void;
  onSwitchToDemo: () => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  onOpenUpload,
  setActiveTab,
  userDocuments,
  demoDocuments,
  activeDoc,
  currentUser,
  checklist = [],
  onSelectDoc,
  onSwitchToDemo,
}) => {
  const isDemoMode = currentUser.accountType === 'demo';

  // Calculate User Statistics
  const relevantDocs = isDemoMode
    ? demoDocuments
    : (userDocuments.length > 0 ? userDocuments : demoDocuments);

  const totalDocsAnalyzed = isDemoMode ? demoDocuments.length : userDocuments.length;

  // Aggregate checklist items (from props or from all user docs)
  const activeChecklist = checklist.length > 0 ? checklist : (activeDoc?.checklist || []);
  const completedChecklistCount = activeChecklist.filter(item => item.completed).length;
  const totalChecklistCount = activeChecklist.length;
  const checklistPercentage = totalChecklistCount > 0 
    ? Math.round((completedChecklistCount / totalChecklistCount) * 100) 
    : 0;

  // Aggregate findings across analyzed documents
  const totalFindingsAcrossDocs = relevantDocs.reduce(
    (sum, doc) => sum + (Array.isArray(doc.findings) ? doc.findings.length : 0),
    0
  );

  const attentionItemsCount = relevantDocs.reduce(
    (sum, doc) => sum + (doc.keyTerms?.attentionItemsCount || 0),
    0
  );

  return (
    <div className="max-w-4xl mx-auto px-6 py-10 space-y-10">
      {/* Primary Hero & Main Action Surface */}
      <div className="text-center max-w-2xl mx-auto space-y-6">
        {/* Subtle Pill */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/80 border border-slate-200/80 shadow-xs text-xs font-semibold text-[#1F1F1F]">
          <span className="w-2 h-2 rounded-full bg-[#1A73E8] animate-pulse" />
          <span>Grounded legal document assistant</span>
        </div>

        <h1 className="font-display text-4xl sm:text-5xl font-bold tracking-tight text-[#1F1F1F] leading-tight">
          Understand your legal documents.
        </h1>
        
        <p className="text-base sm:text-lg text-[#5F6368] leading-relaxed max-w-xl mx-auto">
          Upload an agreement, notice, letter, contract, or other legal document. CLAUSETRACE explains what it says, highlights what matters, and shows you where the information came from.
        </p>

        {/* Central Floating Upload Surface */}
        <div 
          onClick={onOpenUpload}
          className="relative group mt-6 p-8 rounded-3xl bg-white/90 backdrop-blur-md border-2 border-dashed border-[#DADCE0] hover:border-[#1A73E8] hover:bg-[#F8F9FA]/80 shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer text-center"
        >
          {/* Floating Contextual Tags */}
          <div className="hidden sm:flex items-center justify-between absolute -top-3.5 left-6 right-6 pointer-events-none">
            <span className="bg-[#E8F0FE] text-[#1A73E8] border border-[#D2E3FC] px-3 py-0.5 rounded-full text-[11px] font-bold shadow-xs">
              📄 Agreement
            </span>
            <span className="bg-[#FEF7E0] text-[#B06000] border border-[#FEEFC3] px-3 py-0.5 rounded-full text-[11px] font-bold shadow-xs">
              📬 Notice
            </span>
            <span className="bg-[#E6F4EA] text-[#137333] border border-[#CEEAD6] px-3 py-0.5 rounded-full text-[11px] font-bold shadow-xs">
              📝 Contract
            </span>
            <span className="bg-[#F1F3F4] text-[#444746] border border-[#E0E2E6] px-3 py-0.5 rounded-full text-[11px] font-bold shadow-xs">
              ✉️ Letter
            </span>
          </div>

          <div className="w-14 h-14 rounded-2xl bg-[#E8F0FE] text-[#1A73E8] flex items-center justify-center mx-auto mb-4 group-hover:scale-105 transition-transform">
            <Upload className="w-7 h-7" />
          </div>

          <div className="space-y-1.5">
            <div className="text-lg font-display font-bold text-[#1F1F1F]">
              Drop your document here, or click to upload
            </div>
            <p className="text-xs text-[#5F6368]">
              PDF, scanned files, agreements, leases, offer letters, or notices
            </p>
          </div>

          <div className="pt-4 flex items-center justify-center">
            <span className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-[#1A73E8] group-hover:bg-[#1557B0] text-white text-xs font-semibold shadow-xs transition-colors">
              <Upload className="w-4 h-4" />
              <span>+ Upload a document</span>
            </span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* USER STATISTICS & ACTIVITY SUMMARY CARD */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-3xl border border-[#E0E2E6] p-6 sm:p-7 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#F1F3F4] pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#E8F0FE] text-[#1A73E8] flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-display font-bold text-base text-[#1F1F1F]">
                Your Review & Analysis Summary
              </h2>
              <p className="text-xs text-[#5F6368]">
                Real-time activity and readiness overview across your legal documents.
              </p>
            </div>
          </div>

          {activeDoc && (
            <div className="flex items-center gap-1.5 self-start sm:self-auto px-3 py-1 rounded-full bg-[#F8F9FA] border border-[#DADCE0] text-[11px] text-[#3C4043] font-medium">
              <span className="text-[#5F6368]">Active:</span>
              <span className="font-bold text-[#1F1F1F] truncate max-w-[150px]">{activeDoc.title}</span>
            </div>
          )}
        </div>

        {/* 3 Core Metric Tiles */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Stat 1: Total Documents Analyzed */}
          <div 
            onClick={() => setActiveTab('my_docs')}
            className="group p-4 rounded-2xl bg-[#F8F9FA] hover:bg-white border border-[#E8EAED] hover:border-[#1A73E8] hover:shadow-xs transition-all cursor-pointer space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-[#E8F0FE] text-[#1A73E8] flex items-center justify-center group-hover:scale-105 transition-transform">
                <FileText className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold text-[#1A73E8] uppercase tracking-wider group-hover:underline inline-flex items-center gap-0.5">
                View <ArrowRight className="w-3 h-3" />
              </span>
            </div>

            <div>
              <div className="text-2xl sm:text-3xl font-display font-bold text-[#1F1F1F]">
                {totalDocsAnalyzed}
              </div>
              <div className="text-xs font-semibold text-[#3C4043] mt-0.5">
                Total Documents Analyzed
              </div>
              <p className="text-[11px] text-[#5F6368] mt-1">
                {isDemoMode ? 'Demo walkthrough files' : `${userDocuments.length} uploaded files in vault`}
              </p>
            </div>
          </div>

          {/* Stat 2: Checklist Items Completed */}
          <div 
            onClick={() => setActiveTab('checklist')}
            className="group p-4 rounded-2xl bg-[#F8F9FA] hover:bg-white border border-[#E8EAED] hover:border-[#137333] hover:shadow-xs transition-all cursor-pointer space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-[#E6F4EA] text-[#137333] flex items-center justify-center group-hover:scale-105 transition-transform">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold text-[#137333] uppercase tracking-wider group-hover:underline inline-flex items-center gap-0.5">
                Checklist <ArrowRight className="w-3 h-3" />
              </span>
            </div>

            <div>
              <div className="text-2xl sm:text-3xl font-display font-bold text-[#1F1F1F] flex items-baseline gap-1.5">
                <span>{completedChecklistCount}</span>
                <span className="text-xs text-[#5F6368] font-normal">/ {totalChecklistCount || 0}</span>
              </div>
              <div className="text-xs font-semibold text-[#3C4043] mt-0.5">
                Checklist Items Completed
              </div>
              
              {/* Progress bar */}
              <div className="mt-2 w-full bg-[#E8EAED] h-1.5 rounded-full overflow-hidden">
                <div 
                  className="bg-[#137333] h-full rounded-full transition-all duration-500"
                  style={{ width: `${checklistPercentage}%` }}
                />
              </div>
            </div>
          </div>

          {/* Stat 3: Findings Drafted */}
          <div 
            onClick={() => setActiveTab('actions')}
            className="group p-4 rounded-2xl bg-[#F8F9FA] hover:bg-white border border-[#E8EAED] hover:border-[#1A73E8] hover:shadow-xs transition-all cursor-pointer space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-[#FEF7E0] text-[#B06000] flex items-center justify-center group-hover:scale-105 transition-transform">
                <Mail className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold text-[#B06000] uppercase tracking-wider group-hover:underline inline-flex items-center gap-0.5">
                Drafts <ArrowRight className="w-3 h-3" />
              </span>
            </div>

            <div>
              <div className="text-2xl sm:text-3xl font-display font-bold text-[#1F1F1F]">
                {totalFindingsAcrossDocs}
              </div>
              <div className="text-xs font-semibold text-[#3C4043] mt-0.5">
                Findings Drafted
              </div>
              <p className="text-[11px] text-[#5F6368] mt-1">
                Polite email inquiries & clause notes
              </p>
            </div>
          </div>
        </div>

        {/* Supplementary Summary Banner */}
        <div className="p-3.5 rounded-2xl bg-[#F8F9FA] border border-[#E8EAED] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#1A73E8] shrink-0" />
            <span className="text-[#3C4043]">
              <strong>{attentionItemsCount} Attention Items</strong> highlighted for review across agreements.
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setActiveTab('xray')}
              className="text-[#1A73E8] font-semibold hover:underline cursor-pointer"
            >
              Explore X-Ray →
            </button>
            <span className="text-gray-300">·</span>
            <button
              onClick={() => setActiveTab('actions')}
              className="text-[#1A73E8] font-semibold hover:underline cursor-pointer"
            >
              Action Center →
            </button>
          </div>
        </div>
      </div>

      {/* If in Demo Mode: Show clean Demo Walkthrough Documents */}
      {isDemoMode ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display font-bold text-lg text-[#1F1F1F]">
                Demo Walkthrough Documents
              </h2>
              <p className="text-xs text-[#5F6368]">
                Select any example agreement below to demonstrate analysis capabilities.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {demoDocuments.map((doc) => (
              <div
                key={doc.id}
                onClick={() => {
                  onSelectDoc(doc);
                  setActiveTab('xray');
                }}
                className="p-4 rounded-2xl bg-white border border-[#E0E2E6] hover:border-[#1A73E8] hover:shadow-xs transition-all cursor-pointer flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#F1F3F4] group-hover:bg-[#E8F0FE] text-[#1A73E8] flex items-center justify-center shrink-0 transition-colors">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-semibold text-xs text-[#1F1F1F] group-hover:text-[#1A73E8] truncate transition-colors">
                      {doc.title}
                    </div>
                    <div className="text-[11px] text-[#5F6368]">
                      {doc.documentType} · {doc.pageCount} pages
                    </div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-[#BDC1C6] group-hover:text-[#1A73E8] shrink-0 transition-colors" />
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* If in Personal Mode: User's Recent Uploaded Documents */
        userDocuments.length > 0 && (
          <div className="rounded-2xl border border-[#DADCE0] bg-white p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-2xs">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-[#E8F0FE] text-[#1A73E8] flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-[#1A73E8] text-white px-2 py-0.5 rounded-full">
                    Latest Document
                  </span>
                  <span className="text-xs text-[#5F6368]">Uploaded recently</span>
                </div>
                <h3 className="font-display font-bold text-base text-[#1F1F1F] mt-0.5">
                  {userDocuments[0].title}
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab('my_docs')}
                className="px-3.5 py-2 rounded-xl bg-[#F8F9FA] border border-[#DADCE0] text-xs font-semibold text-[#1F1F1F] hover:bg-[#F1F3F4] transition-colors cursor-pointer"
              >
                All Documents ({userDocuments.length})
              </button>
              <button
                onClick={() => {
                  onSelectDoc(userDocuments[0]);
                  setActiveTab('xray');
                }}
                className="px-4 py-2 rounded-xl bg-[#1A73E8] text-white text-xs font-semibold hover:bg-[#1557B0] transition-colors inline-flex items-center gap-1.5 cursor-pointer"
              >
                <span>Open document</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )
      )}

      {/* What Can CLAUSETRACE Help With? (4 Core Pillars) */}
      <div className="space-y-4">
        <div className="text-center space-y-1">
          <h2 className="font-display font-bold text-xl text-[#1F1F1F]">
            What can CLAUSETRACE help with?
          </h2>
          <p className="text-xs text-[#5F6368]">
            Simple answers for common situations, with citations to exact clauses.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div 
            onClick={() => setActiveTab('xray')}
            className="p-5 rounded-2xl bg-white border border-[#E0E2E6] hover:border-[#1A73E8] hover:shadow-xs transition-all cursor-pointer group space-y-2.5"
          >
            <div className="w-9 h-9 rounded-xl bg-[#E8F0FE] text-[#1A73E8] flex items-center justify-center group-hover:scale-105 transition-transform">
              <FileSearch className="w-5 h-5" />
            </div>
            <div className="font-display font-bold text-sm text-[#1F1F1F] group-hover:text-[#1A73E8]">
              What matters
            </div>
            <p className="text-xs text-[#5F6368] leading-relaxed">
              Find notice periods, lock-in clauses, hidden fees, and critical deadlines in seconds.
            </p>
          </div>

          <div 
            onClick={() => setActiveTab('ask')}
            className="p-5 rounded-2xl bg-white border border-[#E0E2E6] hover:border-[#1A73E8] hover:shadow-xs transition-all cursor-pointer group space-y-2.5"
          >
            <div className="w-9 h-9 rounded-xl bg-[#E8F0FE] text-[#1A73E8] flex items-center justify-center group-hover:scale-105 transition-transform">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div className="font-display font-bold text-sm text-[#1F1F1F] group-hover:text-[#1A73E8]">
              Ask a question
            </div>
            <p className="text-xs text-[#5F6368] leading-relaxed">
              Ask plain English questions like "Can my landlord increase rent during the year?"
            </p>
          </div>

          <div 
            onClick={() => setActiveTab('checklist')}
            className="p-5 rounded-2xl bg-white border border-[#E0E2E6] hover:border-[#1A73E8] hover:shadow-xs transition-all cursor-pointer group space-y-2.5"
          >
            <div className="w-9 h-9 rounded-xl bg-[#E8F0FE] text-[#1A73E8] flex items-center justify-center group-hover:scale-105 transition-transform">
              <CheckSquare className="w-5 h-5" />
            </div>
            <div className="font-display font-bold text-sm text-[#1F1F1F] group-hover:text-[#1A73E8]">
              Before you agree
            </div>
            <p className="text-xs text-[#5F6368] leading-relaxed">
              Step-by-step checklist of key items to verify before signing or responding.
            </p>
          </div>

          <div 
            onClick={() => setActiveTab('actions')}
            className="p-5 rounded-2xl bg-white border border-[#E0E2E6] hover:border-[#1A73E8] hover:shadow-xs transition-all cursor-pointer group space-y-2.5"
          >
            <div className="w-9 h-9 rounded-xl bg-[#E8F0FE] text-[#1A73E8] flex items-center justify-center group-hover:scale-105 transition-transform">
              <Mail className="w-5 h-5" />
            </div>
            <div className="font-display font-bold text-sm text-[#1F1F1F] group-hover:text-[#1A73E8]">
              Draft a message
            </div>
            <p className="text-xs text-[#5F6368] leading-relaxed">
              Generate polite, professional emails to ask for clarifications or propose changes.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
