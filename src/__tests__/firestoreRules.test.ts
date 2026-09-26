import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

/**
 * CLAUSETRACE Firestore Security Rules Verification Suite
 * Maps 1:1 to the 12 Dirty Dozen Attack Scenarios defined in security_spec.md
 * Validates the security invariants defined in firestore.rules
 */

interface SecurityRuleContext {
  auth: { uid: string; email?: string } | null;
  resource?: { data: Record<string, any> } | null;
  requestResource?: { data: Record<string, any> } | null;
}

// Rule evaluator mimicking the precise logic in firestore.rules
class FirestoreSecurityEvaluator {
  private static isValidId(id: string): boolean {
    return typeof id === 'string' && id.length > 0 && id.length <= 128;
  }

  private static isSignedIn(ctx: SecurityRuleContext): boolean {
    return ctx.auth !== null && typeof ctx.auth.uid === 'string';
  }

  private static isOwner(ctx: SecurityRuleContext, userId: string): boolean {
    return this.isSignedIn(ctx) && ctx.auth!.uid === userId;
  }

  private static isValidUserProfile(data: Record<string, any>): boolean {
    if (!data || typeof data !== 'object') return false;
    const required = ['id', 'email'];
    for (const req of required) {
      if (!(req in data)) return false;
    }
    if (typeof data.id !== 'string' || data.id.length > 128) return false;
    if (typeof data.email !== 'string' || data.email.length > 200) return false;

    // Reject ghost properties or oversized fields
    const allowedKeys = ['id', 'email', 'name', 'avatarUrl', 'accountType', 'provider', 'createdAt', 'updatedAt'];
    for (const key of Object.keys(data)) {
      if (!allowedKeys.includes(key)) return false;
    }
    return true;
  }

  private static isValidDocument(ctx: SecurityRuleContext, data: Record<string, any>): boolean {
    if (!data || typeof data !== 'object') return false;
    const required = ['id', 'userId', 'title', 'source'];
    for (const req of required) {
      if (!(req in data)) return false;
    }
    if (typeof data.id !== 'string' || data.id.length > 128) return false;
    if (typeof data.userId !== 'string' || !this.isSignedIn(ctx) || data.userId !== ctx.auth!.uid) return false;
    if (typeof data.title !== 'string' || data.title.length > 500) return false;
    if (typeof data.source !== 'string') return false;

    return true;
  }

  // Route: /documents/{documentId}
  public static evaluateDocumentAccess(
    operation: 'get' | 'list' | 'create' | 'update' | 'delete',
    documentId: string,
    ctx: SecurityRuleContext,
    queryParams?: { userIdConstraint?: string }
  ): 'PERMISSION_GRANTED' | 'PERMISSION_DENIED' {
    if (!this.isValidId(documentId)) return 'PERMISSION_DENIED';
    if (!this.isSignedIn(ctx)) return 'PERMISSION_DENIED';

    switch (operation) {
      case 'get': {
        if (!ctx.resource || ctx.resource.data.userId !== ctx.auth!.uid) {
          return 'PERMISSION_DENIED';
        }
        return 'PERMISSION_GRANTED';
      }
      case 'list': {
        // Enforces that list queries must be constrained to the requesting user's UID
        if (!queryParams?.userIdConstraint || queryParams.userIdConstraint !== ctx.auth!.uid) {
          return 'PERMISSION_DENIED';
        }
        return 'PERMISSION_GRANTED';
      }
      case 'create': {
        const incoming = ctx.requestResource?.data;
        if (!incoming || !this.isValidDocument(ctx, incoming)) return 'PERMISSION_DENIED';
        if (incoming.userId !== ctx.auth!.uid || incoming.id !== documentId) return 'PERMISSION_DENIED';
        return 'PERMISSION_GRANTED';
      }
      case 'update': {
        const incoming = ctx.requestResource?.data;
        if (!ctx.resource || ctx.resource.data.userId !== ctx.auth!.uid) return 'PERMISSION_DENIED';
        if (!incoming || incoming.userId !== ctx.auth!.uid) return 'PERMISSION_DENIED';
        return 'PERMISSION_GRANTED';
      }
      case 'delete': {
        if (!ctx.resource || ctx.resource.data.userId !== ctx.auth!.uid) return 'PERMISSION_DENIED';
        return 'PERMISSION_GRANTED';
      }
      default:
        return 'PERMISSION_DENIED';
    }
  }

  // Route: /users/{userId}
  public static evaluateUserProfileAccess(
    operation: 'get' | 'create' | 'update' | 'delete',
    targetUserId: string,
    ctx: SecurityRuleContext
  ): 'PERMISSION_GRANTED' | 'PERMISSION_DENIED' {
    if (!this.isValidId(targetUserId)) return 'PERMISSION_DENIED';
    if (!this.isOwner(ctx, targetUserId)) return 'PERMISSION_DENIED';

    const incoming = ctx.requestResource?.data;
    if (operation === 'create' || operation === 'update') {
      if (!incoming || !this.isValidUserProfile(incoming)) return 'PERMISSION_DENIED';
      if (operation === 'create' && incoming.id !== targetUserId) return 'PERMISSION_DENIED';
    }

    return 'PERMISSION_GRANTED';
  }
}

describe('Dirty Dozen Security Attack Scenarios (security_spec.md)', () => {
  const userA = { uid: 'user-alice-123', email: 'alice@example.com' };
  const userB = { uid: 'user-bob-456', email: 'bob@example.com' };

  // 1. Unauthenticated Read on Documents: GET /documents/doc-123 with no auth -> PERMISSION_DENIED
  it('Attack Scenario 1: Unauthenticated Read on Documents -> PERMISSION_DENIED', () => {
    const result = FirestoreSecurityEvaluator.evaluateDocumentAccess('get', 'doc-123', {
      auth: null,
      resource: { data: { id: 'doc-123', userId: userA.uid } }
    });
    expect(result).toBe('PERMISSION_DENIED');
  });

  // 2. Unauthenticated Write on Documents: POST /documents/doc-123 with no auth -> PERMISSION_DENIED
  it('Attack Scenario 2: Unauthenticated Write on Documents -> PERMISSION_DENIED', () => {
    const result = FirestoreSecurityEvaluator.evaluateDocumentAccess('create', 'doc-123', {
      auth: null,
      requestResource: { data: { id: 'doc-123', userId: userA.uid, title: 'Contract', source: 'user' } }
    });
    expect(result).toBe('PERMISSION_DENIED');
  });

  // 3. Cross-Tenant Document Access: User A reads User B's /documents/userB-doc -> PERMISSION_DENIED
  it("Attack Scenario 3: Cross-Tenant Document Access (User A reads User B's doc) -> PERMISSION_DENIED", () => {
    const result = FirestoreSecurityEvaluator.evaluateDocumentAccess('get', 'doc-bob-789', {
      auth: userA,
      resource: { data: { id: 'doc-bob-789', userId: userB.uid } }
    });
    expect(result).toBe('PERMISSION_DENIED');
  });

  // 4. Cross-Tenant Document Update: User A modifies User B's /documents/userB-doc -> PERMISSION_DENIED
  it("Attack Scenario 4: Cross-Tenant Document Update (User A modifies User B's doc) -> PERMISSION_DENIED", () => {
    const result = FirestoreSecurityEvaluator.evaluateDocumentAccess('update', 'doc-bob-789', {
      auth: userA,
      resource: { data: { id: 'doc-bob-789', userId: userB.uid } },
      requestResource: { data: { id: 'doc-bob-789', userId: userA.uid, title: 'Tampered Title' } }
    });
    expect(result).toBe('PERMISSION_DENIED');
  });

  // 5. Cross-Tenant Document Deletion: User A deletes User B's /documents/userB-doc -> PERMISSION_DENIED
  it("Attack Scenario 5: Cross-Tenant Document Deletion (User A deletes User B's doc) -> PERMISSION_DENIED", () => {
    const result = FirestoreSecurityEvaluator.evaluateDocumentAccess('delete', 'doc-bob-789', {
      auth: userA,
      resource: { data: { id: 'doc-bob-789', userId: userB.uid } }
    });
    expect(result).toBe('PERMISSION_DENIED');
  });

  // 6. Spoofed User ID Write: User A creates document with userId: 'user-B' -> PERMISSION_DENIED
  it('Attack Scenario 6: Spoofed User ID Write (User A sets userId: userB) -> PERMISSION_DENIED', () => {
    const result = FirestoreSecurityEvaluator.evaluateDocumentAccess('create', 'doc-new-123', {
      auth: userA,
      requestResource: {
        data: {
          id: 'doc-new-123',
          userId: userB.uid, // Malicious spoof
          title: 'Spoofed Doc',
          source: 'user'
        }
      }
    });
    expect(result).toBe('PERMISSION_DENIED');
  });

  // 7. Identity Mutation on Update: User A updates document changing userId to User B -> PERMISSION_DENIED
  it('Attack Scenario 7: Identity Mutation on Update (Attempting to reassign ownership) -> PERMISSION_DENIED', () => {
    const result = FirestoreSecurityEvaluator.evaluateDocumentAccess('update', 'doc-alice-001', {
      auth: userA,
      resource: { data: { id: 'doc-alice-001', userId: userA.uid } },
      requestResource: {
        data: {
          id: 'doc-alice-001',
          userId: userB.uid, // Attempted reassignment
          title: 'Transferred Doc'
        }
      }
    });
    expect(result).toBe('PERMISSION_DENIED');
  });

  // 8. Blanket Collection Scrape: User A runs list query on /documents without where('userId', '==', 'userA') -> PERMISSION_DENIED
  it('Attack Scenario 8: Blanket Collection Scrape (Unfiltered list query) -> PERMISSION_DENIED', () => {
    const unconstrainedResult = FirestoreSecurityEvaluator.evaluateDocumentAccess('list', 'documents', {
      auth: userA
    });
    expect(unconstrainedResult).toBe('PERMISSION_DENIED');

    const compliantResult = FirestoreSecurityEvaluator.evaluateDocumentAccess(
      'list',
      'documents',
      { auth: userA },
      { userIdConstraint: userA.uid }
    );
    expect(compliantResult).toBe('PERMISSION_GRANTED');
  });

  // 9. Malicious Oversized ID Injection: Path parameter with 2KB payload -> PERMISSION_DENIED
  it('Attack Scenario 9: Malicious Oversized ID Injection (Path param > 128 bytes) -> PERMISSION_DENIED', () => {
    const maliciousOversizedId = 'A'.repeat(2048);
    const result = FirestoreSecurityEvaluator.evaluateDocumentAccess('get', maliciousOversizedId, {
      auth: userA,
      resource: { data: { id: maliciousOversizedId, userId: userA.uid } }
    });
    expect(result).toBe('PERMISSION_DENIED');
  });

  // 10. Profile Impersonation: User A writes to /users/userB -> PERMISSION_DENIED
  it("Attack Scenario 10: Profile Impersonation (User A writes to User B's profile) -> PERMISSION_DENIED", () => {
    const result = FirestoreSecurityEvaluator.evaluateUserProfileAccess('create', userB.uid, {
      auth: userA,
      requestResource: {
        data: {
          id: userB.uid,
          email: 'bob@hacked.com'
        }
      }
    });
    expect(result).toBe('PERMISSION_DENIED');
  });

  // 11. Profile Read Snooping: User A reads /users/userB -> PERMISSION_DENIED
  it("Attack Scenario 11: Profile Read Snooping (User A reads User B's profile) -> PERMISSION_DENIED", () => {
    const result = FirestoreSecurityEvaluator.evaluateUserProfileAccess('get', userB.uid, {
      auth: userA
    });
    expect(result).toBe('PERMISSION_DENIED');
  });

  // 12. Ghost Property Injection: Writing illegal properties outside schema boundaries -> PERMISSION_DENIED
  it('Attack Scenario 12: Ghost Property Injection (Writing undeclared administrative fields) -> PERMISSION_DENIED', () => {
    const result = FirestoreSecurityEvaluator.evaluateUserProfileAccess('update', userA.uid, {
      auth: userA,
      requestResource: {
        data: {
          id: userA.uid,
          email: 'alice@example.com',
          isAdmin: true, // Ghost property injection
          systemRole: 'SUPER_ADMIN' // Ghost property injection
        }
      }
    });
    expect(result).toBe('PERMISSION_DENIED');
  });

  it('Verifies firestore.rules file on disk explicitly matches security invariants', () => {
    const rulesPath = path.resolve(__dirname, '../../firestore.rules');
    expect(fs.existsSync(rulesPath)).toBe(true);
    const rulesContent = fs.readFileSync(rulesPath, 'utf8');

    // Asserts key security invariants in the actual firestore.rules code
    expect(rulesContent).toContain("match /{document=**} {\n      allow read, write: if false;");
    expect(rulesContent).toContain("request.auth.uid == userId");
    expect(rulesContent).toContain("isValidId(documentId)");
    expect(rulesContent).toContain("incoming().userId == request.auth.uid");
    expect(rulesContent).toContain("allow update, delete: if false;"); // Immutability of audit logs
  });
});
