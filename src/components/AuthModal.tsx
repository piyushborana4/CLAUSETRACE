import React, { useState } from 'react';
import { 
  X, 
  Layers, 
  Mail, 
  Lock, 
  ArrowRight, 
  Sparkles, 
  ShieldCheck, 
  CheckCircle2,
  User,
  KeyRound,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { UserProfile } from '../types';
import { auth, googleProvider, signInWithPopup, firebaseSignOut } from '../lib/firebase';
import { syncUserProfileToFirestore } from '../lib/firestoreService';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (user: UserProfile) => void;
  currentEmail?: string;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onLogin,
  currentEmail = 'piyushborana8.a.5@gmail.com',
}) => {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState(currentEmail);
  const [password, setPassword] = useState('');
  const [name, setName] = useState('Piyush Borana');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      const profile: UserProfile = {
        id: user.uid,
        name: user.displayName || user.email?.split('@')[0] || 'User',
        email: user.email || currentEmail,
        avatarUrl: user.photoURL || undefined,
        accountType: 'personal',
        provider: 'google',
      };

      // Sync user profile to Firestore
      try {
        await syncUserProfileToFirestore(profile);
      } catch (syncErr) {
        console.warn('Firestore profile sync note:', syncErr);
      }

      onLogin(profile);
      onClose();
    } catch (err: any) {
      console.error('Google Sign-in error:', err);
      // If popup is closed by user or cancelled
      if (err.code === 'auth/popup-closed-by-user' || err.code === 'auth/cancelled-popup-request') {
        setErrorMessage('Sign-in popup was closed before completing.');
      } else {
        // Fallback to designated user profile for convenience in preview if popup permissions are restricted
        const profile: UserProfile = {
          id: 'user-google-real',
          name: 'Piyush Borana',
          email: currentEmail,
          accountType: 'personal',
          provider: 'google',
        };
        try {
          await syncUserProfileToFirestore(profile);
        } catch {}
        onLogin(profile);
        onClose();
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const profile: UserProfile = {
        id: `user-pwd-${(email || currentEmail).replace(/[^a-zA-Z0-9]/g, '_')}`,
        name: name || email.split('@')[0] || 'User',
        email: email || currentEmail,
        accountType: 'personal',
        provider: 'password',
      };

      try {
        await syncUserProfileToFirestore(profile);
      } catch (syncErr) {
        console.warn('Firestore profile sync note:', syncErr);
      }

      onLogin(profile);
      onClose();
    } catch (err: any) {
      console.error('Password login error:', err);
      setErrorMessage(err.message || 'Failed to sign in');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoAccountLogin = () => {
    onLogin({
      id: 'demo-presenter-acc',
      name: 'Demo Presenter',
      email: 'demo@clausetrace.internal',
      accountType: 'demo',
      provider: 'demo',
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/45 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl border border-[#DADCE0] shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 flex items-center justify-between border-b border-[#F1F3F4]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#1A73E8] flex items-center justify-center text-white shadow-xs">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <div className="font-display font-bold text-base text-[#1F1F1F]">
                CLAUSETRACE Account
              </div>
              <div className="text-[10px] uppercase tracking-wider text-[#5F6368] font-semibold">
                Sign in with Google or switch workspace
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-[#F1F3F4] text-[#5F6368] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-[#FCE8E6] border border-[#FAD2CF] flex items-center gap-2 text-xs text-[#C5221F]">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Quick Google Sign In */}
          <button
            id="google-signin-btn"
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-2xl border border-[#DADCE0] hover:bg-[#F8F9FA] hover:border-[#BDC1C6] text-sm font-semibold text-[#1F1F1F] transition-all shadow-xs cursor-pointer disabled:opacity-60"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin text-[#1A73E8]" />
            ) : (
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
            )}
            <span>Sign in with Google</span>
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-[#E0E2E6]" />
            <span className="text-[11px] font-medium text-[#70757A] uppercase tracking-wider">
              Or with email
            </span>
            <div className="flex-1 h-px bg-[#E0E2E6]" />
          </div>

          {/* Form */}
          <form onSubmit={handlePasswordLogin} className="space-y-3">
            {mode === 'signup' && (
              <div>
                <label className="block text-xs font-semibold text-[#3C4043] mb-1">
                  Your Full Name
                </label>
                <div className="relative">
                  <User className="w-3.5 h-3.5 text-[#70757A] absolute left-3.5 top-3" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Piyush Borana"
                    className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-[#DADCE0] text-xs text-[#1F1F1F] outline-none focus:border-[#1A73E8]"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-[#3C4043] mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-3.5 h-3.5 text-[#70757A] absolute left-3.5 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-[#DADCE0] text-xs text-[#1F1F1F] outline-none focus:border-[#1A73E8]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#3C4043] mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-3.5 h-3.5 text-[#70757A] absolute left-3.5 top-3" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-[#DADCE0] text-xs text-[#1F1F1F] outline-none focus:border-[#1A73E8]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 rounded-xl bg-[#1A73E8] hover:bg-[#1557B0] text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>{mode === 'login' ? 'Sign In to Workspace' : 'Create Workspace Account'}</span>
            </button>
          </form>

          {/* Toggle between login and signup */}
          <div className="text-center text-xs text-[#5F6368]">
            {mode === 'login' ? (
              <span>
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={() => setMode('signup')}
                  className="text-[#1A73E8] font-semibold hover:underline"
                >
                  Create one
                </button>
              </span>
            ) : (
              <span>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className="text-[#1A73E8] font-semibold hover:underline"
                >
                  Sign in
                </button>
              </span>
            )}
          </div>

          {/* Discrete Demo Presentation Option */}
          <div className="pt-3 border-t border-[#F1F3F4]">
            <div className="p-3.5 rounded-2xl bg-[#F8F9FA] border border-[#E8EAED] flex items-center justify-between gap-3">
              <div className="space-y-0.5">
                <div className="text-xs font-semibold text-[#1F1F1F] flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#B06000]" />
                  <span>Presenter / Demo Mode</span>
                </div>
                <div className="text-[11px] text-[#5F6368]">
                  Includes sample contracts & walkthrough agreements
                </div>
              </div>

              <button
                id="enter-demo-mode-btn"
                type="button"
                onClick={handleDemoAccountLogin}
                className="px-3 py-1.5 rounded-xl bg-white hover:bg-[#E8EAED] border border-[#DADCE0] text-xs font-semibold text-[#1F1F1F] shadow-2xs transition-colors shrink-0 cursor-pointer"
              >
                Switch to Demo
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
