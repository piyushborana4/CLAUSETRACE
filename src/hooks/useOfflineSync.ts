import { useState, useEffect, useCallback, useRef } from 'react';
import { LegalDocument, ChecklistItem } from '../types';
import { saveDocumentToFirestore, updateDocumentChecklistInFirestore } from '../lib/firestoreService';
import { secureStorage } from '../lib/secureStorage';
import { logAuditEvent } from '../lib/auditLogger';

interface SyncQueueItem {
  id: string;
  type: 'SAVE_DOC' | 'UPDATE_CHECKLIST';
  userId: string;
  documentId: string;
  payload: any;
  timestamp: number;
  retryCount: number;
  nextRetryAt: number;
}

export function useOfflineSync(userId: string | null) {
  const [isOnline, setIsOnline] = useState<boolean>(() => (typeof navigator !== 'undefined' ? navigator.onLine : true));
  const [syncQueue, setSyncQueue] = useState<SyncQueueItem[]>(() => {
    return secureStorage.getItem<SyncQueueItem[]>('clausetrace_sync_queue', []);
  });
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const flushQueueRef = useRef<() => Promise<void>>(() => Promise.resolve());

  // Monitor network status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
    };
    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Process sync queue with exponential backoff and jitter
  const flushQueue = useCallback(async () => {
    if (!isOnline || isSyncing || syncQueue.length === 0 || !userId) return;

    setIsSyncing(true);
    const now = Date.now();
    const remainingQueue: SyncQueueItem[] = [];

    for (const item of syncQueue) {
      // Check if item is ready for retry based on backoff
      if (item.nextRetryAt > now) {
        remainingQueue.push(item);
        continue;
      }

      try {
        if (item.type === 'SAVE_DOC') {
          await saveDocumentToFirestore(item.userId, item.payload as LegalDocument);
          logAuditEvent({
            userId: item.userId,
            action: 'DOCUMENT_ANALYZE',
            resourceType: 'DOCUMENT',
            resourceId: item.documentId,
            status: 'SUCCESS',
            details: 'Offline queued document synchronized to cloud database',
          }).catch(() => {});
        } else if (item.type === 'UPDATE_CHECKLIST') {
          await updateDocumentChecklistInFirestore(item.userId, item.documentId, item.payload as ChecklistItem[]);
          logAuditEvent({
            userId: item.userId,
            action: 'CHECKLIST_TOGGLE',
            resourceType: 'CHECKLIST',
            resourceId: item.documentId,
            status: 'SUCCESS',
            details: 'Offline queued checklist update synchronized to cloud database',
          }).catch(() => {});
        }
      } catch (err) {
        console.warn(`[OfflineSync] Item ${item.id} sync failed, applying backoff:`, err);
        const retryCount = item.retryCount + 1;
        // Exponential backoff: base 2s * 2^retryCount + random jitter up to 1s
        const backoffMs = Math.min(60000, 2000 * Math.pow(2, Math.min(retryCount, 5)) + Math.random() * 1000);
        remainingQueue.push({
          ...item,
          retryCount,
          nextRetryAt: Date.now() + backoffMs,
        });
      }
    }

    setSyncQueue(remainingQueue);
    secureStorage.setItem('clausetrace_sync_queue', remainingQueue);
    setIsSyncing(false);
    setLastSyncedAt(new Date());

    // Schedule next retry if queue still has items
    if (remainingQueue.length > 0 && isOnline) {
      if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = setTimeout(() => {
        flushQueueRef.current();
      }, 5000);
    }
  }, [isOnline, isSyncing, syncQueue, userId]);

  flushQueueRef.current = flushQueue;

  useEffect(() => {
    if (isOnline && syncQueue.length > 0) {
      flushQueue();
    }
    return () => {
      if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
    };
  }, [isOnline, syncQueue.length, flushQueue]);

  // Queue an action
  const queueDocSync = useCallback(
    (doc: LegalDocument) => {
      if (!userId) return;
      if (isOnline) {
        saveDocumentToFirestore(userId, doc).catch(() => {
          setSyncQueue((prev) => {
            const updated = [
              ...prev,
              {
                id: `sync-${Date.now()}`,
                type: 'SAVE_DOC' as const,
                userId,
                documentId: doc.id,
                payload: doc,
                timestamp: Date.now(),
                retryCount: 0,
                nextRetryAt: 0,
              },
            ];
            secureStorage.setItem('clausetrace_sync_queue', updated);
            return updated;
          });
        });
      } else {
        setSyncQueue((prev) => {
          const updated = [
            ...prev,
            {
              id: `sync-${Date.now()}`,
              type: 'SAVE_DOC' as const,
              userId,
              documentId: doc.id,
              payload: doc,
              timestamp: Date.now(),
              retryCount: 0,
              nextRetryAt: 0,
            },
          ];
          secureStorage.setItem('clausetrace_sync_queue', updated);
          return updated;
        });
      }
    },
    [userId, isOnline]
  );

  const queueChecklistSync = useCallback(
    (documentId: string, checklist: ChecklistItem[]) => {
      if (!userId) return;
      if (isOnline) {
        updateDocumentChecklistInFirestore(userId, documentId, checklist).catch(() => {
          setSyncQueue((prev) => {
            const updated = [
              ...prev,
              {
                id: `sync-${Date.now()}`,
                type: 'UPDATE_CHECKLIST' as const,
                userId,
                documentId,
                payload: checklist,
                timestamp: Date.now(),
                retryCount: 0,
                nextRetryAt: 0,
              },
            ];
            secureStorage.setItem('clausetrace_sync_queue', updated);
            return updated;
          });
        });
      } else {
        setSyncQueue((prev) => {
          const updated = [
            ...prev,
            {
              id: `sync-${Date.now()}`,
              type: 'UPDATE_CHECKLIST' as const,
              userId,
              documentId,
              payload: checklist,
              timestamp: Date.now(),
              retryCount: 0,
              nextRetryAt: 0,
            },
          ];
          secureStorage.setItem('clausetrace_sync_queue', updated);
          return updated;
        });
      }
    },
    [userId, isOnline]
  );

  return {
    isOnline,
    isSyncing,
    pendingSyncCount: syncQueue.length,
    lastSyncedAt,
    queueDocSync,
    queueChecklistSync,
    flushQueue,
  };
}
