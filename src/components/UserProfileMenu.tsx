import React, { useState, useRef, useEffect } from 'react';
import { 
  User, 
  Sparkles, 
  LogOut, 
  ChevronDown, 
  ShieldCheck, 
  CheckCircle2, 
  ArrowLeftRight,
  Settings,
  Files
} from 'lucide-react';
import { UserProfile } from '../types';

interface UserProfileMenuProps {
  currentUser: UserProfile;
  onSwitchToDemo: () => void;
  onSwitchToPersonal: () => void;
  onOpenAuthModal: () => void;
  onLogout: () => void;
  userDocCount: number;
}

export const UserProfileMenu: React.FC<UserProfileMenuProps> = ({
  currentUser,
  onSwitchToDemo,
  onSwitchToPersonal,
  onOpenAuthModal,
  onLogout,
  userDocCount,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isDemo = currentUser.accountType === 'demo';

  // Get clean initials for avatar
  const initials = currentUser.name
    ? currentUser.name
        .split(' ')
        .map(n => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'U';

  return (
    <div className="relative" ref={menuRef}>
      {/* Trigger Button */}
      <button
        id="user-profile-menu-btn"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 p-1.5 sm:px-2.5 sm:py-1.5 rounded-2xl hover:bg-[#F1F3F4] border border-transparent hover:border-[#DADCE0] transition-all cursor-pointer"
        title="Account & Workspace Settings"
      >
        <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold text-white shadow-2xs ${
          isDemo ? 'bg-gradient-to-tr from-[#E37400] to-[#FBBC04]' : 'bg-gradient-to-tr from-[#1A73E8] to-[#4285F4]'
        }`}>
          {initials}
        </div>

        <div className="hidden lg:block text-left">
          <div className="text-xs font-semibold text-[#1F1F1F] leading-tight flex items-center gap-1.5">
            <span>{currentUser.name}</span>
            {isDemo ? (
              <span className="text-[10px] px-1.5 py-0.2 rounded font-bold bg-[#FEF7E0] text-[#B06000] border border-[#FEEFC3]">
                Demo
              </span>
            ) : null}
          </div>
          <div className="text-[10px] text-[#5F6368] leading-none mt-0.5">
            {isDemo ? 'Presentation Mode' : `${userDocCount} document${userDocCount === 1 ? '' : 's'}`}
          </div>
        </div>

        <ChevronDown className="w-3.5 h-3.5 text-[#5F6368] hidden sm:block" />
      </button>

      {/* Popover Dropdown */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-2xl shadow-xl border border-[#DADCE0] py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
          {/* User Info Header */}
          <div className="px-4 py-3 border-b border-[#F1F3F4]">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold text-white shadow-2xs ${
                isDemo ? 'bg-gradient-to-tr from-[#E37400] to-[#FBBC04]' : 'bg-gradient-to-tr from-[#1A73E8] to-[#4285F4]'
              }`}>
                {initials}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-bold text-[#1F1F1F] truncate">
                  {currentUser.name}
                </div>
                <div className="text-[11px] text-[#5F6368] truncate">
                  {currentUser.email}
                </div>
              </div>
            </div>

            <div className="mt-2.5">
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold ${
                isDemo 
                  ? 'bg-[#FEF7E0] text-[#B06000] border border-[#FEEFC3]' 
                  : 'bg-[#E6F4EA] text-[#137333] border border-[#CEEAD6]'
              }`}>
                {isDemo ? (
                  <>
                    <Sparkles className="w-3 h-3" />
                    <span>Demo Account (Sample Data)</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-3 h-3" />
                    <span>Personal Workspace</span>
                  </>
                )}
              </span>
            </div>
          </div>

          {/* Switch Account Options */}
          <div className="p-2 space-y-1">
            {isDemo ? (
              <button
                id="switch-to-personal-btn"
                onClick={() => {
                  setIsOpen(false);
                  onSwitchToPersonal();
                }}
                className="w-full text-left px-3 py-2 rounded-xl text-xs flex items-center gap-2.5 hover:bg-[#E8F0FE] text-[#1A73E8] font-semibold transition-colors cursor-pointer"
              >
                <ArrowLeftRight className="w-4 h-4 text-[#1A73E8]" />
                <div>
                  <div>Switch to Personal Account</div>
                  <div className="text-[10px] text-[#5F6368] font-normal">
                    View your private documents & uploads
                  </div>
                </div>
              </button>
            ) : (
              <button
                id="switch-to-demo-btn"
                onClick={() => {
                  setIsOpen(false);
                  onSwitchToDemo();
                }}
                className="w-full text-left px-3 py-2 rounded-xl text-xs flex items-center gap-2.5 hover:bg-[#F8F9FA] text-[#1F1F1F] transition-colors cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-[#B06000]" />
                <div>
                  <div className="font-semibold text-[#B06000]">Switch to Demo Mode</div>
                  <div className="text-[10px] text-[#5F6368]">
                    Explore preloaded agreements for walkthroughs
                  </div>
                </div>
              </button>
            )}

            <button
              id="switch-account-modal-btn"
              onClick={() => {
                setIsOpen(false);
                onOpenAuthModal();
              }}
              className="w-full text-left px-3 py-2 rounded-xl text-xs flex items-center gap-2.5 hover:bg-[#F8F9FA] text-[#444746] transition-colors cursor-pointer"
            >
              <User className="w-4 h-4 text-[#70757A]" />
              <span>Sign in with another account…</span>
            </button>
          </div>

          {/* Logout */}
          <div className="pt-1 border-t border-[#F1F3F4] px-2">
            <button
              id="logout-btn"
              onClick={() => {
                setIsOpen(false);
                onLogout();
              }}
              className="w-full text-left px-3 py-2 rounded-xl text-xs flex items-center gap-2.5 hover:bg-[#FCE8E6] text-[#D93025] font-medium transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>{isDemo ? 'Exit Demo Mode' : 'Sign out'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
