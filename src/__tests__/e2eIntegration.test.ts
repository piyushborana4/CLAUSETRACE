import { describe, it, expect, beforeAll } from 'vitest';
import { processDocumentTextAsync, computeDocumentHash } from '../lib/documentProcessor';
import { validateLegalDocument, LegalDocumentSchema } from '../lib/schemas';
import { logAuditEvent, getLocalAuditLogs } from '../lib/auditLogger';
import { secureStorage } from '../lib/secureStorage';

describe('Enterprise E2E Pipeline Integration Test', () => {
  const storageMap = new Map<string, string>();
  const mockLocalStorage = {
    getItem: (key: string) => storageMap.get(key) || null,
    setItem: (key: string, val: string) => storageMap.set(key, val),
    removeItem: (key: string) => storageMap.delete(key),
    clear: () => storageMap.clear(),
    get length() {
      return storageMap.size;
    },
    key: (i: number) => Array.from(storageMap.keys())[i] || null,
  };

  beforeAll(() => {
    (globalThis as any).window = {
      localStorage: mockLocalStorage,
      crypto: undefined,
    };
    (globalThis as any).localStorage = mockLocalStorage;
  });

  it('processes raw document text through parsing, hashing, validation, and audit trail', async () => {
    const rawContract = `
EMPLOYMENT AGREEMENT
Between Acme Corp and John Doe.
Section 1. Term and Appointment:
Employee is hired as Principal Security Architect starting Nov 1, 2026.
Section 14. Termination and Notice:
Either party may terminate by providing thirty (30) days notice in writing.
Section 18. Restrictive Covenants:
Confidentiality obligations shall survive termination.
    `.trim();

    // 1. Text processing & SHA-256 Hashing
    const processed = await processDocumentTextAsync(rawContract);
    expect(processed.hash).toBeTruthy();
    expect(processed.hash.length).toBe(64);
    expect(processed.wordCount).toBeGreaterThan(20);
    expect(processed.detectedClauses.length).toBeGreaterThan(1);

    // 2. Document Entity Construction & Zod Schema Validation
    const testDoc = {
      id: `doc-${processed.hash.slice(0, 10)}`,
      title: 'Acme Security Architect Contract',
      documentType: 'Employment Agreement',
      parties: ['Acme Corp', 'John Doe'],
      pageCount: 1,
      uploadedAt: new Date().toISOString(),
      keyTerms: {
        compensation: 'As stated',
        noticePeriod: '30 Days',
        attentionItemsCount: 0,
      },
      findings: [
        {
          id: 'f-1',
          title: '30 Days Written Notice',
          category: 'TERMINATION' as const,
          status: 'DOCUMENT_SUPPORTED' as const,
          summary: 'Mutual 30-day notice period.',
          page: 1,
          section: 'Section 14',
          evidence: 'Either party may terminate by providing thirty (30) days notice in writing.',
          why_it_matters: 'Standard mutual exit term.',
          suggested_action: 'No action required.',
          requires_professional_review: false,
          severity: 'normal' as const,
        },
      ],
      crossClauseRelationships: [],
      missingOrAmbiguous: [],
      checklist: [],
      pages: [
        {
          pageNumber: 1,
          title: 'Page 1',
          sections: processed.detectedClauses,
          rawText: rawContract,
        },
      ],
      source: 'user' as const,
    };

    const validationResult = validateLegalDocument(testDoc);
    expect(validationResult.success).toBe(true);

    // 3. Zero-Trust Audit Logging
    const auditEvent = await logAuditEvent({
      userId: 'test-user-123',
      action: 'DOCUMENT_ANALYZE',
      resourceType: 'DOCUMENT',
      resourceId: testDoc.id,
      documentHash: processed.hash,
      status: 'SUCCESS',
      details: 'Full contract verification completed successfully',
    });

    expect(auditEvent.id).toBeTruthy();
    expect(auditEvent.status).toBe('SUCCESS');
    expect(auditEvent.documentHash).toBe(processed.hash);

    // 4. Secure Storage Persistence
    secureStorage.setItem(`doc_${testDoc.id}`, testDoc);
    const retrieved = secureStorage.getItem(`doc_${testDoc.id}`, null);
    expect(retrieved).toEqual(testDoc);
  });
});
