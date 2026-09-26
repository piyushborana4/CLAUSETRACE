import React, { useState, useRef, useEffect } from 'react';
import { 
  Upload, 
  ChevronDown, 
  FileText, 
  CheckCircle2, 
  Menu, 
  Sparkles, 
  Files, 
  ArrowRight,
  ShieldCheck,
  Plus
} from 'lucide-react';
import { LegalDocument, UserProfile } from '../types';
import { UserProfileMenu } from './UserProfileMenu';

interface HeaderProps {
  currentTabName: string;
  activeDoc: LegalDocument | null;
  userDocuments: LegalDocument[];
  demoDocuments: LegalDocument[];
  currentUser: UserProfile;
  onSelectDoc: (doc: LegalDocument) => void;
  onOpenUpload: () => void;
  onSwitchToDemo: () => void;
  onSwitchToPersonal: () => void;
  onOpenAuthModal: () => void;
  onLogout: () => void;
  onToggleMobileMenu?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTabName,
  activeDoc,
  userDocuments,
  demoDocuments,
  currentUser,
  onSelectDoc,
  onOpenUpload,
  onSwitchToDemo,
  onSwitchToPersonal,
  onOpenAuthModal,
  onLogout,
  onToggleMobileMenu,
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isDemoMode = currentUser.accountType === 'demo';
  const availableDocs = isDemoMode ? demoDocuments : userDocuments;

  return (
    <header 
      id="clausetrace-header"
      className="h-16 border-b border-[#E0E2E6] bg-white/95 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between shrink-0 z-20 shadow-2xs"
    >
      {/* Title & Active Document Selector */}
      <div className="flex items-center gap-3">
        {onToggleMobileMenu && (
          <button
            onClick={onToggleMobileMenu}
            className="md:hidden p-1.5 rounded-lg text-[#5F6368] hover:bg-[#F1F3F4] cursor-pointer"
            title="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        <h1 className="font-display font-semibold text-base sm:text-lg text-[#1F1F1F]">
          {currentTabName}
        </h1>

        {activeDoc && (
          <>
            <span className="text-[#BDC1C6] text-sm hidden sm:inline">/</span>
            <div className="relative" ref={dropdownRef}>
              <button
                id="doc-selector-dropdown-btn"
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-medium border border-[#DADCE0] bg-[#F8F9FA] hover:bg-[#F1F3F4] transition-all cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5 text-[#1A73E8]" />
                <span className="max-w-[120px] sm:max-w-[220px] truncate text-[#1F1F1F] font-semibold">
                  {activeDoc.title}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-[#5F6368]" />
              </button>

              {/* Dropdown Menu */}
              {dropdownOpen && (
                <div className="absolute top-full left-0 mt-1.5 w-80 bg-white rounded-2xl shadow-xl border border-[#DADCE0] py-2 z-50 text-left">
                  <div className="px-3.5 py-1.5 text-[11px] font-bold text-[#5F6368] uppercase tracking-wider border-b border-[#F1F3F4] flex items-center justify-between">
                    <span>{isDemoMode ? 'Demo Documents' : 'My Documents'}</span>
                    <span className="text-[10px] text-[#70757A] font-normal lowercase">
                      {availableDocs.length} total
                    </span>
                  </div>

                  {availableDocs.length === 0 ? (
                    <div className="p-4 text-center space-y-2">
                      <p className="text-xs text-[#5F6368]">
                        You haven't uploaded any documents yet.
                      </p>
                      <button
                        onClick={() => {
                          setDropdownOpen(false);
                          onOpenUpload();
                        }}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-[#1A73E8] hover:underline"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Upload a document</span>
                      </button>
                    </div>
                  ) : (
                    <div className="max-h-56 overflow-y-auto divide-y divide-[#F8F9FA]">
                      {availableDocs.map((doc) => (
                        <button
                          key={doc.id}
                          id={`select-doc-${doc.id}`}
                          onClick={() => {
                            onSelectDoc(doc);
                            setDropdownOpen(false);
                          }}
                          className={`w-full text-left px-3.5 py-2.5 text-xs flex items-center justify-between hover:bg-[#F8F9FA] transition-colors cursor-pointer ${
                            doc.id === activeDoc.id ? 'bg-[#E8F0FE] text-[#1A73E8] font-semibold' : 'text-[#1F1F1F]'
                          }`}
                        >
                          <div className="truncate mr-2">
                            <div className="truncate font-medium">{doc.title}</div>
                            <div className="text-[11px] text-[#5F6368]">
                              {doc.documentType} · {doc.pageCount} pages
                            </div>
                          </div>
                          {doc.id === activeDoc.id && (
                            <CheckCircle2 className="w-4 h-4 text-[#1A73E8] shrink-0" />
                          )}
                        </button>
                      ))}
                    </div>
                  )}

                  {!isDemoMode && (
                    <div className="px-2 pt-2 border-t border-[#F1F3F4]">
                      <button
                        onClick={() => {
                          setDropdownOpen(false);
                          onOpenUpload();
                        }}
                        className="w-full text-center px-3 py-2 rounded-xl text-xs font-bold text-[#1A73E8] hover:bg-[#E8F0FE] flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>+ Upload new document</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Right Controls: Upload Button & User Profile Menu */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        {/* Upload Button */}
        <button
          id="header-upload-btn"
          onClick={onOpenUpload}
          className="flex items-center gap-1.5 sm:gap-2 px-3.5 sm:px-4 py-2 rounded-2xl bg-[#1A73E8] hover:bg-[#1557B0] text-white text-xs font-semibold shadow-xs hover:shadow transition-all cursor-pointer"
        >
          <Upload className="w-3.5 h-3.5" />
          <span>Upload document</span>
        </button>

        {/* User Profile Menu */}
        <UserProfileMenu
          currentUser={currentUser}
          onSwitchToDemo={onSwitchToDemo}
          onSwitchToPersonal={onSwitchToPersonal}
          onOpenAuthModal={onOpenAuthModal}
          onLogout={onLogout}
          userDocCount={userDocuments.length}
        />
      </div>
    </header>
  );
};
