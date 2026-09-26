import React, { useState, useEffect } from 'react';
import { Navigation, ActiveTab } from './components/Navigation';
import { Header } from './components/Header';
import { HomeView } from './components/HomeView';
import { MyDocumentsView } from './components/MyDocumentsView';
import { DocumentXRayView } from './components/DocumentXRayView';
import { AskView } from './components/AskView';
import { CompareView } from './components/CompareView';
import { LegalInfoView } from './components/LegalInfoView';
import { ActionCenterView } from './components/ActionCenterView';
import { BeforeYouSignView } from './components/BeforeYouSignView';
import { ProfessionalPrepView } from './components/ProfessionalPrepView';
import { PrivacyView } from './components/PrivacyView';
import { BigQueryAnalyticsView } from './components/BigQueryAnalyticsView';
import { LiveRegionProvider } from './components/LiveRegion';
import { UploadModal } from './components/UploadModal';
import { AuthModal } from './components/AuthModal';
import { predictivePrefetch } from './lib/predictivePrefetch';
import { logAuditEvent } from './lib/auditLogger';

import { 
  LegalDocument, 
  Finding, 
  ChecklistItem, 
  DocumentComparison, 
  GeneralLegalInfoTopic,
  UserProfile
} from './types';
import { 
  SAMPLE_RESIDENTIAL_RENTAL,
  SAMPLE_EMPLOYMENT_AGREEMENT, 
  SAMPLE_SOCIETY_NOTICE,
  SAMPLE_COMMERCIAL_LEASE, 
  SAMPLE_REVISED_EMPLOYMENT_AGREEMENT, 
  SAMPLE_COMPARISON, 
  SAMPLE_LEGAL_INFO_TOPICS 
} from './data/sampleDocuments';
import { auth, onAuthStateChanged, firebaseSignOut, User } from './lib/firebase';
import { 
  syncUserProfileToFirestore, 
  saveDocumentToFirestore, 
  deleteDocumentFromFirestore, 
  subscribeUserDocuments,
  updateDocumentChecklistInFirestore
} from './lib/firestoreService';
import { secureStorage } from './lib/secureStorage';

const DEFAULT_PERSONAL_USER: UserProfile = {
  id: 'user-google-real',
  name: 'Piyush Borana',
  email: 'piyushborana8.a.5@gmail.com',
  accountType: 'personal',
  provider: 'google',
};

const DEMO_PRESENTER_USER: UserProfile = {
  id: 'demo-presenter-acc',
  name: 'Demo Presenter',
  email: 'demo@clausetrace.internal',
  accountType: 'demo',
  provider: 'demo',
};

export function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('home');
  const [authUser, setAuthUser] = useState<User | null>(() => auth.currentUser);
  const [isAuthReady, setIsAuthReady] = useState<boolean>(false);

  // User Profile & Account Authentication State
  const [currentUser, setCurrentUser] = useState<UserProfile>(() => {
    return secureStorage.getItem<UserProfile>('clausetrace_user_profile', DEFAULT_PERSONAL_USER);
  });

  // Demo Documents (for walkthroughs and testing)
  const [demoDocuments, setDemoDocuments] = useState<LegalDocument[]>([
    SAMPLE_RESIDENTIAL_RENTAL,
    SAMPLE_EMPLOYMENT_AGREEMENT,
    SAMPLE_SOCIETY_NOTICE,
    SAMPLE_COMMERCIAL_LEASE,
    SAMPLE_REVISED_EMPLOYMENT_AGREEMENT,
  ]);

  // Real User-Uploaded Documents (Stored in Firestore + encrypted local cache)
  const [userDocuments, setUserDocuments] = useState<LegalDocument[]>(() => {
    return secureStorage.getItem<LegalDocument[]>('clausetrace_user_documents', []);
  });

  // Active document currently displayed
  // If user is in Personal Mode and has not uploaded any documents, activeDoc is NULL
  const [activeDoc, setActiveDoc] = useState<LegalDocument | null>(() => {
    if (currentUser.accountType === 'demo') {
      return SAMPLE_RESIDENTIAL_RENTAL;
    }
    const savedDocs = secureStorage.getItem<LegalDocument[]>('clausetrace_user_documents', []);
    return savedDocs.length > 0 ? savedDocs[0] : null;
  });

  const [comparisonData] = useState<DocumentComparison>(SAMPLE_COMPARISON);
  const [legalInfoTopics] = useState<GeneralLegalInfoTopic[]>(SAMPLE_LEGAL_INFO_TOPICS);

  // Global Checklist State initialized
  const [checklist, setChecklist] = useState<ChecklistItem[]>(() => {
    if (currentUser.accountType === 'demo') {
      return SAMPLE_RESIDENTIAL_RENTAL.checklist || [];
    }
    const savedDocs = secureStorage.getItem<LegalDocument[]>('clausetrace_user_documents', []);
    return savedDocs.length > 0 && savedDocs[0].checklist ? savedDocs[0].checklist : [];
  });

  // Cross-Navigation Interactivity States
  const [preselectedFindingForEmail, setPreselectedFindingForEmail] = useState<Finding | null>(null);
  const [prefilledAskQuestion, setPrefilledAskQuestion] = useState<string>('');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState<boolean>(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState<boolean>(false);

  // Listen to Firebase Auth state
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      setAuthUser(firebaseUser);
      setIsAuthReady(true);
      if (firebaseUser) {
        const profile: UserProfile = {
          id: firebaseUser.uid,
          name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
          email: firebaseUser.email || 'user@clausetrace.internal',
          avatarUrl: firebaseUser.photoURL || undefined,
          accountType: 'personal',
          provider: 'google',
        };
        setCurrentUser(profile);
        try {
          await syncUserProfileToFirestore(profile);
        } catch (e) {
          console.warn('Firebase profile sync error:', e);
        }
      }
    });

    return () => unsubscribeAuth();
  }, []);

  // Listen to Firestore documents when authenticated in personal mode
  useEffect(() => {
    if (!isAuthReady || !authUser || currentUser.accountType !== 'personal' || authUser.uid !== currentUser.id) {
      return;
    }

    const unsubscribeDocs = subscribeUserDocuments(
      authUser.uid,
      (remoteDocs) => {
        if (remoteDocs && remoteDocs.length > 0) {
          setUserDocuments(remoteDocs);
          setActiveDoc((prevActive) => {
            if (!prevActive) return remoteDocs[0];
            const found = remoteDocs.find((d) => d.id === prevActive.id);
            return found || remoteDocs[0];
          });
        }
      },
      (err) => {
        console.warn('Firestore real-time subscription note:', err);
      }
    );

    return () => {
      if (typeof unsubscribeDocs === 'function') {
        unsubscribeDocs();
      }
    };
  }, [isAuthReady, authUser, currentUser.id, currentUser.accountType]);

  // Save profile and documents to encrypted storage for offline access
  useEffect(() => {
    secureStorage.setItem('clausetrace_user_profile', currentUser);
  }, [currentUser]);

  useEffect(() => {
    secureStorage.setItem('clausetrace_user_documents', userDocuments);
  }, [userDocuments]);

  // Account Switching Handlers
  const handleSwitchToDemo = () => {
    setCurrentUser(DEMO_PRESENTER_USER);
    setActiveDoc(demoDocuments[0]);
    if (demoDocuments[0]?.checklist) {
      setChecklist(demoDocuments[0].checklist);
    }
    setActiveTab('home');
  };

  const handleSwitchToPersonal = () => {
    setCurrentUser(DEFAULT_PERSONAL_USER);
    if (userDocuments.length > 0) {
      setActiveDoc(userDocuments[0]);
      if (userDocuments[0]?.checklist) {
        setChecklist(userDocuments[0].checklist);
      }
    } else {
      setActiveDoc(null);
      setChecklist([]);
    }
    setActiveTab('home');
  };

  const handleLogin = (newProfile: UserProfile) => {
    setCurrentUser(newProfile);
    if (newProfile.accountType === 'demo') {
      setActiveDoc(demoDocuments[0]);
      if (demoDocuments[0]?.checklist) {
        setChecklist(demoDocuments[0].checklist);
      }
    } else if (userDocuments.length > 0) {
      setActiveDoc(userDocuments[0]);
      if (userDocuments[0]?.checklist) {
        setChecklist(userDocuments[0].checklist);
      }
    } else {
      setActiveDoc(null);
      setChecklist([]);
    }
  };

  const handleLogout = async () => {
    try {
      await firebaseSignOut(auth);
    } catch {}
    setIsAuthModalOpen(true);
  };

  // Document Selection & Upload Handlers
  const handleSelectDocument = (doc: LegalDocument) => {
    setActiveDoc(doc);
    if (doc.checklist && doc.checklist.length > 0) {
      setChecklist(doc.checklist);
    }
  };

  const handleDocumentLoaded = async (newDoc: LegalDocument) => {
    const userDoc: LegalDocument = {
      ...newDoc,
      source: 'user',
      isDemo: false,
    };
    setUserDocuments((prev) => [userDoc, ...prev.filter((d) => d.id !== userDoc.id)]);
    setActiveDoc(userDoc);
    if (userDoc.checklist) {
      setChecklist(userDoc.checklist);
    }
    setActiveTab('xray');

    // Save to Firestore if in personal mode
    if (currentUser.accountType === 'personal' && currentUser.id) {
      try {
        await saveDocumentToFirestore(currentUser.id, userDoc);
      } catch (err) {
        console.warn('Firestore document save note:', err);
      }
    }
  };

  const handleRestoreDemoDocuments = () => {
    const defaultSamples = [
      SAMPLE_RESIDENTIAL_RENTAL,
      SAMPLE_EMPLOYMENT_AGREEMENT,
      SAMPLE_SOCIETY_NOTICE,
      SAMPLE_COMMERCIAL_LEASE,
      SAMPLE_REVISED_EMPLOYMENT_AGREEMENT,
    ];
    setDemoDocuments(defaultSamples);
    if (currentUser.accountType === 'demo' && !activeDoc) {
      setActiveDoc(defaultSamples[0]);
      setChecklist(defaultSamples[0].checklist || []);
    }
  };

  const handleDeleteDocument = async (docId: string, isDemo?: boolean) => {
    if (isDemo || currentUser.accountType === 'demo') {
      setDemoDocuments((prev) => {
        const updated = prev.filter((d) => d.id !== docId);
        if (activeDoc?.id === docId) {
          const nextDoc = updated.length > 0 ? updated[0] : null;
          setActiveDoc(nextDoc);
          setChecklist(nextDoc?.checklist || []);
        }
        return updated;
      });
    } else {
      setUserDocuments((prev) => {
        const updated = prev.filter((d) => d.id !== docId);
        if (activeDoc?.id === docId) {
          const nextDoc = updated.length > 0 ? updated[0] : null;
          setActiveDoc(nextDoc);
          setChecklist(nextDoc?.checklist || []);
        }
        return updated;
      });

      if (currentUser.accountType === 'personal' && currentUser.id) {
        try {
          await deleteDocumentFromFirestore(docId);
        } catch (err) {
          console.warn('Firestore document delete note:', err);
        }
      }
    }
  };

  const handleDeleteChecklistItem = async (id: string) => {
    const updated = checklist.filter((item) => item.id !== id);
    setChecklist(updated);

    if (activeDoc && activeDoc.source === 'user') {
      const updatedDoc = {
        ...activeDoc,
        checklist: updated,
      };
      setActiveDoc(updatedDoc);
      setUserDocuments((prev) => prev.map((d) => (d.id === updatedDoc.id ? updatedDoc : d)));
      if (currentUser.accountType === 'personal' && currentUser.id) {
        try {
          await updateDocumentChecklistInFirestore(currentUser.id, updatedDoc.id, updated);
        } catch {}
      }
    }
  };

  // Cross-view handlers
  const handleDraftEmailForFinding = (finding: Finding) => {
    setPreselectedFindingForEmail(finding);
    setActiveTab('actions');
  };

  const handleAddFindingToChecklist = async (finding: Finding) => {
    const newItem: ChecklistItem = {
      id: `chk-custom-${Date.now()}`,
      text: `Review ${finding.title}: ${finding.suggested_action}`,
      category: finding.category,
      page: finding.page,
      section: finding.section,
      completed: false,
      evidenceSnippet: finding.evidence,
      actionDraftType: 'email',
    };
    const updatedChecklist = [newItem, ...checklist];
    setChecklist(updatedChecklist);

    if (activeDoc && activeDoc.source === 'user') {
      const updatedDoc = {
        ...activeDoc,
        checklist: updatedChecklist,
      };
      setActiveDoc(updatedDoc);
      setUserDocuments((prev) => prev.map((d) => (d.id === updatedDoc.id ? updatedDoc : d)));
      if (currentUser.accountType === 'personal' && currentUser.id) {
        try {
          await updateDocumentChecklistInFirestore(currentUser.id, updatedDoc.id, updatedChecklist);
        } catch {}
      }
    }
  };

  const handleAddCustomChecklistItem = async (text: string, category: string, page?: number, section?: string) => {
    const newItem: ChecklistItem = {
      id: `chk-custom-${Date.now()}`,
      text,
      category,
      page,
      section,
      completed: false,
    };
    const updatedChecklist = [newItem, ...checklist];
    setChecklist(updatedChecklist);

    if (activeDoc && activeDoc.source === 'user') {
      const updatedDoc = {
        ...activeDoc,
        checklist: updatedChecklist,
      };
      setActiveDoc(updatedDoc);
      setUserDocuments((prev) => prev.map((d) => (d.id === updatedDoc.id ? updatedDoc : d)));
      if (currentUser.accountType === 'personal' && currentUser.id) {
        try {
          await updateDocumentChecklistInFirestore(currentUser.id, updatedDoc.id, updatedChecklist);
        } catch {}
      }
    }
  };

  const handleAskAboutFinding = (question: string) => {
    setPrefilledAskQuestion(question);
    setActiveTab('ask');
  };

  const handleToggleChecklistItem = async (id: string) => {
    const updated = checklist.map((item) =>
      item.id === id ? { ...item, completed: !item.completed } : item
    );
    setChecklist(updated);

    if (activeDoc && activeDoc.source === 'user') {
      const updatedDoc = {
        ...activeDoc,
        checklist: updated,
      };
      setActiveDoc(updatedDoc);
      setUserDocuments((prev) => prev.map((d) => (d.id === updatedDoc.id ? updatedDoc : d)));
      if (currentUser.accountType === 'personal' && currentUser.id) {
        try {
          await updateDocumentChecklistInFirestore(currentUser.id, updatedDoc.id, updated);
        } catch {}
      }
    }
  };

  const handleDraftEmailFromChecklist = (item: ChecklistItem) => {
    const fakeFinding: Finding = {
      id: item.id,
      title: item.text,
      category: 'GENERAL' as any,
      status: 'DOCUMENT_SUPPORTED',
      page: item.page || 1,
      section: item.section || 'Provisions',
      evidence: item.evidenceSnippet || 'Referenced in checklist item',
      summary: item.text,
      why_it_matters: 'Clarification required prior to signing.',
      suggested_action: 'Send clarification request to counterparty.',
      requires_professional_review: false,
    };
    setPreselectedFindingForEmail(fakeFinding);
    setActiveTab('actions');
  };

  const isDemo = currentUser.accountType === 'demo';

  const tabTitles: Record<ActiveTab, string> = {
    home: 'Home',
    my_docs: isDemo ? 'Demo Documents' : 'My Documents',
    xray: 'What matters',
    ask: 'Ask a question',
    compare: 'Compare documents',
    legal_info: 'Everyday guides',
    actions: 'What can I do?',
    checklist: 'Before you agree',
    briefing: 'Prepare for a lawyer',
    analytics: 'BigQuery Analytics',
    privacy: 'About & Safety',
  };

  const availableDocsForComparison = isDemo ? demoDocuments : userDocuments;
  const calculatedAttentionCount = activeDoc?.keyTerms?.attentionItemsCount || 0;

  return (
    <LiveRegionProvider>
      <div className="flex h-screen w-screen overflow-hidden bg-[#F8F9FA] text-[#1F1F1F] font-sans antialiased">
        {/* Accessible Skip Link for WCAG 2.1 AAA */}
        <a 
          href="#main-content" 
          className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:px-4 focus:py-2 focus:bg-[#1A73E8] focus:text-white focus:rounded-xl focus:shadow-md focus:font-semibold focus:outline-none"
        >
          Skip to main content
        </a>

        {/* Navigation Rail & Drawer */}
        <Navigation
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          activeDoc={activeDoc}
          currentUser={currentUser}
          userDocCount={userDocuments.length}
          attentionCount={calculatedAttentionCount}
          isMobileOpen={isMobileNavOpen}
          onCloseMobile={() => setIsMobileNavOpen(false)}
        />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col h-screen overflow-hidden">
          {/* Top Header */}
          <Header
            currentTabName={tabTitles[activeTab]}
            activeDoc={activeDoc}
            userDocuments={userDocuments}
            demoDocuments={demoDocuments}
            currentUser={currentUser}
            onSelectDoc={handleSelectDocument}
            onOpenUpload={() => setIsUploadModalOpen(true)}
            onSwitchToDemo={handleSwitchToDemo}
            onSwitchToPersonal={handleSwitchToPersonal}
            onOpenAuthModal={() => setIsAuthModalOpen(true)}
            onLogout={handleLogout}
            onToggleMobileMenu={() => setIsMobileNavOpen(!isMobileNavOpen)}
          />

          {/* Scrollable Viewport */}
          <main id="main-content" className="flex-1 overflow-y-auto" tabIndex={-1}>
          {activeTab === 'home' && (
            <HomeView
              onOpenUpload={() => setIsUploadModalOpen(true)}
              setActiveTab={setActiveTab}
              userDocuments={userDocuments}
              demoDocuments={demoDocuments}
              activeDoc={activeDoc}
              currentUser={currentUser}
              checklist={checklist}
              onSelectDoc={handleSelectDocument}
              onSwitchToDemo={handleSwitchToDemo}
            />
          )}

          {activeTab === 'my_docs' && (
            <MyDocumentsView
              userDocuments={userDocuments}
              demoDocuments={demoDocuments}
              activeDoc={activeDoc}
              currentUser={currentUser}
              onSelectDoc={handleSelectDocument}
              onDeleteDoc={handleDeleteDocument}
              onRestoreDemoDocs={handleRestoreDemoDocuments}
              onOpenUpload={() => setIsUploadModalOpen(true)}
              onSwitchToDemo={handleSwitchToDemo}
              setActiveTab={setActiveTab}
            />
          )}

          {activeTab === 'xray' && (
            <DocumentXRayView
              document={activeDoc}
              setActiveTab={setActiveTab}
              onDraftEmailForFinding={handleDraftEmailForFinding}
              onAddFindingToChecklist={handleAddFindingToChecklist}
              onAskAboutFinding={handleAskAboutFinding}
              onOpenUpload={() => setIsUploadModalOpen(true)}
              onSwitchToDemo={handleSwitchToDemo}
            />
          )}

          {activeTab === 'ask' && (
            <AskView
              document={activeDoc}
              setActiveTab={setActiveTab}
              onDraftEmail={(title, evidence, section, page) => {
                const f: Finding = {
                  id: `f-${Date.now()}`,
                  title,
                  category: 'GENERAL' as any,
                  status: 'DOCUMENT_SUPPORTED',
                  page,
                  section,
                  evidence,
                  summary: title,
                  why_it_matters: 'Verified point in agreement.',
                  suggested_action: 'Clarify with relevant department.',
                  requires_professional_review: false,
                };
                handleDraftEmailForFinding(f);
              }}
              onAddChecklist={handleAddCustomChecklistItem}
              prefilledQuestion={prefilledAskQuestion}
              onOpenUpload={() => setIsUploadModalOpen(true)}
              onSwitchToDemo={handleSwitchToDemo}
            />
          )}

          {activeTab === 'compare' && (
            <CompareView
              documents={availableDocsForComparison}
              initialComparison={isDemo ? comparisonData : undefined}
              onOpenUpload={() => setIsUploadModalOpen(true)}
              onSwitchToDemo={handleSwitchToDemo}
            />
          )}

          {activeTab === 'legal_info' && (
            <LegalInfoView
              initialTopics={legalInfoTopics}
            />
          )}

          {activeTab === 'actions' && (
            <ActionCenterView
              document={activeDoc}
              preselectedFinding={preselectedFindingForEmail}
              currentUser={currentUser}
              onOpenUpload={() => setIsUploadModalOpen(true)}
              onSwitchToDemo={handleSwitchToDemo}
            />
          )}

          {activeTab === 'checklist' && (
            <BeforeYouSignView
              document={activeDoc}
              setActiveTab={setActiveTab}
              checklist={checklist}
              onToggleItem={handleToggleChecklistItem}
              onDeleteItem={handleDeleteChecklistItem}
              onDraftEmailFromChecklist={handleDraftEmailFromChecklist}
              onOpenUpload={() => setIsUploadModalOpen(true)}
              onSwitchToDemo={handleSwitchToDemo}
            />
          )}

          {activeTab === 'briefing' && (
            <ProfessionalPrepView
              document={activeDoc}
              onOpenUpload={() => setIsUploadModalOpen(true)}
              onSwitchToDemo={handleSwitchToDemo}
            />
          )}

          {activeTab === 'analytics' && (
            <BigQueryAnalyticsView />
          )}

          {activeTab === 'privacy' && (
            <PrivacyView />
          )}
        </main>
      </div>

      {/* Upload & Document Processing Modal */}
      <UploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onDocumentLoaded={handleDocumentLoaded}
        onExploreDemoRequested={handleSwitchToDemo}
      />

      {/* Account Login / Switch Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onLogin={handleLogin}
        currentEmail={currentUser.email}
      />
      </div>
    </LiveRegionProvider>
  );
}

export default App;
