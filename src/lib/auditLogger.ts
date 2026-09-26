/**
 * CLAUSETRACE Zero-Trust Audit Logging Engine
 * Records immutable audit events for document access, verification, exports, and changes.
 */

import { doc, setDoc } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from './firebase';
import { secureStorage } from './secureStorage';
import { computeDocumentHash } from './documentProcessor';

export interface AuditLogEntry {
  id: string;
  userId: string;
  action: 'DOCUMENT_VIEW' | 'DOCUMENT_ANALYZE' | 'DOCUMENT_EXPORT' | 'CHECKLIST_TOGGLE' | 'QUESTION_ASKED' | 'DOCUMENT_COMPARE' | 'BENCHMARK_EVALUATE';
  resourceType: 'DOCUMENT' | 'COMPARISON' | 'CHECKLIST' | 'BRIEFING';
  resourceId: string;
  documentHash?: string;
  status: 'SUCCESS' | 'FAILURE' | 'PENDING';
  details?: string;
  timestamp: string;
}

const LOCAL_AUDIT_KEY = 'clausetrace_audit_log_buffer';

export async function logAuditEvent(entry: Omit<AuditLogEntry, 'id' | 'timestamp'>): Promise<AuditLogEntry> {
  const logId = `audit-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  const fullEntry: AuditLogEntry = {
    ...entry,
    id: logId,
    timestamp: new Date().toISOString(),
  };

  // Buffer locally in encrypted store
  try {
    const existing = secureStorage.getItem<AuditLogEntry[]>(LOCAL_AUDIT_KEY, []);
    const updated = [fullEntry, ...existing].slice(0, 100); // Keep last 100 in memory/storage
    secureStorage.setItem(LOCAL_AUDIT_KEY, updated);
  } catch (err) {
    console.warn('[AuditLogger] Local buffering warning:', err);
  }

  // If user is authenticated, persist to Firestore immutable collection
  if (auth.currentUser && auth.currentUser.uid === entry.userId) {
    const path = `audit_logs/${logId}`;
    try {
      const docRef = doc(db, 'audit_logs', logId);
      await setDoc(docRef, fullEntry);
    } catch (err) {
      console.warn('[AuditLogger] Firestore audit write failed (buffered locally):', err);
      // Fail-soft: auditing must not block critical user journeys
    }
  }

  return fullEntry;
}

export function getLocalAuditLogs(): AuditLogEntry[] {
  return secureStorage.getItem<AuditLogEntry[]>(LOCAL_AUDIT_KEY, []);
}
