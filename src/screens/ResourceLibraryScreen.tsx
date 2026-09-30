/**
 * AlzApp — Mental Health Resources Screen
 *
 * Suggests resources based on emotions detected in the user's recent journal
 * entries (see services/resourceMatcher.ts), and lets them browse any emotion
 * manually. Resource content comes from /resources/*.csv. To update it, edit
 * the CSVs and run `npm run build:resources`.
 *
 * Journal analysis happens on-device only; nothing is stored or uploaded.
 */

import React, {useEffect, useMemo, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Alert,
  ActivityIndicator,
} from 'react-native';
import {Colors} from '../theme/colors';
import ScreenHeader from '../components/ScreenHeader';
import {useAuth} from '../context/AuthContext';
import {subscribeToEntries, JournalEntry} from '../services/journalService';
import {
  scoreEmotions,
  resourcesForEmotion,
  Emotion,
  Resource,
  ResourceType,
} from '../services/resourceMatcher';
import {EMOTIONS, KEYWORDS, RESOURCES} from '../data/resourceData.generated';

const FOR_YOU = '__for_you__';

const TYPE_LABELS: Record<ResourceType, string> = {
  article: 'Article',
  podcast: 'Podcast',
  video:   'Video',
  hotline: 'Helpline',
  tool:    'Tool',
  book:    'Book',
};

const EMOTION_BY_ID = new Map(EMOTIONS.map(e => [e.id, e]));
const CRISIS_RESOURCES = EMOTIONS.filter(e => e.isCrisis).flatMap(e =>
  resourcesForEmotion(e.id, RESOURCES),
);

const open = (url: string) =>
  Linking.openURL(url).catch(() =>
    Alert.alert('Error', 'Could not open this link.'),
  );
const call = (phone: string) => open(`tel:${phone.replace(/[^\d+]/g, '')}`);

// ── Resource card ─────────────────────────────────────────────────────────────

const ResourceCard: React.FC<{resource: Resource}> = ({resource}) => (
  <View style={styles.card}>
    <View style={styles.cardMeta}>
      <View style={styles.typeTag}>
        <Text style={styles.typeTagText}>{TYPE_LABELS[resource.type]}</Text>
      </View>
      <Text style={styles.source} numberOfLines={1}>{resource.source}</Text>
    </View>
    <Text style={styles.cardTitle}>{resource.title}</Text>
    <View style={styles.actionRow}>
      {!!resource.phone && (
        <TouchableOpacity style={styles.actionBtn} onPress={() => call(resource.phone!)}>
          <Text style={styles.actionBtnText}>Call {resource.phone}</Text>
        </TouchableOpacity>
      )}
      {!!resource.url && (
        <TouchableOpacity
          style={[styles.actionBtn, !!resource.phone && styles.actionBtnSecondary]}
          onPress={() => open(resource.url!)}>
          <Text style={[styles.actionBtnText, !!resource.phone && styles.actionBtnTextSecondary]}>
            {resource.type === 'hotline' ? 'Website' : 'Open'}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  </View>
);

const EmotionSection: React.FC<{emotion: Emotion; showHeading: boolean}> = ({emotion, showHeading}) => {
  const list = resourcesForEmotion(emotion.id, RESOURCES);
  return (
    <View style={styles.section}>
      {showHeading && <Text style={styles.sectionTitle}>{emotion.label}</Text>}
      {list.length ? (
        list.map(r => <ResourceCard key={r.id} resource={r}/>)
      ) : (
        <Text style={styles.empty}>Resources for this topic are coming soon.</Text>
      )}
    </View>
  );
};

// ── Screen ────────────────────────────────────────────────────────────────────

const ResourceLibraryScreen: React.FC<{navigation: any}> = ({navigation}) => {
  const {user} = useAuth();
  const [entries, setEntries] = useState<JournalEntry[] | null>(null);
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    return subscribeToEntries(user.uid, setEntries, () => setEntries([]));
  }, [user]);

  const detected = useMemo(
    () => (entries ? scoreEmotions(entries, KEYWORDS, EMOTIONS) : []),
    [entries],
  );
  const inCrisis = detected.some(d => EMOTION_BY_ID.get(d.emotionId)?.isCrisis);
  const suggested = detected
    .map(d => EMOTION_BY_ID.get(d.emotionId)!)
    .filter(e => e && !e.isCrisis);
  const browsable = EMOTIONS.filter(e => !e.isCrisis);

  // Default to "For you" when we have suggestions, otherwise the first emotion.
  const active = selected ?? (suggested.length ? FOR_YOU : browsable[0]?.id);
  const activeEmotion = active && active !== FOR_YOU ? EMOTION_BY_ID.get(active) : undefined;

  return (
    <View style={styles.screen}>
      <ScreenHeader title="Mental Health Resources" onBack={() => navigation.goBack()}/>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}>

        {/* ── Crisis card (only when crisis language is detected) ── */}
        {inCrisis && (
          <View style={styles.crisisCard}>
            <Text style={styles.crisisTitle}>Help is available 24/7</Text>
            <View style={styles.actionRow}>
              <TouchableOpacity style={styles.crisisBtn} onPress={() => call('988')}>
                <Text style={styles.crisisBtnText}>Call 988</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.crisisBtn} onPress={() => open('sms:988')}>
                <Text style={styles.crisisBtnText}>Text 988</Text>
              </TouchableOpacity>
            </View>
            {CRISIS_RESOURCES.filter(r => r.phone !== '988').map(r => (
              <ResourceCard key={r.id} resource={r}/>
            ))}
          </View>
        )}

        {/* ── Intro ── */}
        <View style={styles.intro}>
          {entries === null ? (
            <ActivityIndicator color={Colors.primary}/>
          ) : suggested.length ? (
            <Text style={styles.introTitle}>Picked for you</Text>
          ) : (
            <Text style={styles.introTitle}>How are you feeling?</Text>
          )}
        </View>

        {/* ── Topic chips ── */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.chipScroll}
          contentContainerStyle={styles.chipRow}>
          {suggested.length > 0 && (
            <Chip label="For you" active={active === FOR_YOU} onPress={() => setSelected(FOR_YOU)}/>
          )}
          {browsable.map(e => (
            <Chip key={e.id} label={e.label} active={active === e.id} onPress={() => setSelected(e.id)}/>
          ))}
        </ScrollView>

        {/* ── Resources ── */}
        {active === FOR_YOU
          ? suggested.map(e => <EmotionSection key={e.id} emotion={e} showHeading/>)
          : activeEmotion && <EmotionSection emotion={activeEmotion} showHeading={false}/>}

        {/* ── Footer ── */}
        <TouchableOpacity style={styles.footerCrisis} onPress={() => call('988')}>
          <Text style={styles.footerCrisisText}>
            In crisis? Call or text <Text style={styles.introStrong}>988</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const Chip: React.FC<{label: string; active: boolean; onPress: () => void}> = ({label, active, onPress}) => (
  <TouchableOpacity
    style={[styles.chip, active && styles.chipActive]}
    onPress={onPress}
    activeOpacity={0.8}>
    <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
  </TouchableOpacity>
);

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: {flex: 1, backgroundColor: Colors.backgroundLight},
  scroll: {flex: 1, backgroundColor: Colors.backgroundLight},
  container: {padding: 16, paddingBottom: 40},

  crisisCard: {
    backgroundColor: '#FEF2F2',
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  crisisTitle: {fontSize: 16, fontWeight: '700', color: '#991B1B', marginBottom: 12},
  crisisBtn: {
    backgroundColor: '#B91C1C',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
    marginRight: 8,
    marginBottom: 12,
  },
  crisisBtnText: {color: Colors.white, fontSize: 14, fontWeight: '700'},

  intro: {marginBottom: 14, minHeight: 24},
  introTitle: {fontSize: 18, fontWeight: '700', color: Colors.text, marginBottom: 4},
  introStrong: {fontWeight: '700', color: Colors.text},

  chipScroll: {marginHorizontal: -16, marginBottom: 16},
  chipRow: {paddingHorizontal: 16},
  chip: {
    backgroundColor: Colors.primaryLight,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginRight: 8,
  },
  chipActive: {backgroundColor: Colors.primary},
  chipText: {fontSize: 13, fontWeight: '600', color: Colors.primary600},
  chipTextActive: {color: Colors.white},

  section: {marginBottom: 8},
  sectionTitle: {fontSize: 16, fontWeight: '700', color: Colors.text, marginBottom: 10},
  empty: {fontSize: 13, color: Colors.textSecondary, fontStyle: 'italic', marginBottom: 16},

  card: {
    backgroundColor: Colors.white,
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    shadowColor: Colors.primary,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  cardMeta: {flexDirection: 'row', alignItems: 'center', marginBottom: 8},
  typeTag: {
    backgroundColor: Colors.primaryLight,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginRight: 8,
  },
  typeTagText: {color: Colors.primaryDark, fontSize: 11, fontWeight: '600'},
  source: {flex: 1, fontSize: 11, color: Colors.textSecondary},
  cardTitle: {fontSize: 15, fontWeight: '700', color: Colors.text, marginBottom: 12},
  actionRow: {flexDirection: 'row', flexWrap: 'wrap'},
  actionBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 10,
    marginRight: 8,
  },
  actionBtnSecondary: {backgroundColor: Colors.primaryLight},
  actionBtnText: {color: Colors.white, fontSize: 13, fontWeight: '700'},
  actionBtnTextSecondary: {color: Colors.primary},

  footerCrisis: {
    backgroundColor: Colors.primaryLight,
    borderRadius: 14,
    padding: 14,
    marginTop: 8,
  },
  footerCrisisText: {fontSize: 13, color: Colors.text, lineHeight: 19, textAlign: 'center'},
});

export default ResourceLibraryScreen;
