/**
 * src/services/journalService.ts
 *
 * All Firestore operations for the Journal feature.
 *
 * PHI PROTECTION:
 * Entry content and prompts are encrypted client-side (AES-256) before being
 * written to Firestore, and decrypted on read. Firestore never receives
 * plaintext. See cryptoService.ts for details.
 *
 * FIRESTORE RULE (Firebase Console -> Firestore -> Rules):
 *   match /journals/{userId}/entries/{entryId} {
 *     allow read, write: if request.auth != null && request.auth.uid == userId;
 *   }
 */

import {
  collection, doc, addDoc, updateDoc, deleteDoc,
  onSnapshot, query, orderBy, limit, serverTimestamp,
} from 'firebase/firestore';
import {db} from '../config/firebase';
import {encryptText, decryptText} from './cryptoService';

// ── Types ──────────────────────────────────────────────────────────────────────

export type JournalType = 'guided' | 'freeWrite';

export interface JournalEntry {
  id:        string;
  userId:    string;
  type:      JournalType;
  prompt:    string;   // decrypted in memory
  content:   string;   // decrypted in memory
  starred:   boolean;
  createdAt: number;
  updatedAt: number;
}

// ── Guided prompts ─────────────────────────────────────────────────────────────

export const GUIDED_PROMPTS = [
  'What are you most grateful for today?',
  'What challenged you today, and how did you navigate it?',
  'Describe a moment that brought you joy or peace today.',
  'What do you wish others understood about your caregiving journey?',
  'What self-care did you practice this week?',
  'What would you tell your past self when you first became a caregiver?',
  'What strength have you discovered in yourself through this experience?',
  'How has caregiving changed your perspective on life?',
  'Write about a small victory you are celebrating today.',
  'What do you need more of in your life right now?',
  'Describe how you are feeling right now — honestly, without judgment.',
  'Write a letter to your loved one that you may never send.',
];

// ── Create ─────────────────────────────────────────────────────────────────────

export const createEntry = async (
  userId:  string,
  type:    JournalType,
  prompt:  string,
  content: string,
): Promise<string> => {
  const now = Date.now();

  // Encrypt PHI-bearing fields before they leave the device
  const [encContent, encPrompt] = await Promise.all([
    encryptText(content.trim(), userId),
    encryptText(prompt, userId),
  ]);

  const ref = await addDoc(collection(db, 'journals', userId, 'entries'), {
    userId,
    type,
    prompt:    encPrompt,
    content:   encContent,
    encrypted: true,          // flag for future migrations
    starred:   false,
    createdAt: now,
    updatedAt: now,
    timestamp: serverTimestamp(),
  });
  return ref.id;
};

// ── Update ─────────────────────────────────────────────────────────────────────

export const updateEntry = async (
  userId:  string,
  entryId: string,
  content: string,
): Promise<void> => {
  const encContent = await encryptText(content.trim(), userId);
  await updateDoc(doc(db, 'journals', userId, 'entries', entryId), {
    content:   encContent,
    encrypted: true,
    updatedAt: Date.now(),
  });
};

// ── Star / delete ──────────────────────────────────────────────────────────────

export const toggleStar = async (
  userId:         string,
  entryId:        string,
  currentStarred: boolean,
): Promise<void> => {
  await updateDoc(doc(db, 'journals', userId, 'entries', entryId), {
    starred: !currentStarred,
  });
};

export const deleteEntry = async (
  userId:  string,
  entryId: string,
): Promise<void> => {
  await deleteDoc(doc(db, 'journals', userId, 'entries', entryId));
};

// ── Real-time subscription (decrypts on the way out) ───────────────────────────

export const subscribeToEntries = (
  userId:   string,
  onUpdate: (entries: JournalEntry[]) => void,
  onError:  (err: Error) => void,
): (() => void) => {
  const q = query(
    collection(db, 'journals', userId, 'entries'),
    orderBy('createdAt', 'desc'),
    limit(100),
  );

  return onSnapshot(
    q,
    async snap => {
      try {
        const entries = await Promise.all(
          snap.docs.map(async d => {
            const data = d.data();
            // Decrypt on-device. Legacy plaintext entries pass through unchanged.
            const [content, prompt] = await Promise.all([
              decryptText(data.content ?? '', userId),
              decryptText(data.prompt  ?? '', userId),
            ]);
            return {
              id:        d.id,
              userId:    data.userId,
              type:      data.type,
              prompt,
              content,
              starred:   data.starred   ?? false,
              createdAt: data.createdAt ?? 0,
              updatedAt: data.updatedAt ?? 0,
            } as JournalEntry;
          }),
        );
        onUpdate(entries);
      } catch (err: any) {
        onError(err);
      }
    },
    onError,
  );
};
