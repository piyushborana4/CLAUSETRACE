import React, { useState } from 'react';
import { 
  Search, 
  ShieldAlert, 
  HelpCircle, 
  Scale, 
  FileText,
  Building,
  Briefcase,
  Home,
  ShoppingBag,
  Laptop,
  CheckCircle2
} from 'lucide-react';
import { GeneralLegalInfoTopic } from '../types';

interface LegalInfoViewProps {
  initialTopics: GeneralLegalInfoTopic[];
}

export const LegalInfoView: React.FC<LegalInfoViewProps> = ({
  initialTopics,
}) => {
  const [selectedTopic, setSelectedTopic] = useState<GeneralLegalInfoTopic>(
    initialTopics[0]
  );
  const [queryInput, setQueryInput] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [customTopic, setCustomTopic] = useState<GeneralLegalInfoTopic | null>(null);

  const activeTopic = customTopic || selectedTopic;

  const handleSearch = async (q?: string) => {
    const query = (q || queryInput).trim();
    if (!query) return;

    setIsLoading(true);
    try {
      const res = await fetch('/api/legal-info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });
      if (res.ok) {
        const data: GeneralLegalInfoTopic = await res.json();
        setCustomTopic(data);
      }
    } catch (err) {
      console.error('Legal info query error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const GUIDE_CATEGORIES = [
    {
      title: 'Renting an apartment',
      desc: 'Security deposits, notice periods, landlord access',
      icon: Home,
      query: 'What are standard tenant rights regarding security deposits, notice periods, and landlord access?',
    },
    {
      title: 'Starting a job',
      desc: 'Probation periods, non-compete rules, overtime, notice periods',
      icon: Briefcase,
      query: 'What are basic employee rights regarding notice periods, probation, and non-compete clauses?',
    },
    {
      title: 'Housing society rules',
      desc: 'Parking slots, flat renovations, pet rules, visitor access',
      icon: Building,
      query: 'What are member rights in a housing society regarding parking, pet keeping, and maintenance charges?',
    },
    {
      title: 'Freelancing & contracts',
      desc: 'Milestone payment terms, IP ownership, contract cancellation',
      icon: Laptop,
      query: 'What are best practices for freelancers regarding copyright ownership and payment protection?',
    },
    {
      title: 'Consumer rights',
      desc: 'Defective products, return guarantees, refunds, cancellation',
      icon: ShoppingBag,
      query: 'What are consumer rights regarding product refunds, defective services, and unfair cancellation charges?',
    }
  ];

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 space-y-8">
      {/* Title */}
      <div>
        <h1 className="font-display font-bold text-2xl sm:text-3xl text-[#1F1F1F]">
          Everyday legal guides
        </h1>
        <p className="text-sm text-[#5F6368] mt-1.5">
          Simple explanations for common real-world situations. Written in plain words with no complicated legal jargon.
        </p>
      </div>

      {/* Guide Category Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {GUIDE_CATEGORIES.map((cat, idx) => {
          const Icon = cat.icon;
          return (
            <button
              key={idx}
              onClick={() => {
                setQueryInput(cat.query);
                handleSearch(cat.query);
              }}
              className="text-left p-4 rounded-2xl bg-white hover:bg-[#F8F9FA] border border-[#E0E2E6] hover:border-[#1A73E8] transition-all shadow-xs space-y-2 cursor-pointer group"
            >
              <div className="w-8 h-8 rounded-xl bg-[#E8F0FE] text-[#1A73E8] flex items-center justify-center group-hover:bg-[#1A73E8] group-hover:text-white transition-colors">
                <Icon className="w-4 h-4" />
              </div>
              <div>
                <div className="font-display font-semibold text-sm text-[#1F1F1F]">
                  {cat.title}
                </div>
                <p className="text-xs text-[#5F6368] mt-0.5">
                  {cat.desc}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Search Input */}
      <div className="bg-white rounded-2xl border border-[#E0E2E6] p-4 shadow-xs">
        <form 
          onSubmit={(e) => {
            e.preventDefault();
            handleSearch();
          }}
          className="flex items-center gap-2"
        >
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#5F6368] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              id="legal-info-search-input"
              type="text"
              value={queryInput}
              onChange={(e) => setQueryInput(e.target.value)}
              placeholder="Ask a general legal question in plain English (e.g. Can my landlord enter without notice?)"
              className="w-full bg-[#F8F9FA] focus:bg-white pl-10 pr-4 py-3 rounded-xl border border-[#DADCE0] focus:border-[#1A73E8] focus:ring-2 focus:ring-[#E8F0FE] outline-none text-xs text-[#1F1F1F]"
            />
          </div>
          <button
            id="legal-info-submit-btn"
            type="submit"
            disabled={isLoading || !queryInput.trim()}
            className="flex items-center gap-1.5 px-5 py-3 rounded-xl bg-[#1A73E8] hover:bg-[#1557B0] disabled:opacity-50 text-white text-xs font-semibold shadow-xs transition-colors shrink-0 cursor-pointer"
          >
            {isLoading ? 'Searching...' : 'Find Answer'}
          </button>
        </form>
      </div>

      {/* Active Topic Card */}
      {activeTopic && (
        <div className="bg-white rounded-2xl border border-[#E0E2E6] p-6 shadow-xs space-y-6">
          <div className="border-b border-[#F1F3F4] pb-4">
            <span className="text-xs font-semibold text-[#1A73E8] bg-[#E8F0FE] px-3 py-1 rounded-full">
              {activeTopic.category}
            </span>
            <h2 className="font-display font-bold text-xl text-[#1F1F1F] mt-2">
              {activeTopic.query}
            </h2>
          </div>

          {/* Direct Plain Answer */}
          <div className="space-y-1">
            <h3 className="text-xs font-semibold text-[#5F6368]">
              The short answer:
            </h3>
            <p className="text-sm text-[#1F1F1F] leading-relaxed p-4 rounded-xl bg-[#F8F9FA] border border-[#E8EAED]">
              {activeTopic.plainLanguageExplanation}
            </p>
          </div>

          {/* Simple Steps / What usually happens */}
          {activeTopic.generalProcess.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-semibold text-[#5F6368]">
                How this usually works:
              </h3>
              <div className="space-y-2">
                {activeTopic.generalProcess.map((step) => (
                  <div key={step.step} className="flex items-start gap-3 p-3 rounded-xl bg-white border border-[#E8EAED]">
                    <div className="w-5 h-5 rounded-full bg-[#E8F0FE] text-[#1A73E8] font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                      {step.step}
                    </div>
                    <div>
                      <div className="font-semibold text-xs text-[#1F1F1F]">
                        {step.title}
                      </div>
                      <p className="text-xs text-[#444746] mt-0.5">
                        {step.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Questions to consider */}
          <div className="p-4 rounded-xl bg-[#FEF7E0] border border-[#FEEFC3] space-y-2">
            <div className="font-bold text-xs text-[#B06000] flex items-center gap-1.5">
              <HelpCircle className="w-4 h-4" />
              <span>Questions to keep in mind:</span>
            </div>
            <ul className="text-xs text-[#7A4100] space-y-1 list-disc list-inside">
              {activeTopic.questionsToConsider.map((q, idx) => (
                <li key={idx}>{q}</li>
              ))}
            </ul>
          </div>

          {/* Subtle legal source link at bottom */}
          <div className="pt-2 border-t border-[#F1F3F4] flex flex-wrap items-center justify-between gap-2 text-[11px] text-[#70757A]">
            <div className="flex items-center gap-2">
              <span>Legal framework reference:</span>
              {activeTopic.statutorySources.map((source, idx) => (
                <span key={idx} className="font-mono text-[10px] bg-[#F1F3F4] px-2 py-0.5 rounded text-[#3C4043]">
                  {source}
                </span>
              ))}
            </div>
            <span>General information only · Not formal legal advice</span>
          </div>
        </div>
      )}
    </div>
  );
};
