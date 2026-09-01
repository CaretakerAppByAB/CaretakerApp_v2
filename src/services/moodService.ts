import AsyncStorage from '@react-native-async-storage/async-storage';
import {Colors} from '../theme/colors';

export type MoodType = 'VerySad' | 'Sad' | 'Neutral' | 'Happy' | 'VeryHappy';

export const MOOD_OPTIONS: {type: MoodType; label: string}[] = [
  {type: 'VerySad',   label: 'Very Sad'},
  {type: 'Sad',       label: 'Sad'},
  {type: 'Neutral',   label: 'Neutral'},
  {type: 'Happy',     label: 'Happy'},
  {type: 'VeryHappy', label: 'Very Happy'},
];

export const MOOD_COLORS: Record<MoodType, string> = {
  VerySad:   Colors.moodColors[0],
  Sad:       Colors.moodColors[1],
  Neutral:   Colors.moodColors[2],
  Happy:     Colors.moodColors[3],
  VeryHappy: Colors.moodColors[4],
};

/** 0 (low) – 1 (high) happiness score, used to plot the Mood Analysis chart. */
export const MOOD_HAPPINESS: Record<MoodType, number> = {
  VerySad:   0,
  Sad:       0.25,
  Neutral:   0.5,
  Happy:     0.75,
  VeryHappy: 1,
};

// ── AsyncStorage ───────────────────────────────────────────────────────────────

const toDateStr = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const moodKey  = (uid: string, ds: string) => `@alz_mood_${uid}_${ds}`;
const checkKey = (uid: string) => `@alz_mood_checkin_${uid}`;

export const saveMood = async (uid: string, date: Date, mood: MoodType) => {
  await AsyncStorage.setItem(moodKey(uid, toDateStr(date)), mood);
  await AsyncStorage.setItem(checkKey(uid), toDateStr(date));
};

export const getMoodForDate = async (uid: string, date: Date): Promise<MoodType | undefined> => {
  const val = await AsyncStorage.getItem(moodKey(uid, toDateStr(date)));
  return (val as MoodType) || undefined;
};

export const loadMonthMoods = async (
  uid: string, year: number, month: number,
): Promise<Record<number, MoodType>> => {
  const days  = new Date(year, month + 1, 0).getDate();
  const pairs = Array.from({length: days}, (_, i) => {
    const d = new Date(year, month, i + 1);
    return [moodKey(uid, toDateStr(d)), i + 1] as [string, number];
  });
  const results = await AsyncStorage.multiGet(pairs.map(p => p[0]));
  const out: Record<number, MoodType> = {};
  results.forEach(([, val], i) => { if (val) out[pairs[i][1]] = val as MoodType; });
  return out;
};

/** Monday (start of week) for the week containing `date`. */
export const getWeekStart = (date: Date): Date => {
  const d = new Date(date);
  const dow = (d.getDay() + 6) % 7; // 0 = Monday
  d.setDate(d.getDate() - dow);
  d.setHours(0, 0, 0, 0);
  return d;
};

/** Mon–Sun moods for the week starting at `weekStart`. Undefined entries mean no mood logged that day. */
export const loadWeekMoods = async (
  uid: string, weekStart: Date,
): Promise<(MoodType | undefined)[]> => {
  const days = Array.from({length: 7}, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    return d;
  });
  const results = await AsyncStorage.multiGet(days.map(d => moodKey(uid, toDateStr(d))));
  return results.map(([, val]) => (val as MoodType) || undefined);
};

export const shouldShowModal = async (uid: string): Promise<boolean> => {
  const last = await AsyncStorage.getItem(checkKey(uid));
  return last !== toDateStr(new Date());
};
