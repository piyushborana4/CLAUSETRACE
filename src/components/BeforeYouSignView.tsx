import React, { useState } from 'react';
import { 
  CheckSquare, 
  Square, 
  ExternalLink, 
  Mail, 
  CheckCircle2, 
  Plus,
  Info,
  ShieldCheck,
  Upload,
  Sparkles,
  FileText,
  Trash2
} from 'lucide-react';
import { LegalDocument, ChecklistItem } from '../types';
import { ActiveTab } from './Navigation';

interface BeforeYouSignViewProps {
  document: LegalDocument | null;
  setActiveTab: (tab: ActiveTab) => void;
  checklist: ChecklistItem[];
  onToggleItem: (id: string) => void;
  onDeleteItem?: (id: string) => void;
  onDraftEmailFromChecklist: (item: ChecklistItem) => void;
  onOpenUpload?: () => void;
  onSwitchToDemo?: () => void;
}

export const BeforeYouSignView: React.FC<BeforeYouSignViewProps> = ({
  document,
  setActiveTab,
  checklist,
  onToggleItem,
  onDeleteItem,
  onDraftEmailFromChecklist,
  onOpenUpload,
  onSwitchToDemo,
}) => {
  const [filter, setFilter] = useState<'ALL' | 'CONFIRM' | 'CLARIFY' | 'REMEMBER'>('ALL');
  const [customNote, setCustomNote] = useState<string>('');
  const [extraItems, setExtraItems] = useState<ChecklistItem[]>([]);

  if (!document) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-16 text-center space-y-6">
        <div className="w-16 h-16 rounded-3xl bg-[#E8F0FE] text-[#1A73E8] flex items-center justify-center mx-auto shadow-xs">
          <CheckSquare className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h2 className="font-display font-bold text-2xl text-[#1F1F1F]">
            Before you sign checklist
          </h2>
          <p className="text-sm text-[#5F6368] leading-relaxed max-w-md mx-auto">
            Upload your agreement or notice to generate a personalized verification checklist before signing or responding.
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

  const allItems = [...checklist, ...extraItems];
  const completedCount = allItems.filter(c => c.completed).length;
  const totalCount = allItems.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const handleAddCustomNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customNote.trim()) return;
    const newItem: ChecklistItem = {
      id: `custom-chk-${Date.now()}`,
      text: customNote.trim(),
      category: 'Things to remember',
      completed: false,
    };
    setExtraItems(prev => [...prev, newItem]);
    setCustomNote('');
  };

  const handleDelete = (id: string) => {
    // Check if in extraItems
    if (extraItems.some(i => i.id === id)) {
      setExtraItems(prev => prev.filter(i => i.id !== id));
    } else if (onDeleteItem) {
      onDeleteItem(id);
    }
  };

  const categorizeItem = (item: ChecklistItem): 'CONFIRM' | 'CLARIFY' | 'REMEMBER' => {
    const text = (item.text + ' ' + item.category).toLowerCase();
    if (text.includes('clarif') || text.includes('written') || text.includes('not found') || text.includes('missing')) {
      return 'CLARIFY';
    }
    if (text.includes('confirm') || text.includes('verify') || text.includes('salary') || text.includes('rent') || text.includes('amount')) {
      return 'CONFIRM';
    }
    return 'REMEMBER';
  };

  const filteredItems = allItems.filter(item => {
    if (filter === 'ALL') return true;
    return categorizeItem(item) === filter;
  });

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-2xl sm:text-3xl text-[#1F1F1F]">
            Before you sign or accept.
          </h1>
          <p className="text-sm text-[#5F6368] mt-1.5">
            A simple safety checklist based on what is in your document. Check off items as you verify them.
          </p>
        </div>

        {/* Progress pill */}
        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#E8F0FE] text-[#1A73E8] text-xs font-semibold shrink-0">
          <CheckSquare className="w-4 h-4" />
          <span>{completedCount} of {totalCount} checked ({progressPercent}%)</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-[#E0E2E6] h-2 rounded-full overflow-hidden">
        <div 
          className="bg-[#1A73E8] h-full transition-all duration-300"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* 3 Human Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        {[
          { label: `All checks (${totalCount})`, value: 'ALL' },
          { label: 'Things to confirm', value: 'CONFIRM' },
          { label: 'Things to clarify', value: 'CLARIFY' },
          { label: 'Things to remember', value: 'REMEMBER' },
        ].map((tab) => (
          <button
            key={tab.value}
            onClick={() => setFilter(tab.value as any)}
            className={`text-xs font-semibold px-3.5 py-1.5 rounded-full transition-colors cursor-pointer ${
              filter === tab.value
                ? 'bg-[#1A73E8] text-white'
                : 'bg-white border border-[#DADCE0] text-[#444746] hover:bg-[#F1F3F4]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Checklist Items List */}
      <div className="space-y-3">
        {filteredItems.map((item) => {
          const cat = categorizeItem(item);
          const badgeText = cat === 'CONFIRM' ? 'Confirm' : cat === 'CLARIFY' ? 'Clarify' : 'Remember';
          const badgeStyle = cat === 'CLARIFY' 
            ? 'bg-[#FEF7E0] text-[#B06000]' 
            : cat === 'CONFIRM' 
            ? 'bg-[#E8F0FE] text-[#1A73E8]' 
            : 'bg-[#F1F3F4] text-[#5F6368]';

          return (
            <div
              key={item.id}
              id={`chk-item-${item.id}`}
              className={`bg-white rounded-2xl border p-4.5 transition-all flex items-start justify-between gap-4 shadow-xs ${
                item.completed ? 'border-[#CEEAD6] bg-[#F9FDF9]' : 'border-[#E0E2E6]'
              }`}
            >
              <div className="flex items-start gap-3 flex-1">
                {/* Checkbox */}
                <button
                  onClick={() => onToggleItem(item.id)}
                  className={`mt-0.5 p-1 rounded-lg transition-colors cursor-pointer ${
                    item.completed ? 'text-[#137333]' : 'text-[#BDC1C6] hover:text-[#1A73E8]'
                  }`}
                  title={item.completed ? 'Mark uncompleted' : 'Mark done'}
                >
                  {item.completed ? (
                    <CheckSquare className="w-5 h-5 text-[#137333]" />
                  ) : (
                    <Square className="w-5 h-5" />
                  )}
                </button>

                {/* Text & Evidence link */}
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md ${badgeStyle}`}>
                      {badgeText}
                    </span>
                    {item.page && (
                      <span className="text-[11px] font-semibold text-[#1A73E8]">
                        Page {item.page} {item.section ? `· ${item.section}` : ''}
                      </span>
                    )}
                  </div>

                  <p className={`text-sm leading-relaxed ${
                    item.completed ? 'line-through text-[#70757A]' : 'font-medium text-[#1F1F1F]'
                  }`}>
                    {item.text}
                  </p>
                </div>
              </div>

              {/* Quick Actions for this item */}
              <div className="flex items-center gap-1.5 shrink-0 self-center sm:self-start">
                {item.page && (
                  <button
                    onClick={() => setActiveTab('xray')}
                    className="flex items-center gap-1 text-xs font-semibold text-[#1A73E8] hover:text-[#1557B0] p-1.5 rounded-lg hover:bg-[#F1F3F4] cursor-pointer"
                    title="See in document"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">See in doc</span>
                  </button>
                )}

                <button
                  onClick={() => onDraftEmailFromChecklist(item)}
                  className="flex items-center gap-1 text-xs font-semibold text-[#1A73E8] hover:text-[#1557B0] p-1.5 rounded-lg hover:bg-[#F1F3F4] cursor-pointer"
                  title="Draft question"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Draft note</span>
                </button>

                <button
                  onClick={() => handleDelete(item.id)}
                  className="p-1.5 rounded-lg text-[#70757A] hover:text-[#D93025] hover:bg-[#FCE8E6] transition-colors cursor-pointer"
                  title="Delete checklist item"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Custom Note / Reminder */}
      <form onSubmit={handleAddCustomNote} className="flex gap-2">
        <input
          type="text"
          value={customNote}
          onChange={(e) => setCustomNote(e.target.value)}
          placeholder="Add your own reminder or question to verify before signing..."
          className="flex-1 bg-white border border-[#DADCE0] focus:border-[#1A73E8] rounded-xl px-4 py-2.5 text-xs text-[#1F1F1F] outline-none"
        />
        <button
          type="submit"
          disabled={!customNote.trim()}
          className="flex items-center gap-1 px-4 py-2.5 rounded-xl bg-[#1A73E8] hover:bg-[#1557B0] disabled:opacity-40 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add item</span>
        </button>
      </form>

      {/* Reassurance Notice */}
      <div className="p-4 rounded-xl bg-[#F8F9FA] border border-[#DADCE0] text-xs text-[#5F6368] leading-relaxed flex items-start gap-2.5">
        <ShieldCheck className="w-4 h-4 text-[#137333] shrink-0 mt-0.5" />
        <div>
          <strong>Helpful reminder:</strong> Never sign or accept any document until all ambiguous points and verbal promises are confirmed in writing.
        </div>
      </div>
    </div>
  );
};
