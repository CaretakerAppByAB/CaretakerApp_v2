/**
 * src/services/messagingService.ts
 *
 * PHI PROTECTION:
 * Message bodies and inbox previews are end-to-end encrypted with NaCl box
 * (see e2eService.ts). Firestore stores only ciphertext. Neither Google nor
 * your team can read message contents.
 */

import {
  collection, doc, getDoc, setDoc, addDoc, updateDoc,
  query, where, orderBy, onSnapshot, getDocs,
  increment, serverTimestamp,
} from 'firebase/firestore';
import {db} from '../config/firebase';
import {UserProfile} from '../context/AuthContext';
import {encryptForUser, decryptFromUser, ensureKeyPair} from './e2eService';

// ── Types ──────────────────────────────────────────────────────────────────────

export type MessageType = 'text' | 'thankYouNote' | 'image';

export interface Message {
  id:           string;
  senderId:     string;
  senderName:   string;
  text:         string;        // decrypted in memory
  imageUrl?:    string;        // decrypted in memory — only set for messageType 'image'
  createdAt:    number;
  messageType?: MessageType;
  wasEncrypted?: boolean;
}

export interface ConversationSummary {
  id:            string;
  otherUser:     {uid: string; name: string; handle: string; photoURL?: string};
  lastMessage:   string;       // decrypted in memory
  lastMessageAt: number;
  unread:        number;
}

// ── User lookup ────────────────────────────────────────────────────────────────

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
  // Make sure this device has a keypair before any messaging happens
  await ensureKeyPair(currentUser.uid);

  const id   = [currentUser.uid, otherUser.uid].sort().join('_');
  const ref  = doc(db, 'conversations', id);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    await setDoc(ref, {
      participants: [currentUser.uid, otherUser.uid],
      participantData: {
        [currentUser.uid]: {name: currentUser.name, handle: currentUser.handle, photoURL: currentUser.profilePhotoURL ?? ''},
        [otherUser.uid]:   {name: otherUser.name,   handle: otherUser.handle,   photoURL: otherUser.profilePhotoURL ?? ''},
      },
      lastMessage:   '',
      lastMessageAt: Date.now(),
      unreadCounts:  {[currentUser.uid]: 0, [otherUser.uid]: 0},
      createdAt:     Date.now(),
    });
  }
  return id;
};

// ── Inbox subscription (decrypts previews) ─────────────────────────────────────

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
    async snapshot => {
      try {
        const convs = await Promise.all(
          snapshot.docs.map(async d => {
            const data     = d.data();
            const otherUid = (data.participants as string[]).find(p => p !== userId) ?? '';
            const other    = data.participantData?.[otherUid] ?? {name: 'Unknown', handle: '@unknown', photoURL: ''};

            // Decrypt the inbox preview
            const lastMessage = await decryptFromUser(
              data.lastMessage ?? '', userId, otherUid,
            );

            return {
              id:            d.id,
              otherUser:     {uid: otherUid, name: other.name, handle: other.handle, photoURL: other.photoURL || undefined},
              lastMessage,
              lastMessageAt: data.lastMessageAt ?? 0,
              unread:        data.unreadCounts?.[userId] ?? 0,
            } as ConversationSummary;
          }),
        );

        onUpdate(
          convs
            .filter(c => c.lastMessage !== '')
            .sort((a, b) => b.lastMessageAt - a.lastMessageAt),
        );
      } catch (err: any) {
        onError(err);
      }
    },
    onError,
  );
};

// ── Message subscription (decrypts bodies) ─────────────────────────────────────

export const subscribeToMessages = (
  conversationId: string,
  myUserId:       string,
  otherUserId:    string,
  onUpdate:       (msgs: Message[]) => void,
  onError:        (err: Error) => void,
): (() => void) => {
  const q = query(
    collection(db, 'conversations', conversationId, 'messages'),
    orderBy('createdAt', 'asc'),
  );

  return onSnapshot(
    q,
    async snapshot => {
      try {
        const msgs = await Promise.all(
          snapshot.docs.map(async d => {
            const data = d.data();
            const text = await decryptFromUser(data.text ?? '', myUserId, otherUserId);
            const imageUrl = data.imageUrl
              ? await decryptFromUser(data.imageUrl, myUserId, otherUserId)
              : undefined;
            return {
              id:           d.id,
              senderId:     data.senderId,
              senderName:   data.senderName,
              text,
              imageUrl,
              createdAt:    data.createdAt ?? 0,
              messageType:  data.messageType ?? 'text',
              wasEncrypted: data.encrypted ?? false,
            } as Message;
          }),
        );
        onUpdate(msgs);
      } catch (err: any) {
        onError(err);
      }
    },
    onError,
  );
};

// ── Send ───────────────────────────────────────────────────────────────────────

export const sendMessage = async (
  conversationId: string,
  senderId:       string,
  senderName:     string,
  receiverId:     string,
  text:           string,
  messageType:    MessageType = 'text',
  imageUrl?:      string,
): Promise<void> => {
  const now = Date.now();

  // Encrypt the body for the recipient (readable by both parties only)
  const {ciphertext, encrypted} = await encryptForUser(text.trim(), senderId, receiverId);

  // The image itself lives in Firebase Storage as a plain file (not E2E
  // encrypted); only the pointer to it is encrypted here, same as the text.
  let encImageUrl: string | undefined;
  if (imageUrl) {
    const {ciphertext: encUrl} = await encryptForUser(imageUrl, senderId, receiverId);
    encImageUrl = encUrl;
  }

  await addDoc(collection(db, 'conversations', conversationId, 'messages'), {
    senderId,
    senderName,
    text:        ciphertext,
    ...(encImageUrl ? {imageUrl: encImageUrl} : {}),
    encrypted,
    messageType,
    createdAt:   now,
    timestamp:   serverTimestamp(),
  });

  // Encrypt the inbox preview too — otherwise message content leaks into
  // the conversation document in plaintext.
  const previewPlain = messageType === 'thankYouNote'
    ? 'Thank You Note'
    : messageType === 'image'
    ? (text.trim() ? `📷 ${text.trim()}` : '📷 Photo')
    : text.trim();
  const {ciphertext: encPreview} = await encryptForUser(previewPlain, senderId, receiverId);

  await updateDoc(doc(db, 'conversations', conversationId), {
    lastMessage:                    encPreview,
    lastMessageAt:                  now,
    [`unreadCounts.${receiverId}`]: increment(1),
    [`unreadCounts.${senderId}`]:   0,
  });
};

// ── Read receipts ──────────────────────────────────────────────────────────────

export const markConversationRead = async (
  conversationId: string,
  userId:         string,
): Promise<void> => {
  await updateDoc(doc(db, 'conversations', conversationId), {
    [`unreadCounts.${userId}`]: 0,
  });
};
