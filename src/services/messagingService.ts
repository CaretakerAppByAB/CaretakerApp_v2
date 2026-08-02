/**
 * src/services/messagingService.ts
 *
 * All Firestore operations for private messaging.
 *
 * FIRESTORE DATA STRUCTURE:
 *
 *   /users/{uid}
 *     name, email, handle
 *
 *   /conversations/{conversationId}
 *     participants:     [uid1, uid2]
 *     participantData:  { uid1: {name, handle}, uid2: {name, handle} }
 *     lastMessage:      string
 *     lastMessageAt:    number (unix ms)
 *     unreadCounts:     { uid1: number, uid2: number }
 *     createdAt:        number
 *
 *   /conversations/{conversationId}/messages/{messageId}
 *     senderId:   string
 *     senderName: string
 *     text:       string
 *     createdAt:  number
 *     timestamp:  serverTimestamp
 */

import {
  collection, doc, getDoc, setDoc, addDoc, updateDoc,
  query, where, orderBy, onSnapshot, getDocs,
  increment, serverTimestamp,
} from 'firebase/firestore';
import {db} from '../config/firebase';
import {UserProfile} from '../context/AuthContext';

// ── Types ──────────────────────────────────────────────────────────────────────

export interface Message {
  id:         string;
  senderId:   string;
  senderName: string;
  text:       string;
  createdAt:  number;
}

export interface ConversationSummary {
  id:           string;
  otherUser:    {uid: string; name: string; handle: string};
  lastMessage:  string;
  lastMessageAt:number;
  unread:       number;
}

// ── User lookup ────────────────────────────────────────────────────────────────
// Used in the "compose" flow: search for a teammate by their email address.

export const findUserByEmail = async (
  email: string,
): Promise<UserProfile | null> => {
  const q = query(
    collection(db, 'users'),
    where('email', '==', email.trim().toLowerCase()),
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  return snap.docs[0].data() as UserProfile;
};

// ── Get or create a conversation ───────────────────────────────────────────────
// The conversation ID is always the two UIDs sorted and joined with '_'.
// This guarantees both sides look up the exact same Firestore document,
// and that only one conversation can ever exist between two users.

export const getOrCreateConversation = async (
  currentUser: UserProfile,
  otherUser:   UserProfile,
): Promise<string> => {
  const id   = [currentUser.uid, otherUser.uid].sort().join('_');
  const ref  = doc(db, 'conversations', id);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    await setDoc(ref, {
      participants: [currentUser.uid, otherUser.uid],
      participantData: {
        [currentUser.uid]: {name: currentUser.name, handle: currentUser.handle},
        [otherUser.uid]:   {name: otherUser.name,   handle: otherUser.handle},
      },
      lastMessage:   '',
      lastMessageAt: Date.now(),
      unreadCounts: {
        [currentUser.uid]: 0,
        [otherUser.uid]:   0,
      },
      createdAt: Date.now(),
    });
  }

  return id;
};

// ── Real-time inbox ────────────────────────────────────────────────────────────
// Fires immediately with current conversations, then updates live.

export const subscribeToConversations = (
  userId:   string,
  onUpdate: (convs: ConversationSummary[]) => void,
  onError:  (err: Error) => void,
): (() => void) => {
  const q = query(
    collection(db, 'conversations'),
    where('participants', 'array-contains', userId),
  );

  return onSnapshot(
    q,
    snapshot => {
      const convs = snapshot.docs
        .map(d => {
          const data    = d.data();
          const otherUid = (data.participants as string[]).find(p => p !== userId) ?? '';
          const other    = data.participantData?.[otherUid] ?? {name: 'Unknown', handle: '@unknown'};
          return {
            id:            d.id,
            otherUser:     {uid: otherUid, name: other.name, handle: other.handle},
            lastMessage:   data.lastMessage ?? '',
            lastMessageAt: data.lastMessageAt ?? 0,
            unread:        data.unreadCounts?.[userId] ?? 0,
          } as ConversationSummary;
        })
        // Only show conversations that have at least one message
        .filter(c => c.lastMessage !== '')
        .sort((a, b) => b.lastMessageAt - a.lastMessageAt);

      onUpdate(convs);
    },
    onError,
  );
};

// ── Real-time messages ─────────────────────────────────────────────────────────

export const subscribeToMessages = (
  conversationId: string,
  onUpdate: (msgs: Message[]) => void,
  onError:  (err: Error) => void,
): (() => void) => {
  const q = query(
    collection(db, 'conversations', conversationId, 'messages'),
    orderBy('createdAt', 'asc'),
  );

  return onSnapshot(
    q,
    snapshot => {
      const msgs = snapshot.docs.map(d => ({
        id: d.id,
        ...d.data(),
      })) as Message[];
      onUpdate(msgs);
    },
    onError,
  );
};

// ── Send a message ─────────────────────────────────────────────────────────────

export const sendMessage = async (
  conversationId: string,
  senderId:       string,
  senderName:     string,
  receiverId:     string,
  text:           string,
): Promise<void> => {
  const now = Date.now();

  // 1. Add the message document to the subcollection
  await addDoc(
    collection(db, 'conversations', conversationId, 'messages'),
    {
      senderId,
      senderName,
      text:      text.trim(),
      createdAt: now,
      timestamp: serverTimestamp(),
    },
  );

  // 2. Update the conversation summary (shown in inbox)
  await updateDoc(doc(db, 'conversations', conversationId), {
    lastMessage:                   text.trim(),
    lastMessageAt:                 now,
    [`unreadCounts.${receiverId}`]: increment(1), // bump receiver's unread count
    [`unreadCounts.${senderId}`]:   0,             // sender always reads their own msg
  });
};

// ── Mark conversation as read ──────────────────────────────────────────────────
// Called when a user opens a conversation — resets their unread count to 0.

export const markConversationRead = async (
  conversationId: string,
  userId:         string,
): Promise<void> => {
  await updateDoc(doc(db, 'conversations', conversationId), {
    [`unreadCounts.${userId}`]: 0,
  });
};
