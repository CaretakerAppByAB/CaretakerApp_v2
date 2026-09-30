import {scoreEmotions, resourcesForEmotion, Emotion, EmotionKeyword, Resource} from '../src/services/resourceMatcher';
import {EMOTIONS, KEYWORDS, RESOURCES} from '../src/data/resourceData.generated';

const NOW = Date.UTC(2026, 8, 30);
const DAY = 86400000;
const entry = (content: string, daysAgo = 0) => ({content, createdAt: NOW - daysAgo * DAY});

const emotions: Emotion[] = [
  {id: 'crisis', label: 'Crisis', isCrisis: true, sortOrder: 0},
  {id: 'overwhelmed', label: 'Overwhelmed', isCrisis: false, sortOrder: 1},
  {id: 'anxious', label: 'Anxious', isCrisis: false, sortOrder: 2},
];
const keywords: EmotionKeyword[] = [
  {keyword: 'stress*', emotionId: 'overwhelmed', weight: 2},
  {keyword: 'too much', emotionId: 'overwhelmed', weight: 1},
  {keyword: 'worry*', emotionId: 'anxious', weight: 2},
  {keyword: 'want to die', emotionId: 'crisis', weight: 10},
];
const ids = (entries: {content: string; createdAt: number}[]) =>
  scoreEmotions(entries, keywords, emotions, NOW).map(s => s.emotionId);

describe('resourceMatcher', () => {
  it('matches prefix keywords', () => {
    expect(ids([entry('Today was so stressful.')])).toEqual(['overwhelmed']);
  });

  it('respects word boundaries', () => {
    expect(ids([entry('I love my mistress')])).toEqual([]);
  });

  it('matches multi-word phrases across whitespace and curly quotes', () => {
    expect(ids([entry('It’s all  too much, stressed')])).toEqual(['overwhelmed']);
  });

  it('ignores negated keywords', () => {
    expect(ids([entry("I'm not stressed today")])).toEqual([]);
    expect(ids([entry("I can't stop worrying about Mom")])).toEqual(['anxious']);
  });

  it('never negates crisis keywords and ranks them first', () => {
    expect(ids([entry("Stressed. I don't know, I want to die")])[0]).toBe('crisis');
    expect(ids([entry('I never want to die alone')])).toEqual(['crisis']);
  });

  it('applies the minimum score and lookback window', () => {
    expect(ids([entry('it was too much')])).toEqual([]);            // weight 1 < minScore 2
    expect(ids([entry('so stressed', 30)])).toEqual([]);            // older than lookback
    expect(ids([entry('stressed', 10), entry('stressed', 12)])).toEqual([]); // decayed below threshold
  });

  it('counts each keyword once per entry but accumulates across entries', () => {
    const [s] = scoreEmotions([entry('stress stress stress')], keywords, emotions, NOW);
    expect(s.score).toBe(2);
    const [s2] = scoreEmotions([entry('stress'), entry('stress')], keywords, emotions, NOW);
    expect(s2.score).toBe(4);
  });

  it('puts hotlines first in resource lists', () => {
    const resources: Resource[] = [
      {id: 'a', title: 'A', type: 'article', source: 'x', emotionIds: ['anxious']},
      {id: 'h', title: 'H', type: 'hotline', source: 'x', emotionIds: ['anxious'], phone: '1'},
    ];
    expect(resourcesForEmotion('anxious', resources).map(r => r.id)).toEqual(['h', 'a']);
  });

  it('works against the generated CSV data', () => {
    const found = scoreEmotions([entry('I feel so overwhelmed and burnt out, and so lonely')], KEYWORDS, EMOTIONS, NOW);
    expect(found.map(f => f.emotionId).sort()).toEqual(['exhausted', 'lonely', 'overwhelmed']);
    for (const f of found) expect(resourcesForEmotion(f.emotionId, RESOURCES).length).toBeGreaterThan(0);
  });
});
