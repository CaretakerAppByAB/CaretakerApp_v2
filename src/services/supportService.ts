/**
 * src/services/supportService.ts
 *
 * Firestore operations for "Get Support" requests — a caregiver asking
 * their circle, local community, or the whole app for help.
 */

import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  limit,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';
import {db} from '../config/firebase';

export type RequestScope  = 'circle' | 'local' | 'public';
export type RequestStatus = 'open' | 'resolved';

export interface SupportRequestInput {
  title:       string;
  categories:  string[];
  description: string;
  scope:       RequestScope;
  anonymous:   boolean;
}

export interface SupportRequest extends SupportRequestInput {
  id:            string;
  authorId:      string;
  authorName:    string;
  expandedReach: boolean;
  status:        RequestStatus;
  createdAt:     number;
}

export const createSupportRequest = async (
  authorId:   string,
  authorName: string,
  input:      SupportRequestInput,
): Promise<string> => {
  const ref = await addDoc(collection(db, 'supportRequests'), {
    authorId,
    authorName,
    title:         input.title.trim(),
    categories:    input.categories,
    description:   input.description.trim(),
    scope:         input.scope,
    anonymous:     input.anonymous,
    expandedReach: false,
    status:        'open' as RequestStatus,
    createdAt:     Date.now(),
    timestamp:     serverTimestamp(),
  });
  return ref.id;
};

// ── This user's requests ("Submitted Requests" screen) ──────────────────────────

export const subscribeToMyRequests = (
  authorId: string,
  onUpdate: (requests: SupportRequest[]) => void,
  onError:  (err: Error) => void,
): (() => void) => {
  // No orderBy here — combining where() + orderBy() on different fields needs
  // a composite Firestore index. We sort client-side instead (see below).
  const q = query(
    collection(db, 'supportRequests'),
    where('authorId', '==', authorId),
    limit(200),
  );
  return onSnapshot(
    q,
    snapshot => {
      const requests = snapshot.docs
        .map(d => ({...d.data(), id: d.id}) as SupportRequest)
        .sort((a, b) => b.createdAt - a.createdAt);
      onUpdate(requests);
    },
    onError,
  );
};

export const resolveSupportRequest = async (requestId: string): Promise<void> => {
  await updateDoc(doc(db, 'supportRequests', requestId), {status: 'resolved' as RequestStatus});
};

export const updateSupportRequest = async (
  requestId: string,
  input:     SupportRequestInput,
): Promise<void> => {
  await updateDoc(doc(db, 'supportRequests', requestId), {
    title:       input.title.trim(),
    categories:  input.categories,
    description: input.description.trim(),
    scope:       input.scope,
    anonymous:   input.anonymous,
  });
};

export const setExpandedReach = async (
  requestId: string,
  expanded:  boolean,
): Promise<void> => {
  await updateDoc(doc(db, 'supportRequests', requestId), {expandedReach: expanded});
};

export const deleteSupportRequest = async (requestId: string): Promise<void> => {
  await deleteDoc(doc(db, 'supportRequests', requestId));
};
