/**
 * src/services/communityService.ts
 *
 * All Firestore operations for the Community Forum.
 * Every function here talks to Firebase — keep this file as the single
 * place where database calls happen so it is easy to modify later.
 */

import {
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  limit,
  updateDoc,
  doc,
  arrayUnion,
  arrayRemove,
  increment,
  serverTimestamp,
} from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {db} from '../config/firebase';

// ── Types ──────────────────────────────────────────────────────────────────────

export type TabName = 'Trending' | 'Following' | 'Events';

export interface Post {
  id:           string;
  authorId:     string;    // unique device ID (not a real user ID yet)
  authorName:   string;
  authorHandle: string;
  content:      string;
  tab:          TabName;
  likedBy:      string[];  // list of deviceIds who liked this post
  likeCount:    number;
  commentCount: number;
  createdAt:    number;    // Unix timestamp — used for ordering
}

// ── Device ID ──────────────────────────────────────────────────────────────────
//
// Each device generates a unique ID the first time the app runs.
// This ID is saved to AsyncStorage so it survives app restarts.
//
// It serves as a "user identity" for this testing phase — enough to track
// which posts you've liked. In production, replace this with a real Firebase
// Auth UID.

let _cachedId: string | null = null;

export const getDeviceId = async (): Promise<string> => {
  if (_cachedId) return _cachedId;

  try {
    const stored = await AsyncStorage.getItem('@alz_device_id');
    if (stored) {
      _cachedId = stored;
      return stored;
    }
  } catch (_) {}

  const id = `dev_${Math.random().toString(36).slice(2, 10)}_${Date.now()}`;
  try { await AsyncStorage.setItem('@alz_device_id', id); } catch (_) {}
  _cachedId = id;
  return id;
};

// ── Real-time subscription ─────────────────────────────────────────────────────
//
// Firestore's onSnapshot fires immediately with existing data, then fires
// again every time any post changes anywhere in the database.
//
// IMPORTANT: this function returns an "unsubscribe" function.
// You must call it when the component unmounts to stop listening.
// React's useEffect return value handles this automatically.

export const subscribeToPosts = (
  tab: TabName,
  onUpdate: (posts: Post[]) => void,
  onError:  (err: Error)    => void,
): (() => void) => {

  // We fetch ALL posts ordered by creation time (newest first).
  // We do NOT use a `where` clause here because combining where() +
  // orderBy() requires a Firestore composite index, which needs extra
  // setup. Filtering by tab is done client-side below instead.
  const q = query(
    collection(db, 'posts'),
    orderBy('createdAt', 'desc'),
    limit(100),
  );

  return onSnapshot(
    q,
    snapshot => {
      // Map each Firestore document to our Post type.
      // The defaults (likedBy: [], likeCount: 0, etc.) protect against
      // documents that were created before those fields existed.
      const all = snapshot.docs.map(d => ({
        likedBy:      [],
        likeCount:    0,
        commentCount: 0,
        tab:          'Trending' as TabName,
        ...d.data(),
        id: d.id,
      })) as Post[];

      let result: Post[];
      if (tab === 'Trending') {
        // All posts, sorted so the most-liked appear first
        result = [...all].sort((a, b) => b.likeCount - a.likeCount);
      } else if (tab === 'Events') {
        // Only posts the author tagged as Events, newest first
        result = all.filter(p => p.tab === 'Events');
      } else {
        // Following: show everything newest-first
        // (in production you'd filter by who the user follows)
        result = all;
      }

      onUpdate(result);
    },
    onError,
  );
};

// ── Create a new post ──────────────────────────────────────────────────────────

export const createPost = async (
  authorName: string,
  content:    string,
  tab:        TabName,
): Promise<void> => {
  const authorId = await getDeviceId();

  // Build @handle from the display name
  const handle =
    '@' +
    authorName
      .toLowerCase()
      .replace(/\s+/g, '.')
      .replace(/[^a-z0-9.]/g, '') || 'user';

  await addDoc(collection(db, 'posts'), {
    authorId,
    authorName,
    authorHandle: handle,
    content:      content.trim(),
    tab,
    likedBy:      [],
    likeCount:    0,
    commentCount: 0,
    createdAt:    Date.now(),        // client timestamp — used for ordering
    timestamp:    serverTimestamp(), // server timestamp — more accurate, set by Firebase
  });
};

// ── Toggle like ────────────────────────────────────────────────────────────────
//
// arrayUnion / arrayRemove update the likedBy array atomically in Firestore
// (no race conditions even if two people like at the exact same time).
// increment() adjusts the counter by +1 or -1 atomically as well.

export const toggleLike = async (
  postId:         string,
  currentlyLiked: boolean,
): Promise<void> => {
  const userId = await getDeviceId();
  await updateDoc(doc(db, 'posts', postId), {
    likedBy:   currentlyLiked ? arrayRemove(userId) : arrayUnion(userId),
    likeCount: increment(currentlyLiked ? -1 : 1),
  });
};
