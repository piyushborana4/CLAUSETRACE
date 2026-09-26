import React from 'react';
import { 
  Home, 
  FileSearch, 
  HelpCircle, 
  GitCompare, 
  BookOpen, 
  CheckSquare, 
  Briefcase, 
  Mail, 
  ShieldAlert, 
  Layers,
  X,
  Files
} from 'lucide-react';
import { LegalDocument, UserProfile } from '../types';

export type ActiveTab = 
  | 'home'
  | 'my_docs'
  | 'xray' 
  | 'ask' 
  | 'compare'
  | 'actions' 
  | 'checklist' 
  | 'legal_info' 
  | 'briefing' 
  | 'privacy';

interface NavigationProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  activeDoc: LegalDocument | null;
  currentUser: UserProfile;
  userDocCount?: number;
  attentionCount?: number;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

interface NavItem {
  id: ActiveTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  badgeColor?: string;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  setActiveTab,
  activeDoc,
  currentUser,
  userDocCount = 0,
  attentionCount = 0,
  isMobileOpen = false,
  onCloseMobile,
}) => {
  const isDemo = currentUser.accountType === 'demo';

  const mainNavItems: NavItem[] = [
    { id: 'home', label: 'Home', icon: Home },
    { 
      id: 'my_docs', 
      label: isDemo ? 'Demo Documents' : 'My Documents', 
      icon: Files,
      badge: !isDemo && userDocCount > 0 ? `${userDocCount}` : undefined,
      badgeColor: 'bg-[#E8F0FE] text-[#1A73E8]'
    },
    { 
      id: 'xray', 
      label: 'What matters', 
      icon: FileSearch, 
      badge: attentionCount > 0 ? `${attentionCount}` : undefined,
      badgeColor: 'bg-[#FEF7E0] text-[#B06000]'
    },
    { id: 'ask', label: 'Ask a question', icon: HelpCircle },
    { id: 'compare', label: 'Compare documents', icon: GitCompare },
  ];

  const toolsNavItems: NavItem[] = [
    { id: 'actions', label: 'What can I do?', icon: Mail },
    { id: 'checklist', label: 'Before you agree', icon: CheckSquare },
    { id: 'legal_info', label: 'Everyday guides', icon: BookOpen },
    { id: 'briefing', label: 'Prepare for a lawyer', icon: Briefcase },
    { id: 'privacy', label: 'About & Safety', icon: ShieldAlert },
  ];

  const handleNavClick = (id: ActiveTab) => {
    setActiveTab(id);
    if (onCloseMobile) onCloseMobile();
  };

  const navContent = (
    <div className="w-64 bg-white/95 backdrop-blur-md border-r border-[#E0E2E6] flex flex-col h-full select-none shrink-0 shadow-xs">
      {/* Brand Header */}
      <div className="p-5 border-b border-[#F1F3F4] flex items-center justify-between">
        <button 
          onClick={() => handleNavClick('home')}
          className="flex items-center gap-2.5 text-left group cursor-pointer"
        >
          <div className="w-9 h-9 rounded-xl bg-[#1A73E8] group-hover:bg-[#1557B0] flex items-center justify-center text-white shadow-xs transition-colors">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="font-display font-bold text-lg tracking-tight text-[#1F1F1F] leading-none">
              CLAUSETRACE
            </div>
            <div className="text-[10px] tracking-wider uppercase font-medium text-[#5F6368] mt-1">
              UNDERSTAND · VERIFY · ACT
            </div>
          </div>
        </button>

        {onCloseMobile && (
          <button
            onClick={onCloseMobile}
            className="md:hidden p-1.5 rounded-lg text-[#5F6368] hover:bg-[#F1F3F4] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Active Document Indicator Chip */}
      {activeDoc && (
        <div className="px-4 py-3 mx-3 my-2.5 bg-[#F8F9FA] rounded-2xl border border-[#E8EAED] space-y-1">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-[#5F6368]">
            Current Document
          </div>
          <div className="text-xs font-semibold text-[#1F1F1F] truncate" title={activeDoc.title}>
            {activeDoc.title}
          </div>
        </div>
      )}

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-4">
        {/* Core Workspace Tabs */}
        <div className="space-y-0.5">
          <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[#70757A]">
            Core
          </div>
          {mainNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                id={`nav-btn-${item.id}`}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                  isActive 
                    ? 'bg-[#E8F0FE] text-[#1A73E8] font-semibold shadow-2xs' 
                    : 'text-[#444746] hover:bg-[#F1F3F4] hover:text-[#1F1F1F]'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-[#1A73E8]' : 'text-[#5F6368]'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${item.badgeColor || 'bg-[#F1F3F4] text-[#444746]'}`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Support & Action Tools */}
        <div className="space-y-0.5 pt-2 border-t border-[#F1F3F4]">
          <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[#70757A]">
            Actions & Guides
          </div>
          {toolsNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                id={`nav-btn-${item.id}`}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                  isActive 
                    ? 'bg-[#E8F0FE] text-[#1A73E8] font-semibold shadow-2xs' 
                    : 'text-[#444746] hover:bg-[#F1F3F4] hover:text-[#1F1F1F]'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-[#1A73E8]' : 'text-[#5F6368]'}`} />
                  <span>{item.label}</span>
                </div>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Friendly Reassurance Footer */}
      <div className="p-4 border-t border-[#F1F3F4] bg-[#FAFAFA]">
        <div className="text-xs font-semibold text-[#1F1F1F] mb-0.5">
          Plain document intelligence
        </div>
        <p className="text-[11px] leading-relaxed text-[#70757A]">
          Every finding is verified against actual document text.
        </p>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden md:flex h-screen">
        {navContent}
      </aside>

      {/* Mobile Drawer */}
      {isMobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div 
            className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
          />
          <div className="relative z-10 h-full">
            {navContent}
          </div>
        </div>
      )}
    </>
  );
};
