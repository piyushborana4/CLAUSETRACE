# CLAUSETRACE Module API & TypeScript Domain Reference

## Module Breakdown

### 1. `src/lib/schemas.ts`
Runtime validation schemas using Zod:
- `LegalDocumentSchema`: Master document entity with parties, key terms, findings, checklist, and page sections.
- `FindingSchema`: Grounded contractual extraction with mandatory `evidence`, `page`, `section`, `status`, and `severity`.
- `QuestionAnswerSchema`: Response model for interactive Q&A adhering to `ResponseStatus` (`DOCUMENT_SUPPORTED`, `DOCUMENT_INTERPRETATION`, `NOT_FOUND`, `AMBIGUOUS`).
- `DocumentComparisonSchema`: Factual diff model for comparing draft versions.

### 2. `src/lib/secureStorage.ts`
Client-side encrypted persistence and in-memory cache:
- `encryptAESGCM(plainText: string): Promise<string>`
- `decryptAESGCM(payload: string): Promise<string>`
- `secureStorage.setItem<T>(key: string, value: T): void`
- `secureStorage.getItem<T>(key: string, defaultValue: T): T`
- `secureStorage.getItemAsync<T>(key: string, defaultValue: T): Promise<T>`

### 3. `src/lib/documentProcessor.ts`
Document parsing and Web Worker coordinator:
- `processDocumentTextAsync(rawText: string): Promise<ProcessedDocumentData>`
- `computeDocumentHash(content: string): Promise<string>`

### 4. `src/lib/auditLogger.ts`
Zero-trust immutable event logging:
- `logAuditEvent(entry: Omit<AuditLogEntry, 'id' | 'timestamp'>): Promise<AuditLogEntry>`
- `getLocalAuditLogs(): AuditLogEntry[]`

### 5. `src/hooks/useOfflineSync.ts`
Offline-first synchronization hook:
- `useOfflineSync(userId: string | null)`:
  - `isOnline: boolean`
  - `isSyncing: boolean`
  - `pendingSyncCount: number`
  - `queueDocSync(doc: LegalDocument): void`
  - `queueChecklistSync(docId: string, items: ChecklistItem[]): void`
  - `flushQueue(): Promise<void>`

### 6. `src/data/legalBenchmarks.ts`
Authoritative comparative standards:
- `LEGAL_DOMAIN_BENCHMARKS: ContractDomainBenchmark[]`
  - `employment`
  - `residential_rental`
  - `commercial_lease`
  - `vendor_msa`
  - `nda_confidentiality`
