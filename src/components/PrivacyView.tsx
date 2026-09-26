import React from 'react';
import { ShieldCheck, Lock, EyeOff, CheckCircle2, HelpCircle } from 'lucide-react';

export const PrivacyView: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-6 py-8 space-y-8">
      {/* Title */}
      <div>
        <h1 className="font-display font-bold text-2xl sm:text-3xl text-[#1F1F1F]">
          Your privacy & how CLAUSETRACE works
        </h1>
        <p className="text-sm text-[#5F6368] mt-1.5">
          Your document stays completely private. We never sell your data, use your files to train public models, or make things up.
        </p>
      </div>

      {/* 3 Core Trust Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-2xl border border-[#E0E2E6] shadow-xs space-y-3">
          <div className="w-10 h-10 rounded-xl bg-[#E8F0FE] text-[#1A73E8] flex items-center justify-center">
            <Lock className="w-5 h-5" />
          </div>
          <h3 className="font-display font-bold text-base text-[#1F1F1F]">
            100% Private
          </h3>
          <p className="text-xs text-[#5F6368] leading-relaxed">
            Your contracts, offer letters, and notices are never used to train public AI models or shared with third parties.
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-[#E0E2E6] shadow-xs space-y-3">
          <div className="w-10 h-10 rounded-xl bg-[#E6F4EA] text-[#137333] flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <h3 className="font-display font-bold text-base text-[#1F1F1F]">
            Refuses to Hallucinate
          </h3>
          <p className="text-xs text-[#5F6368] leading-relaxed">
            Every explanation points to a verified page and paragraph in your file. If a term isn't there, we clearly tell you "Not found in this document".
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-[#E0E2E6] shadow-xs space-y-3">
          <div className="w-10 h-10 rounded-xl bg-[#FEF7E0] text-[#B06000] flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h3 className="font-display font-bold text-base text-[#1F1F1F]">
            Empowerment, Not Jargon
          </h3>
          <p className="text-xs text-[#5F6368] leading-relaxed">
            We translate complex legal wording into everyday language so you understand your rights and can ask the right questions with confidence.
          </p>
        </div>
      </div>

      {/* Clear Helpful Boundaries */}
      <div className="bg-white rounded-2xl border border-[#DADCE0] p-6 shadow-xs space-y-4">
        <h2 className="font-display font-bold text-base text-[#1F1F1F]">
          Important things to know
        </h2>

        <div className="space-y-3 text-xs text-[#3C4043] leading-relaxed">
          <p>
            <strong>Helping you understand:</strong> CLAUSETRACE is built to help ordinary people understand complex legal documents like apartment leases, employment offers, and society notices before they sign or commit.
          </p>
          <p>
            <strong>Not formal legal counsel:</strong> CLAUSETRACE is an educational document intelligence tool, not a lawyer or law firm. It does not replace individualized legal advice from a licensed advocate.
          </p>
          <p>
            <strong>When in doubt, ask:</strong> If you are dealing with a high-stakes dispute or large financial obligation, use the "Prepare for a lawyer" feature to organize your questions before consulting a licensed legal professional.
          </p>
        </div>
      </div>
    </div>
  );
};
