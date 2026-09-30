/**
 * src/services/resourceMatcher.ts
 *
 * Three-layer mapping from journal text to mental health resources:
 *
 *   1. keywords  — words/phrases found in the user's journal   (keywords.csv)
 *   2. emotions  — each keyword points at an emotion            (emotions.csv)
 *   3. resources — each resource is tagged with emotions        (resources.csv)
 *
 * The data lives in /resources/*.csv and is compiled into
 * src/data/resourceData.generated.ts by `npm run build:resources`.
 *
 * PRIVACY: this runs entirely on-device against already-decrypted entries.
 * Nothing about the matches is stored or sent anywhere.
 */

// ── Types ──────────────────────────────────────────────────────────────────────

export type ResourceType = 'article' | 'podcast' | 'video' | 'hotline' | 'tool' | 'book';

export interface Emotion {
  id:        string;
  label:     string;
  isCrisis:  boolean;  // crisis emotions ignore negation and always surface first
  sortOrder: number;
}

export interface EmotionKeyword {
  keyword:   string;   // lowercase; `*` = "any letters" (stress* → stressed, stressful)
  emotionId: string;
  weight:    number;
}

export interface Resource {
  id:            string;
  title:         string;
  type:          ResourceType;
  source:        string;
  url?:          string;
  phone?:        string;
  emotionIds:    string[];
  lastVerified?: string;
}

export interface EmotionScore {
  emotionId: string;
  score:     number;
  keywords:  string[];  // distinct keywords that contributed
}

export interface ScorableEntry {
  content:   string;
  createdAt: number;
}

// ── Tuning ─────────────────────────────────────────────────────────────────────

export const MATCH_CONFIG = {
  lookbackDays:  14,  // only entries newer than this are scanned
  halfLifeDays:  7,   // an entry's weight halves every N days
  minScore:      2,   // an emotion needs at least this score to be suggested
  maxSuggested:  3,   // max non-crisis emotions shown under "For you"
  negationWindow: 3,  // words before a keyword checked for "not", "never", …
};

// "can't" is deliberately absent: "I can't stop worrying" is not a negation of worrying.
const NEGATORS = new Set([
  'not', 'no', 'never', 'hardly', 'less',
  "isn't", "wasn't", "aren't", "weren't", "don't", "didn't", "doesn't", "haven't", "hasn't",
]);

// ── Layer 1: keyword extraction ────────────────────────────────────────────────

interface CompiledKeyword extends EmotionKeyword {
  regex: RegExp;
}

const escapeRegex = (s: string) => s.replace(/[.+?^${}()|[\]\\]/g, '\\$&');

export const normalizeText = (text: string) =>
  text.toLowerCase().replace(/[‘’]/g, "'").replace(/\s+/g, ' ');

/** Group 1 captures the leading boundary so the keyword's start index can be recovered without lookbehind. */
export const compileKeywords = (keywords: EmotionKeyword[]): CompiledKeyword[] =>
  keywords.map(k => {
    const body = escapeRegex(k.keyword)
      .replace(/\*/g, "[a-z']*")
      .replace(/ /g, '\\s+');
    return {...k, regex: new RegExp(`(^|[^a-z0-9'])(${body})(?![a-z0-9])`, 'g')};
  });

const isNegated = (text: string, matchStart: number) => {
  // Only look back within the current clause.
  const clause = text.slice(0, matchStart).split(/[.!?;,\n]/).pop() ?? '';
  const words = clause.trim().split(/\s+/).slice(-MATCH_CONFIG.negationWindow);
  return words.some(w => NEGATORS.has(w));
};

/** Distinct keywords (per emotion) found in one piece of text. */
export const findKeywordMatches = (
  text:     string,
  compiled: CompiledKeyword[],
  crisisIds: Set<string>,
): EmotionKeyword[] => {
  const normalized = normalizeText(text);
  const found: EmotionKeyword[] = [];

  for (const k of compiled) {
    k.regex.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = k.regex.exec(normalized))) {
      const start = m.index + m[1].length;
      // Crisis language is never discounted by negation. Err on the side of showing help.
      if (crisisIds.has(k.emotionId) || !isNegated(normalized, start)) {
        found.push(k);
        break;
      }
    }
  }
  return found;
};

// ── Layer 2: keywords → emotion scores ─────────────────────────────────────────

export const scoreEmotions = (
  entries:  ScorableEntry[],
  keywords: EmotionKeyword[],
  emotions: Emotion[],
  now:      number = Date.now(),
): EmotionScore[] => {
  const DAY = 24 * 60 * 60 * 1000;
  const compiled = compileKeywords(keywords);
  const crisisIds = new Set(emotions.filter(e => e.isCrisis).map(e => e.id));
  const scores = new Map<string, {score: number; keywords: Set<string>}>();

  for (const entry of entries) {
    const ageDays = Math.max(0, (now - entry.createdAt) / DAY);
    if (ageDays > MATCH_CONFIG.lookbackDays || !entry.content) continue;
    const recency = Math.pow(0.5, ageDays / MATCH_CONFIG.halfLifeDays);

    for (const k of findKeywordMatches(entry.content, compiled, crisisIds)) {
      const s = scores.get(k.emotionId) ?? {score: 0, keywords: new Set<string>()};
      s.score += k.weight * recency;
      s.keywords.add(k.keyword);
      scores.set(k.emotionId, s);
    }
  }

  const ranked = [...scores.entries()]
    .map(([emotionId, s]) => ({emotionId, score: s.score, keywords: [...s.keywords]}))
    .sort((a, b) => b.score - a.score);

  // Any crisis match surfaces regardless of score; everything else must clear the threshold.
  const crisis = ranked.filter(s => crisisIds.has(s.emotionId));
  const rest = ranked
    .filter(s => !crisisIds.has(s.emotionId) && s.score >= MATCH_CONFIG.minScore)
    .slice(0, MATCH_CONFIG.maxSuggested);
  return [...crisis, ...rest];
};

// ── Layer 3: emotions → resources ──────────────────────────────────────────────

/** Hotlines first, then in CSV order. */
export const resourcesForEmotion = (emotionId: string, resources: Resource[]): Resource[] =>
  resources
    .filter(r => r.emotionIds.includes(emotionId))
    .sort((a, b) => Number(b.type === 'hotline') - Number(a.type === 'hotline'));
