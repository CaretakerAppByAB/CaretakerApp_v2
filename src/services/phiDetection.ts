/**
 * src/services/phiDetection.ts
 *
 * Detects likely Protected Health Information (PHI) in free text and warns
 * the user before they save.
 *
 * WHY THIS EXISTS
 * Encryption protects data at rest and in transit, but HIPAA's Minimum
 * Necessary standard (45 CFR §164.502(b)) says you should not record more
 * identifying information than you actually need. The best protection for a
 * patient's identity is simply not writing it down.
 *
 * This module is a NUDGE, not a filter. It never blocks or modifies what the
 * user writes — it just points out identifiers they may want to remove, and
 * offers a one-tap way to replace them with initials.
 *
 * The 18 HIPAA identifiers are listed at 45 CFR §164.514(b)(2). This checks
 * the ones that realistically appear in a caregiver journal.
 */

// ── Types ──────────────────────────────────────────────────────────────────────

export type PHIType =
  | 'name' | 'phone' | 'email' | 'ssn' | 'mrn'
  | 'date' | 'address' | 'age90';

export interface PHIMatch {
  type:       PHIType;
  text:       string;
  index:      number;
  suggestion: string;
  label:      string;
}

// ── Common words that look like names but are not ─────────────────────────────

const NOT_NAMES = new Set([
  'I', 'My', 'Me', 'We', 'He', 'She', 'They', 'It', 'You',
  'Mom', 'Dad', 'Mother', 'Father', 'Mum', 'Grandma', 'Grandpa',
  'Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday',
  'January','February','March','April','May','June','July',
  'August','September','October','November','December',
  'Today','Tomorrow','Yesterday','Tonight','Morning','Evening',
  'God','Alzheimer','Alzheimers','Dementia','Doctor','Nurse','Hospital',
  'The','This','That','There','Then','When','What','Where','Why','How',
  'A','An','And','But','Or','So','If','As','At','By','For','From','In','Of','On','To','With',
]);

// ── Detection patterns ─────────────────────────────────────────────────────────

const PATTERNS: {
  type:  PHIType;
  label: string;
  regex: RegExp;
  suggest: (m: string) => string;
}[] = [
  {
    type: 'ssn',
    label: 'Social Security Number',
    regex: /\b\d{3}-\d{2}-\d{4}\b/g,
    suggest: () => '[SSN REMOVED]',
  },
  {
    type: 'phone',
    label: 'Phone number',
    regex: /\b(\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g,
    suggest: () => '[phone]',
  },
  {
    type: 'email',
    label: 'Email address',
    regex: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g,
    suggest: () => '[email]',
  },
  {
    type: 'mrn',
    label: 'Medical record number',
    regex: /\b(MRN|mrn|Record\s*#|Patient\s*ID)[:\s#]*[A-Za-z0-9-]{4,}\b/g,
    suggest: () => '[MRN removed]',
  },
  {
    type: 'address',
    label: 'Street address',
    regex: /\b\d{1,5}\s+[A-Z][a-z]+\s+(Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Lane|Ln|Drive|Dr|Court|Ct|Way|Place|Pl)\b/g,
    suggest: () => '[address]',
  },
  {
    type: 'date',
    label: 'Specific date',
    regex: /\b(0?[1-9]|1[0-2])[\/\-](0?[1-9]|[12]\d|3[01])[\/\-](19|20)\d{2}\b/g,
    suggest: () => '[date]',
  },
  {
    type: 'age90',
    label: 'Age over 89',
    // HIPAA: ages 90+ must be aggregated to "90 or older"
    regex: /\b(9[0-9]|1[0-9]{2})\s*(years?\s*old|yo|y\/o)\b/gi,
    suggest: () => '90 or older',
  },
];

// ── Name detection ─────────────────────────────────────────────────────────────

/**
 * Finds capitalised words that are likely personal names.
 * Deliberately conservative — it's better to miss one than to flood the user
 * with false positives on every capitalised word.
 */
const detectNames = (text: string): PHIMatch[] => {
  const matches: PHIMatch[] = [];

  // Pattern A: Title + Name  → "Dr. Chen", "Mrs. Thompson"
  const titled = /\b(Dr|Doctor|Mr|Mrs|Ms|Miss|Nurse|Prof)\.?\s+([A-Z][a-z]{1,})\b/g;
  let m: RegExpExecArray | null;
  while ((m = titled.exec(text)) !== null) {
    matches.push({
      type: 'name',
      label: 'Name',
      text: m[0],
      index: m.index,
      suggestion: `${m[1]}. ${m[2][0]}.`,
    });
  }

  // Pattern B: Two consecutive capitalised words → "Sarah Thompson"
  const fullName = /\b([A-Z][a-z]{2,})\s+([A-Z][a-z]{2,})\b/g;
  while ((m = fullName.exec(text)) !== null) {
    if (NOT_NAMES.has(m[1]) || NOT_NAMES.has(m[2])) continue;
    // Skip if already captured by the titled pattern
    if (matches.some(x => m!.index >= x.index && m!.index < x.index + x.text.length)) continue;
    matches.push({
      type: 'name',
      label: 'Name',
      text: m[0],
      index: m.index,
      suggestion: `${m[1][0]}.${m[2][0]}.`,
    });
  }

  return matches;
};

// ── Public API ─────────────────────────────────────────────────────────────────

/** Scan text and return every likely PHI identifier found. */
export const detectPHI = (text: string): PHIMatch[] => {
  if (!text || text.length < 3) return [];

  const found: PHIMatch[] = [];

  for (const p of PATTERNS) {
    p.regex.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = p.regex.exec(text)) !== null) {
      found.push({
        type:       p.type,
        label:      p.label,
        text:       m[0],
        index:      m.index,
        suggestion: p.suggest(m[0]),
      });
    }
  }

  found.push(...detectNames(text));

  // Sort by position and de-duplicate overlapping matches
  found.sort((a, b) => a.index - b.index);
  const deduped: PHIMatch[] = [];
  let lastEnd = -1;
  for (const f of found) {
    if (f.index >= lastEnd) {
      deduped.push(f);
      lastEnd = f.index + f.text.length;
    }
  }
  return deduped;
};

/** Replace every detected identifier with its suggested safe form. */
export const redactPHI = (text: string, matches?: PHIMatch[]): string => {
  const found = matches ?? detectPHI(text);
  if (found.length === 0) return text;

  // Replace from the end so earlier indices stay valid
  let out = text;
  for (let i = found.length - 1; i >= 0; i--) {
    const f = found[i];
    out = out.slice(0, f.index) + f.suggestion + out.slice(f.index + f.text.length);
  }
  return out;
};

/** Human-readable summary for the warning banner. */
export const summarisePHI = (matches: PHIMatch[]): string => {
  if (matches.length === 0) return '';
  const counts = new Map<string, number>();
  matches.forEach(m => counts.set(m.label, (counts.get(m.label) ?? 0) + 1));
  return Array.from(counts.entries())
    .map(([label, n]) => (n > 1 ? `${n} ${label.toLowerCase()}s` : label.toLowerCase()))
    .join(', ');
};
