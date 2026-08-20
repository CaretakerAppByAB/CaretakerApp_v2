/**
 * src/services/userService.ts
 * Profile constants and Firestore helpers.
 */

import {doc, updateDoc, getDoc} from 'firebase/firestore';
import {db} from '../config/firebase';

export const PRONOUN_OPTIONS = [
  'He/Him', 'She/Her', 'They/Them',
  'He/They', 'She/They', 'Prefer not to say',
];

export const GOAL_OPTIONS = [
  'Manage caregiver stress',
  'Track my loved one health',
  'Connect with the community',
  'Find resources and support',
  'Document my caregiving journey',
  'Monitor mood and wellbeing',
  'Coordinate with the care team',
  'Plan and organize care',
  'Learn caregiving strategies',
  'Celebrate small victories',
];

export const RESPONSIBILITY_OPTIONS = [
  'Medical appointments',
  'Medication management',
  'Personal care',
  'Meal preparation',
  'Transportation',
  'Financial management',
  'Emotional support',
  'Home maintenance',
  'Overnight care',
  'Communication with doctors',
];

export const updateUserProfile = async (
  uid: string,
  data: Record<string, any>,
): Promise<void> => {
  await updateDoc(doc(db, 'users', uid), data);
};

export const completeProfileSetup = async (
  uid: string,
  data: Record<string, any>,
): Promise<void> => {
  await updateDoc(doc(db, 'users', uid), {
    ...data,
    profileComplete: true,
  });
};

export const fetchUserProfile = async (uid: string): Promise<any | null> => {
  const snap = await getDoc(doc(db, 'users', uid));
  return snap.exists() ? snap.data() : null;
};
