# Security Specification: CLAUSETRACE Firestore Security Model

## 1. Data Invariants
- A user document (`/documents/{docId}`) belongs strictly to the authenticated user who created it (`request.auth.uid == resource.data.userId`).
- A comparison record (`/comparisons/{compId}`) can only be viewed and modified by its owning user.
- A user profile (`/users/{userId}`) is strictly accessible by the owner `request.auth.uid == userId`.
- Cross-user document leakage, listing or modifications are strictly denied.
- Immutable fields such as `userId` and `id` cannot be altered once created.

## 2. The Dirty Dozen Payloads
1. **Unauthenticated Read on Documents**: `GET /documents/doc-123` with no auth -> `PERMISSION_DENIED`
2. **Unauthenticated Write on Documents**: `POST /documents/doc-123` with no auth -> `PERMISSION_DENIED`
3. **Cross-Tenant Document Access**: User A reads User B's `/documents/userB-doc` -> `PERMISSION_DENIED`
4. **Cross-Tenant Document Update**: User A modifies User B's `/documents/userB-doc` -> `PERMISSION_DENIED`
5. **Cross-Tenant Document Deletion**: User A deletes User B's `/documents/userB-doc` -> `PERMISSION_DENIED`
6. **Spoofed User ID Write**: User A creates document with `userId: 'user-B'` -> `PERMISSION_DENIED`
7. **Identity Mutation on Update**: User A updates document changing `userId` to User B -> `PERMISSION_DENIED`
8. **Blanket Collection Scrape**: User A runs list query on `/documents` without `where('userId', '==', 'userA')` -> `PERMISSION_DENIED`
9. **Malicious Oversized ID Injection**: Path parameter with 2KB payload -> `PERMISSION_DENIED`
10. **Profile Impersonation**: User A writes to `/users/userB` -> `PERMISSION_DENIED`
11. **Profile Read Snooping**: User A reads `/users/userB` -> `PERMISSION_DENIED`
12. **Ghost Property Injection**: Writing illegal properties outside schema boundaries -> `PERMISSION_DENIED`
