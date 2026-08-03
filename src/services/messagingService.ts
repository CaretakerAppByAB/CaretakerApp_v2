/**
 * src/services/messagingService.ts
 * Updated: added messageType support for Thank You Notes.
 */

import {
  collection, doc, getDoc, setDoc, addDoc, updateDoc,
  query, where, orderBy, onSnapshot, getDocs,
  increment, serverTimestamp,
} from 'firebase/firestore';
import {db} from '../config/firebase';
import {UserProfile} from '../context/AuthContext';

// ── Types ──────────────────────────────────────────────────────────────────────

export type MessageType = 'text' | 'thankYouNote';

export interface Message {
  id:           string;
  senderId:     string;
  senderName:   string;
  text:         string;
  createdAt:    number;
  messageType?: MessageType;
}

export interface ConversationSummary {
  id:            string;
  otherUser:     {uid: string; name: string; handle: string};
  lastMessage:   string;
  lastMessageAt: number;
  unread:        number;
}

// ── Device / user helpers ──────────────────────────────────────────────────────

export const findUserByEmail = async (email: string): Promise<UserProfile | null> => {
  const snap = await getDocs(
    query(collection(db, 'users'), where('email', '==', email.trim().toLowerCase())),
  );
  if (snap.empty) return null;
  return snap.docs[0].data() as UserProfile;
};

// ── Conversation management ────────────────────────────────────────────────────

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
      unreadCounts: {[currentUser.uid]: 0, [otherUser.uid]: 0},
      createdAt: Date.now(),
    });
  }
  return id;
};

// ── Real-time subscriptions ────────────────────────────────────────────────────

export const subscribeToConversations = (
  userId:   string,
  onUpdate: (convs: ConversationSummary[]) => void,
  onError:  (err: Error) => void,
): (() => void) => {
  const q = query(
    collection(db, 'conversations'),
    where('participants', 'array-contains', userId),
  );
  return onSnapshot(q, snapshot => {
    const convs = snapshot.docs
      .map(d => {
        const data     = d.data();
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
      .filter(c => c.lastMessage !== '')
      .sort((a, b) => b.lastMessageAt - a.lastMessageAt);
    onUpdate(convs);
  }, onError);
};

export const subscribeToMessages = (
  conversationId: string,
  onUpdate: (msgs: Message[]) => void,
  onError:  (err: Error) => void,
): (() => void) => {
  const q = query(
    collection(db, 'conversations', conversationId, 'messages'),
    orderBy('createdAt', 'asc'),
  );
  return onSnapshot(q, snapshot => {
    const msgs = snapshot.docs.map(d => ({id: d.id, ...d.data()})) as Message[];
    onUpdate(msgs);
  }, onError);
};

// ── Send message ───────────────────────────────────────────────────────────────
// messageType defaults to 'text'. Pass 'thankYouNote' for gratitude cards.

export const sendMessage = async (
  conversationId: string,
  senderId:       string,
  senderName:     string,
  receiverId:     string,
  text:           string,
  messageType:    MessageType = 'text',
): Promise<void> => {
  const now = Date.now();

  await addDoc(collection(db, 'conversations', conversationId, 'messages'), {
    senderId,
    senderName,
    text:        text.trim(),
    messageType,
    createdAt:   now,
    timestamp:   serverTimestamp(),
  });

  // Thank You Notes show a friendly label in the inbox preview
  const preview = messageType === 'thankYouNote' ? '💜 Thank You Note' : text.trim();

  await updateDoc(doc(db, 'conversations', conversationId), {
    lastMessage:                   preview,
    lastMessageAt:                 now,
    [`unreadCounts.${receiverId}`]: increment(1),
    [`unreadCounts.${senderId}`]:   0,
  });
};

export const markConversationRead = async (
  conversationId: string,
  userId:         string,
): Promise<void> => {
  await updateDoc(doc(db, 'conversations', conversationId), {
    [`unreadCounts.${userId}`]: 0,
  });
};
