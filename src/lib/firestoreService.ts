import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  query, 
  where,
  onSnapshot
} from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from './firebase';
import { LegalDocument, UserProfile, DocumentComparison, ChecklistItem, Finding } from '../types';

// Save or sync User Profile
export async function syncUserProfileToFirestore(user: UserProfile): Promise<void> {
  if (!auth.currentUser || auth.currentUser.uid !== user.id) {
    return;
  }
  const path = `users/${user.id}`;
  try {
    const userDocRef = doc(db, 'users', user.id);
    await setDoc(userDocRef, {
      id: user.id,
      name: user.name || 'User',
      email: user.email,
      avatarUrl: user.avatarUrl || '',
      accountType: user.accountType,
      provider: user.provider,
      updatedAt: new Date().toISOString(),
    }, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

// Save or Full Update a Document in Firestore
export async function saveDocumentToFirestore(userId: string, document: LegalDocument): Promise<void> {
  if (!auth.currentUser || auth.currentUser.uid !== userId) {
    return;
  }
  const path = `documents/${document.id}`;
  try {
    const docRef = doc(db, 'documents', document.id);
    const dataToSave = {
      ...document,
      userId,
      source: 'user',
      updatedAt: new Date().toISOString(),
    };
    await setDoc(docRef, dataToSave, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

// Partial Update: Update only checklist items to conserve bandwidth and minimize write overhead
export async function updateDocumentChecklistInFirestore(
  userId: string, 
  documentId: string, 
  checklist: ChecklistItem[]
): Promise<void> {
  if (!auth.currentUser || auth.currentUser.uid !== userId) {
    return;
  }
  const path = `documents/${documentId}`;
  try {
    const docRef = doc(db, 'documents', documentId);
    await updateDoc(docRef, {
      checklist,
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
  }
}

// Partial Update: Update specific findings array or status without transmitting whole base64/pages
export async function updateDocumentFindingsInFirestore(
  userId: string,
  documentId: string,
  findings: Finding[]
): Promise<void> {
  if (!auth.currentUser || auth.currentUser.uid !== userId) {
    return;
  }
  const path = `documents/${documentId}`;
  try {
    const docRef = doc(db, 'documents', documentId);
    await updateDoc(docRef, {
      findings,
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
  }
}

// Delete a Document from Firestore
export async function deleteDocumentFromFirestore(documentId: string): Promise<void> {
  if (!auth.currentUser) {
    return;
  }
  const path = `documents/${documentId}`;
  try {
    const docRef = doc(db, 'documents', documentId);
    await deleteDoc(docRef);
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

// Fetch all documents for the current user
export async function getUserDocumentsFromFirestore(userId: string): Promise<LegalDocument[]> {
  if (!auth.currentUser || auth.currentUser.uid !== userId) {
    return [];
  }
  const path = 'documents';
  try {
    const q = query(
      collection(db, 'documents'),
      where('userId', '==', userId)
    );
    const snapshot = await getDocs(q);
    const docs: LegalDocument[] = [];
    snapshot.forEach((snap) => {
      docs.push(snap.data() as LegalDocument);
    });
    return docs;
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, path);
    return [];
  }
}

// Subscribe to user documents in real time
export function subscribeUserDocuments(
  userId: string, 
  onDocsChanged: (docs: LegalDocument[]) => void,
  onError?: (err: any) => void
) {
  if (!auth.currentUser || auth.currentUser.uid !== userId) {
    return () => {};
  }
  const path = 'documents';
  const q = query(
    collection(db, 'documents'),
    where('userId', '==', userId)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const docs: LegalDocument[] = [];
      snapshot.forEach((docSnap) => {
        docs.push(docSnap.data() as LegalDocument);
      });
      onDocsChanged(docs);
    },
    (err) => {
      handleFirestoreError(err, OperationType.GET, path);
      if (onError) onError(err);
    }
  );
}

// Save a Document Comparison
export async function saveComparisonToFirestore(userId: string, comparison: DocumentComparison): Promise<void> {
  if (!auth.currentUser || auth.currentUser.uid !== userId) {
    return;
  }
  const path = `comparisons/${comparison.id}`;
  try {
    const compRef = doc(db, 'comparisons', comparison.id);
    await setDoc(compRef, {
      ...comparison,
      userId,
      updatedAt: new Date().toISOString(),
    }, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}
