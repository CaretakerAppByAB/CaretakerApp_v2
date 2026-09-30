#!/usr/bin/env node
/**
 * scripts/build-resources.js
 *
 * Compiles the CSVs in /resources into src/data/resourceData.generated.ts,
 * which the app imports. Run after editing any CSV:
 *
 *   npm run build:resources                 # validate + generate
 *   npm run build:resources -- --check-links # also ping every resource URL
 *
 * The build FAILS (nothing is written) on errors such as an unknown
 * emotion_id, a duplicate id, or a URL whose domain is not listed in
 * trusted_sources.csv. Warnings are printed but do not block the build.
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SRC_DIR = path.join(ROOT, 'resources');
const OUT_FILE = path.join(ROOT, 'src', 'data', 'resourceData.generated.ts');

const RESOURCE_TYPES = ['article', 'podcast', 'video', 'hotline', 'tool', 'book'];

const errors = [];
const warnings = [];

// ── CSV parsing (RFC 4180: quoted fields, "" escapes, CRLF, BOM) ──────────────

function parseCSV(text) {
  text = text.replace(/^﻿/, '');
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') inQuotes = false;
      else field += c;
    } else if (c === '"') inQuotes = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(field); rows.push(row); row = []; field = '';
    } else field += c;
  }
  if (field !== '' || row.length) { row.push(field); rows.push(row); }

  const nonEmpty = rows.filter(r => r.some(f => f.trim() !== ''));
  const [header, ...body] = nonEmpty;
  const keys = header.map(h => h.trim());
  // Line numbers are 1-based and count the header, matching what a spreadsheet shows.
  return body.map((r, idx) => {
    const obj = {__line: idx + 2};
    keys.forEach((k, j) => { obj[k] = (r[j] ?? '').trim(); });
    return obj;
  });
}

function load(file, requiredCols) {
  const full = path.join(SRC_DIR, file);
  if (!fs.existsSync(full)) {
    errors.push(`${file}: file not found`);
    return [];
  }
  const rows = parseCSV(fs.readFileSync(full, 'utf8'));
  if (rows.length) {
    const missing = requiredCols.filter(c => !(c in rows[0]));
    if (missing.length) errors.push(`${file}: missing column(s) ${missing.join(', ')}`);
  }
  return rows;
}

const at = (file, row) => `${file}:${row.__line}`;

// ── Load ──────────────────────────────────────────────────────────────────────

const emotionRows = load('emotions.csv', ['emotion_id', 'label', 'is_crisis', 'sort_order']);
const keywordRows = load('keywords.csv', ['keyword', 'emotion_id', 'weight']);
const sourceRows = load('trusted_sources.csv', ['domain', 'organization']);
const resourceRows = load('resources.csv', [
  'resource_id', 'title', 'type', 'source', 'url', 'phone', 'emotion_ids', 'last_verified',
]);

// ── Emotions ──────────────────────────────────────────────────────────────────

const emotions = [];
const emotionIds = new Set();
for (const r of emotionRows) {
  const id = r.emotion_id.toLowerCase();
  if (!/^[a-z0-9_-]+$/.test(id)) { errors.push(`${at('emotions.csv', r)}: emotion_id "${r.emotion_id}" must be lowercase letters, numbers, - or _`); continue; }
  if (emotionIds.has(id)) { errors.push(`${at('emotions.csv', r)}: duplicate emotion_id "${id}"`); continue; }
  if (!r.label) errors.push(`${at('emotions.csv', r)}: label is required`);
  const crisis = r.is_crisis.toLowerCase();
  if (!['true', 'false', ''].includes(crisis)) errors.push(`${at('emotions.csv', r)}: is_crisis must be true or false`);
  emotionIds.add(id);
  emotions.push({
    id,
    label: r.label,
    isCrisis: crisis === 'true',
    sortOrder: Number(r.sort_order) || 0,
  });
}
emotions.sort((a, b) => a.sortOrder - b.sortOrder);

// ── Keywords ──────────────────────────────────────────────────────────────────

const keywords = [];
const seenKeywords = new Set();
for (const r of keywordRows) {
  const keyword = r.keyword.toLowerCase().replace(/[‘’]/g, "'").replace(/\s+/g, ' ');
  const emotionId = r.emotion_id.toLowerCase();
  const weight = r.weight === '' ? 1 : Number(r.weight);
  if (!keyword) { errors.push(`${at('keywords.csv', r)}: keyword is empty`); continue; }
  if (!emotionIds.has(emotionId)) { errors.push(`${at('keywords.csv', r)}: unknown emotion_id "${r.emotion_id}" (add it to emotions.csv)`); continue; }
  if (!(weight > 0)) { errors.push(`${at('keywords.csv', r)}: weight must be a positive number`); continue; }
  if (keyword.replace(/\*/g, '').replace(/[^a-z0-9]/g, '').length < 3) warnings.push(`${at('keywords.csv', r)}: "${keyword}" is very short and may over-match`);
  const key = `${keyword}|${emotionId}`;
  if (seenKeywords.has(key)) { warnings.push(`${at('keywords.csv', r)}: duplicate keyword "${keyword}" for ${emotionId} (ignored)`); continue; }
  seenKeywords.add(key);
  keywords.push({keyword, emotionId, weight});
}

// ── Trusted sources ───────────────────────────────────────────────────────────

const trustedDomains = sourceRows
  .map(r => r.domain.toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/.*$/, ''))
  .filter(Boolean);

const isTrusted = host => {
  const h = host.toLowerCase().replace(/^www\./, '');
  return trustedDomains.some(d => h === d || h.endsWith('.' + d));
};

// ── Resources ─────────────────────────────────────────────────────────────────

const resources = [];
const resourceIds = new Set();
for (const r of resourceRows) {
  const where = at('resources.csv', r);
  const id = r.resource_id;
  if (!id) { errors.push(`${where}: resource_id is required`); continue; }
  if (resourceIds.has(id)) { errors.push(`${where}: duplicate resource_id "${id}"`); continue; }
  resourceIds.add(id);

  if (!r.title) errors.push(`${where}: title is required`);
  const type = r.type.toLowerCase();
  if (!RESOURCE_TYPES.includes(type)) errors.push(`${where}: type "${r.type}" must be one of ${RESOURCE_TYPES.join(', ')}`);
  if (!r.source) errors.push(`${where}: source is required`);

  if (!r.url && !r.phone) errors.push(`${where}: needs a url or a phone`);
  if (r.url) {
    let u;
    try { u = new URL(r.url); } catch { errors.push(`${where}: invalid url "${r.url}"`); }
    if (u) {
      if (u.protocol !== 'https:') errors.push(`${where}: url must use https`);
      if (!isTrusted(u.hostname)) errors.push(`${where}: ${u.hostname} is not in trusted_sources.csv. Add it there only after the source is vetted`);
    }
  }

  const ids = r.emotion_ids.split('|').map(s => s.trim().toLowerCase()).filter(Boolean);
  if (!ids.length) errors.push(`${where}: emotion_ids is empty`);
  for (const e of ids) if (!emotionIds.has(e)) errors.push(`${where}: unknown emotion_id "${e}"`);

  if (r.last_verified && !/^\d{4}-\d{2}-\d{2}$/.test(r.last_verified)) warnings.push(`${where}: last_verified should be YYYY-MM-DD`);

  resources.push({
    id,
    title: r.title,
    type,
    source: r.source,
    url: r.url || undefined,
    phone: r.phone || undefined,
    emotionIds: ids,
    lastVerified: r.last_verified || undefined,
  });
}

// ── Coverage checks ───────────────────────────────────────────────────────────

for (const e of emotions) {
  if (!keywords.some(k => k.emotionId === e.id)) warnings.push(`emotion "${e.id}" has no keywords, so it can only be reached by tapping it`);
  const matching = resources.filter(r => r.emotionIds.includes(e.id));
  if (!matching.length) warnings.push(`emotion "${e.id}" has no resources`);
  if (e.isCrisis && !matching.some(r => r.phone)) errors.push(`crisis emotion "${e.id}" must have at least one resource with a phone number`);
}

// ── Optional link check ───────────────────────────────────────────────────────

async function checkLinks() {
  console.log(`Checking ${resources.filter(r => r.url).length} links…`);
  await Promise.all(resources.filter(r => r.url).map(async r => {
    try {
      const res = await fetch(r.url, {
        redirect: 'follow',
        headers: {'User-Agent': 'Mozilla/5.0 (AlzApp resource link check)'},
        signal: AbortSignal.timeout(15000),
      });
      // Many .gov and hospital sites block scripted requests (403/405); flag them for a manual look.
      if (res.status === 404 || res.status === 410) errors.push(`resource "${r.id}": ${r.url} returned ${res.status} (dead link)`);
      else if (!res.ok) warnings.push(`resource "${r.id}": ${r.url} returned ${res.status}. Open it in a browser to confirm`);
    } catch (err) {
      warnings.push(`resource "${r.id}": ${r.url} could not be reached (${err.message})`);
    }
  }));
}

// ── Emit ──────────────────────────────────────────────────────────────────────

function emit() {
  const out = `/**
 * AUTO-GENERATED by scripts/build-resources.js. DO NOT EDIT.
 * Edit the CSVs in /resources and run \`npm run build:resources\`.
 */

import type {Emotion, EmotionKeyword, Resource} from '../services/resourceMatcher';

export const EMOTIONS: Emotion[] = ${JSON.stringify(emotions, null, 2)};

export const KEYWORDS: EmotionKeyword[] = ${JSON.stringify(keywords, null, 2)};

export const RESOURCES: Resource[] = ${JSON.stringify(resources, null, 2)};
`;
  fs.mkdirSync(path.dirname(OUT_FILE), {recursive: true});
  fs.writeFileSync(OUT_FILE, out);
}

(async () => {
  if (process.argv.includes('--check-links')) await checkLinks();

  warnings.forEach(w => console.warn(`⚠️  ${w}`));
  if (errors.length) {
    errors.forEach(e => console.error(`❌ ${e}`));
    console.error(`\n${errors.length} error(s). Nothing was generated.`);
    process.exit(1);
  }
  emit();
  console.log(`✅ ${emotions.length} emotions, ${keywords.length} keywords, ${resources.length} resources → ${path.relative(ROOT, OUT_FILE)}`);
})();
