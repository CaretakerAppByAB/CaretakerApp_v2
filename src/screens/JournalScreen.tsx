/**
 * JournalScreen.tsx
 * Place at: src/screens/JournalScreen.tsx
 * Header is now handled by JournalNavigator's Stack — matches Community style.
 */

import React, {useState, useEffect} from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, ActivityIndicator, Alert,
} from 'react-native';
import Svg, {Path, Polygon} from 'react-native-svg';
import {useAuth} from '../context/AuthContext';
import {subscribeToEntries, toggleStar, deleteEntry, JournalEntry} from '../services/journalService';
import ScreenHeader from '../components/ScreenHeader';
import {Colors} from '../theme/colors';

// ── Icons ──────────────────────────────────────────────────────────────────────

const StarIcon = ({filled}: {filled: boolean}) => (
  <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
    <Polygon
      points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"
      fill={filled ? Colors.primary : 'none'}
      stroke={filled ? Colors.primary : '#BBBBBB'}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const ChevronDown = ({open}: {open: boolean}) => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Path
      d={open ? 'M18 15l-6-6-6 6' : 'M6 9l6 6 6-6'}
      stroke="#7E7E7E" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
    />
  </Svg>
);

// ── Helpers ────────────────────────────────────────────────────────────────────

const formatDate = (ms: number) => {
  const d = new Date(ms);
  return `${d.getMonth() + 1}/${d.getDate()}/${String(d.getFullYear()).slice(2)}`;
};

// ── Main screen ────────────────────────────────────────────────────────────────

const JournalScreen: React.FC<{navigation: any}> = ({navigation}) => {
  const {user} = useAuth();
  const [entries,     setEntries]     = useState<JournalEntry[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [showEntries, setShowEntries] = useState(true);

  useEffect(() => {
    if (!user) return;
    const unsub = subscribeToEntries(
      user.uid,
      e  => { setEntries(e); setLoading(false); },
      () => { setLoading(false); },
    );
    return unsub;
  }, [user?.uid]);

  const handleStar = async (entry: JournalEntry) => {
    if (!user) return;
    await toggleStar(user.uid, entry.id, entry.starred).catch(() => {});
  };

  const handleDelete = (entry: JournalEntry) => {
    if (!user) return;
    Alert.alert(
      'Delete Entry',
      `Remove your entry from ${formatDate(entry.createdAt)}?`,
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Delete', style: 'destructive',
          onPress: () => deleteEntry(user.uid, entry.id).catch(() => {}),
        },
      ],
    );
  };

  return (
    <View style={s.screen}>
      <ScreenHeader title="Journal" onBack={() => navigation.navigate('Home')}/>
      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.container}
        showsVerticalScrollIndicator={false}>

      {/* ── New Entry card ── */}
      <TouchableOpacity
        style={s.newEntryCard}
        onPress={() => navigation.navigate('JournalTypeSelect')}
        activeOpacity={0.8}>
        <Text style={s.newEntryLabel}>New Entry:</Text>
        <View style={s.plusCircle}>
          <Text style={s.plusText}>+</Text>
        </View>
      </TouchableOpacity>

      {/* ── Your Thoughts section ── */}
      <TouchableOpacity
        style={s.sectionHeader}
        onPress={() => setShowEntries(v => !v)}
        activeOpacity={0.7}>
        <Text style={s.sectionTitle}>Your Thoughts:</Text>
        <ChevronDown open={showEntries}/>
      </TouchableOpacity>

      {showEntries && (
        <>
          {loading && (
            <ActivityIndicator color={Colors.primary} style={{marginTop: 24}}/>
          )}

          {!loading && entries.length === 0 && (
            <View style={s.emptyState}>
              <Text style={s.emptyTitle}>No entries yet</Text>
            </View>
          )}

          {entries.map((entry, i) => (
            <TouchableOpacity
              key={entry.id}
              style={[s.entryCard, i % 2 === 0 ? s.entryCardLight : s.entryCardMed]}
              onPress={() => navigation.navigate('JournalEntry', {entry})}
              onLongPress={() => handleDelete(entry)}
              activeOpacity={0.75}>
              <View style={s.entryLeft}>
                <Text style={s.entryDate}>{formatDate(entry.createdAt)}</Text>
                {!!entry.content && (
                  <Text style={s.entryPreview} numberOfLines={1}>
                    {entry.type === 'guided' && !!entry.prompt
                      ? entry.prompt
                      : entry.content}
                  </Text>
                )}
              </View>
              <TouchableOpacity
                onPress={() => handleStar(entry)}
                hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
                <StarIcon filled={entry.starred}/>
              </TouchableOpacity>
            </TouchableOpacity>
          ))}

        </>
      )}

      <View style={{height: 32}}/>
      </ScrollView>
    </View>
  );
};

// ── Styles ─────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  screen:    {flex: 1, backgroundColor: Colors.backgroundLight},
  scroll:    {flex: 1, backgroundColor: Colors.backgroundLight},
  container: {padding: 16, paddingBottom: 32},

  // New entry card
  newEntryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.white,
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 16,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 3,
  },
  newEntryLabel: {fontSize: 16, fontWeight: '700', color: Colors.primary},
  plusCircle: {
    width: 34, height: 34, borderRadius: 17,
    borderWidth: 2, borderColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  plusText: {fontSize: 22, fontWeight: '300', color: Colors.primary, lineHeight: 26},

  // Section header
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 4,
    marginBottom: 8,
  },
  sectionTitle: {fontSize: 15, fontWeight: '700', color: Colors.text},

  // Entry cards — alternate lavender shades
  entryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 8,
    shadowColor: Colors.primary,
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  entryCardLight: {backgroundColor: Colors.primaryLight},
  entryCardMed:   {backgroundColor: Colors.cardBackground},
  entryLeft:      {flex: 1, marginRight: 10},
  entryDate:      {fontSize: 15, fontWeight: '700', color: Colors.primaryDark},
  entryPreview:   {fontSize: 12, color: Colors.textSecondary, marginTop: 3},

  // Empty & hint
  emptyState: {alignItems: 'center', marginTop: 32, marginBottom: 16},
  emptyTitle: {fontSize: 16, fontWeight: '700', color: Colors.primary, marginBottom: 6},
});

export default JournalScreen;
