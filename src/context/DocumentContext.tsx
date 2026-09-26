import React, { createContext, useContext, useMemo, ReactNode } from 'react';
import { LegalDocument, Finding, ChecklistItem, UserProfile } from '../types';

interface DocumentContextValue {
  activeDoc: LegalDocument | null;
  currentUser: UserProfile;
  checklist: ChecklistItem[];
  userDocuments: LegalDocument[];
  demoDocuments: LegalDocument[];
  isDemo: boolean;
  onSelectDoc: (doc: LegalDocument) => void;
  onDraftEmailForFinding: (finding: Finding) => void;
  onAddFindingToChecklist: (finding: Finding) => void;
  onAskAboutFinding: (question: string) => void;
  onToggleChecklistItem: (id: string) => void;
  onDeleteChecklistItem: (id: string) => void;
  onOpenUpload: () => void;
  onSwitchToDemo: () => void;
  onSwitchToPersonal: () => void;
}

const DocumentContext = createContext<DocumentContextValue | undefined>(undefined);

export function DocumentProvider({
  children,
  value,
}: {
  children: ReactNode;
  value: DocumentContextValue;
}) {
  return <DocumentContext.Provider value={value}>{children}</DocumentContext.Provider>;
}

export function useDocument() {
  const context = useContext(DocumentContext);
  if (!context) {
    throw new Error('useDocument must be used within a DocumentProvider');
  }
  return context;
}
