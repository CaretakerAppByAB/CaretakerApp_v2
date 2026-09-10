/**
 * src/services/supportService.ts
 *
 * Firestore operations for "Get Support" requests. Every request is posted
 * anonymously to the Community Forum's Help/Advice tab so the whole app can
 * offer input; the author manages it (views advice, marks it resolved) from
 * the Submitted Requests screen.
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
import {createPost, updatePostContent, setPostResolved, deletePost} from './communityService';

export type RequestStatus = 'open' | 'resolved';

export interface SupportRequestInput {
  title:       string;
  categories:  string[];
  description: string;
}

export interface SupportRequest extends SupportRequestInput {
  id:            string;
  authorId:      string;
  authorName:    string;
  postId:        string;   // linked Help/Advice community post
  expandedReach: boolean;
  status:        RequestStatus;
  createdAt:     number;
}

const buildPostContent = (input: SupportRequestInput): string => {
  const tags = input.categories.length ? `[${input.categories.join(', ')}]\n` : '';
  const body = input.description.trim() ? `\n\n${input.description.trim()}` : '';
  return `${tags}${input.title.trim()}${body}`;
};

export const createSupportRequest = async (
  authorId:   string,
  authorName: string,
  input:      SupportRequestInput,
  imageUrl?:  string,
): Promise<{id: string; postId: string}> => {
  // Support requests are always public and posted anonymously — no
  // authorPhotoURL is passed to createPost so the post stays anonymous.
  const postId = await createPost('Anonymous', buildPostContent(input), 'Help/Advice', imageUrl);

  const ref = await addDoc(collection(db, 'supportRequests'), {
    authorId,
    authorName,
    postId,
    title:         input.title.trim(),
    categories:    input.categories,
    description:   input.description.trim(),
    expandedReach: false,
    status:        'open' as RequestStatus,
    createdAt:     Date.now(),
    timestamp:     serverTimestamp(),
  });
  return {id: ref.id, postId};
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

export const resolveSupportRequest = async (requestId: string, postId: string): Promise<void> => {
  await updateDoc(doc(db, 'supportRequests', requestId), {status: 'resolved' as RequestStatus});
  await setPostResolved(postId, true).catch(() => {});
};

export const updateSupportRequest = async (
  requestId: string,
  postId:    string,
  input:     SupportRequestInput,
  imageUrl?: string,
): Promise<void> => {
  await updateDoc(doc(db, 'supportRequests', requestId), {
    title:       input.title.trim(),
    categories:  input.categories,
    description: input.description.trim(),
  });
  await updatePostContent(postId, buildPostContent(input), imageUrl).catch(() => {});
};

export const setExpandedReach = async (
  requestId: string,
  expanded:  boolean,
): Promise<void> => {
  await updateDoc(doc(db, 'supportRequests', requestId), {expandedReach: expanded});
};

export const deleteSupportRequest = async (requestId: string, postId: string): Promise<void> => {
  await deleteDoc(doc(db, 'supportRequests', requestId));
  await deletePost(postId).catch(() => {});
};
