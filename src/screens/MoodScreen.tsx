/**
 * MoodScreen.tsx
 * Place at: src/screens/MoodScreen.tsx
 *
 * Changes:
 *  - headerShown: false in AppNavigator, so this screen owns its header
 *  - Large purple header (matches HomeScreen gray header proportions)
 *  - StatusBar styled to match purple header
 *  - Bottom tab bar now visible (screen is inside Tab.Navigator)
 */

import React, {useState, useEffect, useCallback} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal,
  Dimensions,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import Svg, {Circle, Path, Rect, G} from 'react-native-svg';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useAuth} from '../context/AuthContext';

const {width: SW} = Dimensions.get('window');

// ── Types & constants ──────────────────────────────────────────────────────────

type MoodType = 'Content' | 'Calm' | 'Upset' | 'Stressed' | 'Overwhelmed' | 'Tired';

const MOOD_OPTIONS: {type: MoodType; label: string}[] = [
  {type: 'Content',     label: 'Content'},
  {type: 'Calm',        label: 'Calm'},
  {type: 'Upset',       label: 'Upset'},
  {type: 'Stressed',    label: 'Stressed'},
  {type: 'Overwhelmed', label: 'Overwhelmed'},
  {type: 'Tired',       label: 'Tired'},
];

const MOOD_COLORS: Record<MoodType, string> = {
  Content:     '#82C882',
  Calm:        '#7EC8D8',
  Upset:       '#977ED8',
  Stressed:    '#D87E7E',
  Overwhelmed: '#7E9DD8',
  Tired:       '#D8D07E',
};

const MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];

const DAY_NAMES = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];

// ── Layout ─────────────────────────────────────────────────────────────────────

const CELL_SIZE   = Math.floor((SW - 56) / 7);
const FACE_IN_CAL = Math.min(CELL_SIZE - 6, 26);
const CELL_H      = FACE_IN_CAL + 18;

// ── Helpers ────────────────────────────────────────────────────────────────────

const getGreeting = (): string => {
  const h = new Date().getHours();
  if (h >= 5  && h < 12) return 'Good Morning';
  if (h >= 12 && h < 17) return 'Good Afternoon';
  if (h >= 17 && h < 21) return 'Good Evening';
  return 'Good Night';
};

// ── AsyncStorage ───────────────────────────────────────────────────────────────

const toDateStr  = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
const moodKey    = (uid: string, ds: string) => `@alz_mood_${uid}_${ds}`;
const checkKey   = (uid: string) => `@alz_mood_checkin_${uid}`;

const saveMood = async (uid: string, date: Date, mood: MoodType) => {
  await AsyncStorage.setItem(moodKey(uid, toDateStr(date)), mood);
  await AsyncStorage.setItem(checkKey(uid), toDateStr(date));
};

const loadMonthMoods = async (
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

const shouldShowModal = async (uid: string): Promise<boolean> => {
  const last = await AsyncStorage.getItem(checkKey(uid));
  return last !== toDateStr(new Date());
};

// ── SVG Mood Face ──────────────────────────────────────────────────────────────

const MoodFace: React.FC<{mood: MoodType; size?: number}> = ({mood, size = 48}) => {
  const F = '#FCEA2B';
  const S = '#333333';

  const happyEyes = () => (
    <G>
      <Path d="M11,16 Q14.5,11 18,16" stroke={S} strokeWidth={2} strokeLinecap="round" fill="none"/>
      <Path d="M22,16 Q25.5,11 29,16" stroke={S} strokeWidth={2} strokeLinecap="round" fill="none"/>
    </G>
  );
  const dotEyes = (cy = 15, r = 2.5) => (
    <G>
      <Circle cx={14} cy={cy} r={r} fill={S}/>
      <Circle cx={26} cy={cy} r={r} fill={S}/>
    </G>
  );
  const tiredEyes = () => (
    <G>
      <Rect x={11} y={13} width={7} height={4.5} rx={2.25} fill={S}/>
      <Rect x={22} y={13} width={7} height={4.5} rx={2.25} fill={S}/>
    </G>
  );
  const angryBrows = () => (
    <G>
      <Path d="M11,10 L18,13" stroke={S} strokeWidth={2} strokeLinecap="round"/>
      <Path d="M29,10 L22,13" stroke={S} strokeWidth={2} strokeLinecap="round"/>
    </G>
  );

  const eyes: Record<MoodType, React.ReactNode> = {
    Content:     happyEyes(),
    Calm:        dotEyes(16, 2.2),
    Upset:       dotEyes(16, 2.2),
    Stressed:    <G>{angryBrows()}{dotEyes(17, 2)}</G>,
    Overwhelmed: dotEyes(15, 3.2),
    Tired:       tiredEyes(),
  };

  const mouth: Record<MoodType, string> = {
    Content:     'M10,24 Q20,33 30,24',
    Calm:        'M13,25 Q20,30 27,25',
    Upset:       'M11,27 Q20,20 29,27',
    Stressed:    'M11,27 Q20,20 29,27',
    Overwhelmed: 'M10,29 Q20,18 30,29',
    Tired:       'M13,24 L27,24',
  };

  return (
    <Svg width={size} height={size} viewBox="0 0 40 40">
      <Circle cx={20} cy={20} r={18} fill={F} stroke={S} strokeWidth={1}/>
      {eyes[mood]}
      <Path d={mouth[mood]} stroke={S} strokeWidth={1.8} strokeLinecap="round" fill="none"/>
    </Svg>
  );
};

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

const MoodScreen: React.FC = () => {
  const {user} = useAuth();
  const uid       = user?.id ?? 'guest';
  const firstName = user?.name?.split(' ')[0] ?? 'Friend';

  const now = new Date();
  const [year,      setYear]      = useState(now.getFullYear());
  const [month,     setMonth]     = useState(now.getMonth());
  const [moods,     setMoods]     = useState<Record<number, MoodType>>({});
  const [showModal, setShowModal] = useState(false);

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

      {/* Purple SafeAreaView fills status bar area with purple */}
      <SafeAreaView style={s.safeArea}>
        <StatusBar barStyle="light-content" backgroundColor="#8B7EEE"/>

        <ScrollView
          style={s.scroll}
          contentContainerStyle={s.container}
          showsVerticalScrollIndicator={false}>

          {/* ── Large purple header — mirrors HomeScreen's gray header ── */}
          <View style={s.header}>
            <Text style={s.headerTitle}>Mood Tracker</Text>
            <Text style={s.headerGreeting}>
              {getGreeting()},{' '}
              <Text style={s.headerName}>{firstName}!</Text>
            </Text>
          </View>

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

          <View style={{height: 16}}/>
        </ScrollView>
      </SafeAreaView>
    </>
  );
};

// ── Styles ─────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#8B7EEE', // fills status bar area with purple
  },
  scroll: {
    flex: 1,
    backgroundColor: '#F5F3FF',
  },
  container: {
    paddingBottom: 24,
  },

  // Large purple header — proportionally similar to HomeScreen's gray header
  header: {
    backgroundColor: '#8B7EEE',
    paddingHorizontal: 22,
    paddingTop: 18,
    paddingBottom: 33,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  headerGreeting: {
    fontSize: 16,
    fontWeight: '400',
    color: 'rgba(255,255,255,0.85)',
  },
  headerName: {
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Cards
  card: {
    backgroundColor: '#FFFFFF',
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
    color: '#000000',
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
  navArrow:  {fontSize: 22, color: '#8B7EEE', fontWeight: '600'},
  monthLabel:{fontSize: 14, fontWeight: '700', color: '#000000'},

  // Calendar
  weekRow:  {flexDirection: 'row', marginBottom: 2},
  dowLabel: {
    width: CELL_SIZE,
    textAlign: 'center',
    fontSize: 10,
    fontWeight: '700',
    color: '#7E7E7E',
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
  cellToday:    {backgroundColor: '#EDE9FF'},
  dayNum:       {fontSize: 11, fontWeight: '500', color: '#000000', lineHeight: 14},
  dayNumToday:  {color: '#8B7EEE', fontWeight: '800'},
  cellFaceArea: {
    height: FACE_IN_CAL,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },

  // Frequency chart
  emptyNote: {fontSize: 12, color: '#7E7E7E', textAlign: 'center', paddingVertical: 6},
  freqRow:   {flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 6},
  freqLabel: {width: 82, fontSize: 11, fontWeight: '500', color: '#333333'},
  barTrack:  {flex: 1, height: 12, backgroundColor: '#E8E8E8', borderRadius: 6, overflow: 'hidden'},
  barFill:   {height: '100%', borderRadius: 6},
  freqCount: {width: 20, fontSize: 11, fontWeight: '700', color: '#333333', textAlign: 'right'},
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
    backgroundColor: '#A18CE6',
    borderRadius: 20,
    padding: 20,
    width: '100%',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
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
    backgroundColor: '#FFFFFF',
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
    color: '#333333',
    textAlign: 'center',
  },
});

export default MoodScreen;
