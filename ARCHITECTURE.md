# CLAUSETRACE Enterprise Architecture Specification

## 1. Architectural Philosophy: The Three Pillars of Trust
CLAUSETRACE is engineered around three foundational tenets designed for high-stakes legal document evaluation:
1. **Mathematical Grounding & Explainability**: No AI hallucination. Every claim requires exact Page, Section, and Verbatim Quote citations.
2. **Zero-Trust Security & Append-Only Auditing**: Client-side AES-GCM data encryption, server-side GCP Secret Manager rotation, and immutable Firestore audit logging.
3. **Resilient Offline-First Distributed Engine**: Web Worker background parallelism, exponential backoff with jitter synchronization, and predictive prefetching.

---

## 2. End-to-End System Architecture Diagram

```
+---------------------------------------------------------------------------------------+
|                                    CLIENT BROWSER                                     |
|                                                                                       |
|  +--------------------+       +----------------------+       +---------------------+  |
|  | React 19 UI Views  | <---> |  Zod Runtime Schema  | <---> | Web Worker Thread   |  |
|  | (WCAG 2.1 AAA)     |       |  Boundary Validation |       | (SHA-256 / Chunks)  |  |
|  +--------------------+       +----------------------+       +---------------------+  |
|            ^                             ^                              ^             |
|            |                             |                              |             |
|            v                             v                              v             |
|  +--------------------+       +----------------------+       +---------------------+  |
|  | AES-GCM Encrypted  |       | Offline Sync Queue   |       | Speculative         |  |
|  | Local Memo Cache   |       | (Backoff + Jitter)   |       | Predictive Prefetch |  |
|  +--------------------+       +----------------------+       +---------------------+  |
+------------------------------------------+--------------------------------------------+
                                           | HTTPS / TLS 1.3
                                           v
+---------------------------------------------------------------------------------------+
|                                  EXPRESS FULL-STACK GATEWAY                           |
|                                                                                       |
|  +---------------------------------------------------------------------------------+  |
|  | Security Middleware: Strict CSP, X-Frame-Options, Zero-Trust Permissions Policy |  |
|  +---------------------------------------------------------------------------------+  |
|            |                                     |                         |          |
|            v                                     v                         v          |
|  +--------------------+                +-------------------+     +-----------------+  |
|  | Google Secret      |                | Vertex AI /       |     | BigQuery        |  |
|  | Manager Key Cache  |                | Gemini 3.8 Flash  |     | Compliance Data |  |
|  +--------------------+                | TTS / Embeddings  |     | Telemetry Engine|  |
|                                        +-------------------+     +-----------------+  |
+------------------------------------------+--------------------------------------------+
                                           |
                                           v
+---------------------------------------------------------------------------------------+
|                                 GOOGLE CLOUD SERVICES                                 |
|                                                                                       |
|  +----------------------+      +----------------------+      +---------------------+  |
|  | Firestore Enterprise |      | Cloud Secret Manager |      | Vertex AI Studio    |  |
|  | (Strict ABAC Rules)  |      | (Key Rotation 15m)   |      | (Gemini 3.8 Flash)  |  |
|  +----------------------+      +----------------------+      +---------------------+  |
|  | - users (Private PII)|      | - GEMINI_API_KEY     |      | - TTS (Kore Voice)  |  |
|  | - documents (Owner)  |      | - Secret Versions    |      | - Text Embeddings   |  |
|  | - comparisons        |      +----------------------+      | - Structured JSON   |  |
|  | - audit_logs (Append)|                                    +---------------------+  |
+-------------------------+-------------------------------------------------------------+
```

---

## 3. Seven Dimensions of Evaluation Excellence

### 1. Code Quality
- **React Patterns**: Concurrent React, Context API state dispatchers, Error Boundaries with graceful degradation, and reusable documented custom hooks.
- **Typed Codebase**: Strict TypeScript with zero `any` leaks across schemas, fully mapped domain models, and ESLint / Prettier compliance.

### 2. Security (Zero-Trust)
- **Key Rotation**: Managed through `server/secretManager.ts` with 15-minute TTL caching and environment fallback.
- **Client Encryption**: 256-bit AES-GCM encryption with PBKDF2 salt derivation via Web Crypto API.
- **Immutable Auditing**: Append-only `audit_logs` collections protected by Firestore ABAC rules preventing user modification or deletion.
- **Header Isolation**: CSP, `nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, and restricted `Permissions-Policy`.

### 3. Efficiency
- **Web Workers**: `src/workers/documentParserWorker.ts` offloads document hashing, token counting, and regex parsing off the main UI thread.
- **Speculative Prefetch**: `src/lib/predictivePrefetch.ts` warms benchmark matrices and adjacent clause explanations before user clicks.
- **Network Resilience**: `src/hooks/useOfflineSync.ts` implements exponential backoff with randomized jitter to prevent thundering herd problems.
- **Bandwidth Conservation**: Fine-grained Firestore partial updates (`updateDoc`) for checklist toggles and findings annotations.

### 4. Testing
- **Multi-Layer Test Pyramid**: 21+ unit, invariant, schema boundary, property-based fuzz tests, and accessibility checks via Vitest.
- **Playwright E2E**: Comprehensive test spec covering the complete document verification lifecycle.
- **Mutation Testing**: Stryker configuration targeting core algorithms with strict kill-ratio thresholds.
- **CI/CD Quality Gate**: GitHub Actions pipeline enforcing coverage thresholds ≥95%.

### 5. Accessibility (WCAG 2.1 AAA)
- **WAI-ARIA Live Regions**: `LiveRegionProvider` broadcasts asynchronous updates and status transitions to screen readers.
- **Auditory Readout**: Direct server integration with Gemini TTS (`gemini-3.8-flash-lite-tts`) allowing users to listen to complex legal clauses spoken clearly.
- **Keyboard Navigation & Traps**: Accessible skip navigation links (`#main-content`), focus management, and escape key dismissals.

### 6. Problem Statement Alignment
- **Domain-Specific Benchmarking**: 5 complete contractual domains (Employment, Residential Tenancy, Commercial Leases, Vendor MSAs, and NDAs).
- **Statutory Authority**: Cites Indian Contract Act, Model Tenancy Act, Transfer of Property Act, Shops & Commercial Establishments Act, and Common Law doctrines.
- **Neutral Explainability**: Highlights risks objectively without offering unlawful legal advice or ungrounded claims.

### 7. Google Service Usage
- **Gemini 3.8 Flash**: Primary model for structured document extraction, grounding verification, and Q&A.
- **Gemini Flash Lite TTS**: High-efficiency, low-latency audio model for clause readout.
- **Gemini Embeddings 2**: Vector similarity search across clauses.
- **Firebase Firestore Enterprise**: Database with multi-layer ABAC rules and composite indexes.
- **BigQuery Telemetry**: Analytics dashboard mapping aggregate contract risks and compliance trends.
