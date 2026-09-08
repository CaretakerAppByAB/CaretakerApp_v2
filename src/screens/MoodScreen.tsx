/**
 * MoodScreen.tsx
 * Place at: src/screens/MoodScreen.tsx
 *
 * Changes:
 *  - Added `navigation` prop and `useLayoutEffect` to handle the header via React Navigation.
 *  - Configured matching properties: height 130, fontSize 18, fontWeight 700.
 *  - Set `headerShown: true` to guarantee the native header is activated.
 *  - Removed the inline custom `<View style={s.header}>` block so the native header rules the page.
 */

import React, {useState, useEffect, useCallback, useMemo} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal,
  Dimensions,
} from 'react-native';
import {useAuth} from '../context/AuthContext';
import ScreenHeader from '../components/ScreenHeader';
import MoodFace from '../components/MoodFace';
import {Colors} from '../theme/colors';
import {DAILY_QUOTES} from '../constants/quotes';
import {
  MoodType,
  MOOD_OPTIONS,
  MOOD_COLORS,
  saveMood,
  loadMonthMoods,
  shouldShowModal,
} from '../services/moodService';

// TODO: replace with the real "Tips to Refresh" copy once it's provided —
// pulling from the Clash Royale trivia list as filler content for now.
const pickRandomTips = (count: number): string[] => {
  const pool = [...DAILY_QUOTES];
  const picked: string[] = [];
  while (picked.length < count && pool.length > 0) {
    const i = Math.floor(Math.random() * pool.length);
    picked.push(pool.splice(i, 1)[0]);
  }
  return picked;
};

const {width: SW} = Dimensions.get('window');

// ── Constants ──────────────────────────────────────────────────────────────────

const MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];

const DAY_NAMES = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];

// ── Layout ─────────────────────────────────────────────────────────────────────

const CELL_SIZE   = Math.floor((SW - 56) / 7);
const FACE_IN_CAL = Math.min(CELL_SIZE - 6, 26);
const CELL_H      = FACE_IN_CAL + 18;

// ── Check-in modal ─────────────────────────────────────────────────────────────

const MoodCheckInModal: React.FC<{
  visible: boolean;
  onSelect: (m: MoodType) => void;
}> = ({visible, onSelect}) => (
  <Modal visible={visible} transparent animationType="fade">
    <View style={ms.overlay}>
      <View style={ms.card}>
        <Text style={ms.title}>How are you feeling today?</Text>
        <View style={ms.grid}>
          {MOOD_OPTIONS.map(opt => (
            <TouchableOpacity
              key={opt.type}
              style={ms.option}
              activeOpacity={0.75}
              onPress={() => onSelect(opt.type)}>
              <Text style={ms.optLabel}>{opt.label}</Text>
              <MoodFace mood={opt.type} size={48}/>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  </Modal>
);

// ── Main screen ────────────────────────────────────────────────────────────────

const MoodScreen: React.FC<{navigation: any}> = () => {
  const {user} = useAuth();
  const uid = user?.uid ?? 'guest';

  const now = new Date();
  const [year,      setYear]      = useState(now.getFullYear());
  const [month,     setMonth]     = useState(now.getMonth());
  const [moods,     setMoods]     = useState<Record<number, MoodType>>({});
  const [showModal, setShowModal] = useState(false);
  const tips = useMemo(() => pickRandomTips(3), []);

  const refreshMoods = useCallback(async () => {
    setMoods(await loadMonthMoods(uid, year, month));
  }, [uid, year, month]);

  useEffect(() => { refreshMoods(); }, [refreshMoods]);
  useEffect(() => {
    shouldShowModal(uid).then(show => { if (show) setShowModal(true); });
  }, [uid]);

  const handleSelect = async (mood: MoodType) => {
    await saveMood(uid, new Date(), mood);
    setShowModal(false);
    refreshMoods();
  };

  const changeMonth = (delta: number) => {
    let m = month + delta, y = year;
    if (m < 0)  { m = 11; y--; }
    if (m > 11) { m = 0;  y++; }
    setMonth(m); setYear(y);
  };

  // Calendar grid — Monday first
  const firstDow    = (new Date(year, month, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array(firstDow).fill(null),
    ...Array.from({length: daysInMonth}, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);
  const weeks = Array.from({length: cells.length / 7}, (_, i) =>
    cells.slice(i * 7, i * 7 + 7));

  // Frequency data
  const isNow    = year === now.getFullYear() && month === now.getMonth();
  const freqData = MOOD_OPTIONS.map(o => ({
    ...o,
    count: Object.values(moods).filter(m => m === o.type).length,
  }));
  const maxCount = Math.max(...freqData.map(f => f.count), 1);
  const BAR_W    = SW - 56 - 106 - 28;

  return (
    <>
      <MoodCheckInModal visible={showModal} onSelect={handleSelect}/>

      <View style={s.safeArea}>
        <ScreenHeader title="Mood Calendar"/>

        <ScrollView
          style={s.scroll}
          contentContainerStyle={s.container}
          showsVerticalScrollIndicator={false}>

          {/* ── Calendar ── */}
          <View style={s.card}>
            <View style={s.monthNav}>
              <TouchableOpacity style={s.navBtn} onPress={() => changeMonth(-1)}>
                <Text style={s.navArrow}>‹</Text>
              </TouchableOpacity>
              <Text style={s.monthLabel}>{MONTH_NAMES[month]}, {year}</Text>
              <TouchableOpacity style={s.navBtn} onPress={() => changeMonth(1)}>
                <Text style={s.navArrow}>›</Text>
              </TouchableOpacity>
            </View>

            <View style={s.weekRow}>
              {DAY_NAMES.map(d => (
                <Text key={d} style={s.dowLabel}>{d}</Text>
              ))}
            </View>

            {weeks.map((week, wi) => (
              <View key={wi} style={s.weekRow}>
                {week.map((day, di) => {
                  if (!day) return <View key={`e-${wi}-${di}`} style={s.cell}/>;
                  const isToday = isNow && day === now.getDate();
                  const mood    = moods[day];
                  return (
                    <View key={`${wi}-${di}`} style={[s.cell, isToday && s.cellToday]}>
                      <Text style={[s.dayNum, isToday && !mood && s.dayNumToday]}>
                        {day}
                      </Text>
                      <View style={s.cellFaceArea}>
                        {mood && <MoodFace mood={mood} size={FACE_IN_CAL}/>}
                      </View>
                    </View>
                  );
                })}
              </View>
            ))}
          </View>

          {/* ── Mood Frequency ── */}
          <View style={s.card}>
            <Text style={s.sectionTitle}>Mood Frequency</Text>
            {Object.keys(moods).length === 0 ? (
              <Text style={s.emptyNote}>No moods logged this month yet.</Text>
            ) : (
              freqData.map(row => (
                <View key={row.type} style={s.freqRow}>
                  <MoodFace mood={row.type} size={22}/>
                  <Text style={s.freqLabel} numberOfLines={1}>{row.label}</Text>
                  <View style={s.barTrack}>
                    <View style={[
                      s.barFill,
                      {
                        width: row.count > 0 ? (row.count / maxCount) * BAR_W : 0,
                        backgroundColor: MOOD_COLORS[row.type],
                      },
                    ]}/>
                  </View>
                  <Text style={s.freqCount}>{row.count}</Text>
                </View>
              ))
            )}
          </View>

          {/* ── Tips to Refresh ── */}
          <View style={s.card}>
            <Text style={s.sectionTitle}>Tips to Refresh:</Text>
            <View style={s.tipsRow}>
              {tips.map((tip, i) => (
                <View key={i} style={s.tipCard}>
                  <Text style={s.tipText} numberOfLines={5}>{tip}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={{height: 16}}/>
        </ScrollView>
      </View>
    </>
  );
};

// ── Styles ─────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.backgroundLight,
  },
  scroll: {
    flex: 1,
    backgroundColor: Colors.backgroundLight,
  },
  container: {
    paddingBottom: 24,
  },

  // Cards
  card: {
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 12,
    marginHorizontal: 16,
    marginTop: 14,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 10,
  },

  // Month nav
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  navBtn:    {paddingHorizontal: 8, paddingVertical: 4},
  navArrow:  {fontSize: 22, color: Colors.primary, fontWeight: '600'},
  monthLabel:{fontSize: 14, fontWeight: '700', color: Colors.text},

  // Calendar
  weekRow:  {flexDirection: 'row', marginBottom: 2},
  dowLabel: {
    width: CELL_SIZE,
    textAlign: 'center',
    fontSize: 10,
    fontWeight: '700',
    color: Colors.textSecondary,
    paddingBottom: 4,
  },
  cell: {
    width: CELL_SIZE,
    height: CELL_H,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 3,
    borderRadius: 7,
  },
  cellToday:    {backgroundColor: Colors.primaryLight},
  dayNum:       {fontSize: 11, fontWeight: '500', color: Colors.text, lineHeight: 14},
  dayNumToday:  {color: Colors.primary, fontWeight: '800'},
  cellFaceArea: {
    height: FACE_IN_CAL,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },

  // Frequency chart
  emptyNote: {fontSize: 12, color: Colors.textSecondary, textAlign: 'center', paddingVertical: 6},
  freqRow:   {flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 6},
  freqLabel: {width: 82, fontSize: 11, fontWeight: '500', color: Colors.text},
  barTrack:  {flex: 1, height: 12, backgroundColor: '#E8E8E8', borderRadius: 6, overflow: 'hidden'},
  barFill:   {height: '100%', borderRadius: 6},
  freqCount: {width: 20, fontSize: 11, fontWeight: '700', color: Colors.text, textAlign: 'right'},

  // Tips to refresh
  tipsRow: {flexDirection: 'row', gap: 8},
  tipCard: {
    flex: 1,
    backgroundColor: Colors.primaryLight,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 8,
    justifyContent: 'center',
  },
  tipText: {fontSize: 11, fontWeight: '600', color: Colors.text, textAlign: 'center'},
});

// Modal styles
const ms = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(139,126,238,0.88)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: Colors.primaryMedium,
    borderRadius: 20,
    padding: 20,
    width: '100%',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.white,
    textAlign: 'center',
    marginBottom: 16,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'center',
  },
  option: {
    width: (SW - 40 - 40 - 20) / 3,
    backgroundColor: Colors.white,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 4,
    alignItems: 'center',
    gap: 6,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  optLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.text,
    textAlign: 'center',
  },
});

export default MoodScreen;