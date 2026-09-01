/**
 * HomeScreen.tsx — final compact layout
 * Place at: src/screens/HomeScreen.tsx
 *
 * Changes in this version:
 *  - All emojis removed (mood circles are plain, profile is drawn with Views)
 *  - Grid tile labels are now INSIDE the tile box at the bottom
 *  - Tiles and all sections made compact so everything fits on screen
 *  - Mood Analysis chart with M T W T F S S days is fully visible
 */

import React, {useState, useEffect, useCallback} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  StatusBar,
  Dimensions,
  SafeAreaView,
} from 'react-native';
import {useAuth} from '../context/AuthContext';
import Avatar from '../components/Avatar';
import MoodFace from '../components/MoodFace';
import {Colors} from '../theme/colors';
import {
  CalendarIcon,
  JournalIcon,
  CommunityIcon,
  SupportIcon,
  GratitudeIcon,
  MessageBubbleIcon,
} from '../components/icons/TabIcons';
import {
  MoodType,
  MOOD_OPTIONS,
  MOOD_COLORS,
  MOOD_HAPPINESS,
  saveMood,
  getMoodForDate,
  loadWeekMoods,
  getWeekStart,
} from '../services/moodService';
import {getQuoteOfTheDay} from '../constants/quotes';

const {width: SCREEN_WIDTH} = Dimensions.get('window');

// ── Helpers ────────────────────────────────────────────────────────────────────

const getGreeting = (): string => {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return 'Good Morning';
  if (h >= 12 && h < 17) return 'Good Afternoon';
  if (h >= 17 && h < 21) return 'Good Evening';
  return 'Good Night';
};

export const getFirstName = (fullName?: string | null): string => {
  if (!fullName) return 'Friend';

  const cleanedName = fullName.trim();
  if (!cleanedName) return 'Friend';

  const nameParts = cleanedName.split(/\s+/);
  const firstPart = nameParts[0];

  if (!firstPart) return 'Friend';

  const sansTitle = firstPart.replace(/^(mr|mrs|ms|miss|dr)\.?$/i, '');
  return sansTitle || nameParts[1] || 'Friend';
};

// ── Grid config ────────────────────────────────────────────────────────────────

// 3 columns, 24px side padding each side, 8px gap × 2 between 3 columns
const TILE_W = Math.floor((SCREEN_WIDTH - 48 - 16) / 3);
const TILE_H = 82;
const ICON_SIZE = Math.floor(TILE_W * 0.38);

// 5 mood options in a row, 20px side padding each side, 10px gap × 4 between them
const MOOD_GAP = 10;
const MOOD_SIDE_PADDING = 20;
const MOOD_CIRCLE_SIZE = Math.floor(
  (SCREEN_WIDTH - MOOD_SIDE_PADDING * 2 - MOOD_GAP * (MOOD_OPTIONS.length - 1)) / MOOD_OPTIONS.length,
);

const GRID_ITEMS = [
  {screen: 'Mood',      label: 'Mood Calendar', Icon: CalendarIcon},
  {screen: 'Journal',   label: 'My Journal',    Icon: JournalIcon},
  {screen: 'Community', label: 'Community',     Icon: CommunityIcon},
  {screen: 'Support',   label: 'Get Support',   Icon: SupportIcon},
  {screen: 'Gratitude', label: 'Gratitude',     Icon: GratitudeIcon},
  {screen: 'Messages',  label: 'Messages',      Icon: MessageBubbleIcon},
];

// ── Mood chart ─────────────────────────────────────────────────────────────────

const CHART_H = 66;
const CHART_W = SCREEN_WIDTH - 48;
const DAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const EMPTY_DOT_Y = 0.5; // baseline height for days with no logged mood

const MoodLineChart: React.FC<{weekMoods: (MoodType | undefined)[]}> = ({weekMoods}) => {
  const step = CHART_W / (weekMoods.length - 1);
  const getX = (i: number) => i * step;
  const getY = (val: number) => CHART_H * (1 - val);

  const segments: {midX: number; midY: number; length: number; angle: number}[] = [];
  for (let i = 0; i < weekMoods.length - 1; i++) {
    const moodA = weekMoods[i];
    const moodB = weekMoods[i + 1];
    if (!moodA || !moodB) continue; // only connect days that both have data
    const x1 = getX(i);
    const y1 = getY(MOOD_HAPPINESS[moodA]);
    const x2 = getX(i + 1);
    const y2 = getY(MOOD_HAPPINESS[moodB]);
    const dx = x2 - x1;
    const dy = y2 - y1;
    const length = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(dy, dx) * (180 / Math.PI);
    segments.push({midX: (x1 + x2) / 2, midY: (y1 + y2) / 2, length, angle});
  }

  const hasAnyData = weekMoods.some(Boolean);

  return (
    <View>
      {/* Chart area */}
      <View style={{height: CHART_H, width: CHART_W, marginHorizontal: 24}}>
        {segments.map((seg, i) => (
          <View
            key={`ln-${i}`}
            style={{
              position: 'absolute',
              width: seg.length,
              height: 1.5,
              backgroundColor: Colors.primaryMedium,
              left: seg.midX - seg.length / 2,
              top: seg.midY,
              transform: [{rotate: `${seg.angle}deg`}],
            }}
          />
        ))}
        {weekMoods.map((mood, i) => (
          <View
            key={`dt-${i}`}
            style={{
              position: 'absolute',
              width: mood ? 20 : 8,
              height: mood ? 20 : 8,
              borderRadius: 10,
              backgroundColor: mood ? MOOD_COLORS[mood] : Colors.border,
              left: getX(i) - (mood ? 10 : 4),
              top: getY(mood ? MOOD_HAPPINESS[mood] : EMPTY_DOT_Y) - (mood ? 10 : 4),
            }}
          />
        ))}
      </View>

      {/* Day labels */}
      <View style={styles.daysRow}>
        {DAYS.map((d, i) => (
          <Text key={i} style={styles.dayLabel}>{d}</Text>
        ))}
      </View>

      {!hasAnyData && (
        <Text style={styles.chartEmptyNote}>
          Log your mood daily to see your week take shape here.
        </Text>
      )}
    </View>
  );
};

// ── Main component ─────────────────────────────────────────────────────────────

const HomeScreen = ({navigation}: any) => {
  const {user} = useAuth();
  const uid = user?.uid ?? 'guest';
  const displayName = user?.name ?? 'Friend';
  const firstName = getFirstName(displayName);
  const quote = getQuoteOfTheDay();

  const [todayMood,  setTodayMood]  = useState<MoodType | undefined>(undefined);
  const [weekOffset, setWeekOffset] = useState(0); // 0 = this week, -1 = last week, ...
  const [weekMoods,  setWeekMoods]  = useState<(MoodType | undefined)[]>(Array(7).fill(undefined));

  const weekStart = getWeekStart(new Date());
  weekStart.setDate(weekStart.getDate() + weekOffset * 7);

  const refreshWeek = useCallback(() => {
    loadWeekMoods(uid, weekStart).then(setWeekMoods);
  }, [uid, weekOffset]);

  useEffect(() => { refreshWeek(); }, [refreshWeek]);

  useEffect(() => {
    getMoodForDate(uid, new Date()).then(setTodayMood);
  }, [uid]);

  const handleSelectMood = async (mood: MoodType) => {
    setTodayMood(mood);
    await saveMood(uid, new Date(), mood);
    if (weekOffset === 0) refreshWeek();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />
      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        bounces={false}>

        {/* ── Header ── */}
        <View style={styles.header}>
          <View style={styles.headerTextCol}>
            <Text style={styles.greeting}>{getGreeting()}</Text>
            <Text style={styles.userName}>
              <Text style={styles.userNameBold}>{firstName}</Text>
            </Text>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('Profile')} activeOpacity={0.8}>
            <Avatar name={displayName} size={40} variant="onDark"/>
          </TouchableOpacity>
        </View>

        {/* ── White section ── */}
        <View style={styles.whiteSection}>

          <View style={styles.divider} />

          {/* Mood picker — same mood set as the Mood Calendar, logs today's mood */}
          <Text style={styles.moodPrompt}>How are you feeling today?</Text>
          <View style={styles.moodRow}>
            {MOOD_OPTIONS.map(opt => {
              const isSelected = todayMood === opt.type;
              return (
                <TouchableOpacity
                  key={opt.type}
                  onPress={() => handleSelectMood(opt.type)}
                  activeOpacity={0.8}
                  style={[
                    styles.moodCircle,
                    isSelected && styles.moodCircleSelected,
                  ]}>
                  <MoodFace mood={opt.type} size={30}/>
                  {isSelected && (
                    <View style={styles.moodCheckBadge}>
                      <Text style={styles.moodCheckMark}>✓</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
          {todayMood && (
            <Text style={styles.moodSelectedNote}>
              Today's mood: <Text style={styles.moodSelectedNoteBold}>
                {MOOD_OPTIONS.find(o => o.type === todayMood)?.label}
              </Text>
            </Text>
          )}

          <View style={styles.divider} />

          {/* 3×2 grid — labels inside tiles */}
          <View style={styles.grid}>
            {GRID_ITEMS.map((item, i) => (
              <TouchableOpacity
                key={i}
                activeOpacity={0.75}
                onPress={() => navigation.navigate(item.screen)}>
                <View style={styles.tileBox}>
                  {/* Icon area */}
                  <View style={styles.tileIconArea}>
                    {item.Icon && (
                      <item.Icon color={Colors.white} size={ICON_SIZE} />
                    )}
                  </View>
                  {/* Label inside tile at bottom */}
                  <Text style={styles.tileLabel} numberOfLines={1}>
                    {item.label}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>

        </View>

        {/* ── Mood Analysis ── */}
        <View style={styles.analysisSection}>
          <Text style={styles.analysisTitle}>Mood Analysis</Text>
          <View style={styles.analysisSubRow}>
            <Text style={styles.analysisSubtitle}>
              {'  '}{weekOffset === 0 ? 'This week' : weekOffset === -1 ? 'Last week' : `${-weekOffset} weeks ago`}
            </Text>
            <View style={styles.arrowGroup}>
              <TouchableOpacity style={styles.arrowBtn} onPress={() => setWeekOffset(w => w - 1)}>
                <Text style={styles.arrowText}>‹</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.arrowBtn}
                onPress={() => setWeekOffset(w => Math.min(0, w + 1))}
                disabled={weekOffset === 0}>
                <Text style={[styles.arrowText, weekOffset === 0 && styles.arrowTextDisabled]}>›</Text>
              </TouchableOpacity>
            </View>
          </View>
          <MoodLineChart weekMoods={weekMoods}/>
          <View style={{height: 6}} />
        </View>

        {/* ── Quote of the Day ── */}
        <View style={styles.quoteCard}>
          <Text style={styles.quoteLabel}>Quote of the Day</Text>
          <Text style={styles.quoteText}>“{quote}”</Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
};

// ── Styles ─────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.primary,
  },
  scroll: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  // ── Header ──
  header: {
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 14,
  },
  headerTextCol: {
    flexShrink: 1,
  },

  greeting: {
    fontSize: 20,
    fontWeight: '400',
    color: Colors.white,
    lineHeight: 28,
  },
  userName: {
    fontSize: 20,
    fontWeight: '400',
    color: Colors.white,
    lineHeight: 28,
  },
  userNameBold: {
    fontWeight: '700',
  },

  // ── White section ──
  whiteSection: {
    backgroundColor: Colors.background,
    paddingBottom: 6,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginHorizontal: 24,
  },

  // ── Mood picker — same faces as the Mood Calendar ──
  moodPrompt: {
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '500',
    color: Colors.text,
    marginTop: 12,
    marginBottom: 10,
  },
  moodRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: MOOD_GAP,
    paddingHorizontal: MOOD_SIDE_PADDING,
    marginBottom: 6,
  },
  moodCircle: {
    width: MOOD_CIRCLE_SIZE,
    height: MOOD_CIRCLE_SIZE,
    borderRadius: MOOD_CIRCLE_SIZE / 2,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  moodCircleSelected: {
    backgroundColor: Colors.primary,
    borderWidth: 2,
    borderColor: Colors.white,
    transform: [{scale: 1.08}],
  },
  moodCheckBadge: {
    position: 'absolute',
    top: -3,
    right: -3,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Colors.success,
    borderWidth: 1.5,
    borderColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moodCheckMark: {
    fontSize: 9,
    lineHeight: 11,
    color: Colors.white,
    fontWeight: '700',
  },
  moodSelectedNote: {
    textAlign: 'center',
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
    marginBottom: 10,
  },
  moodSelectedNoteBold: {
    color: Colors.primaryDark,
    fontWeight: '700',
  },

  // ── Grid — labels inside tiles ──
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 10,
    gap: 8,
  },
  tileBox: {
    width: TILE_W,
    height: TILE_H,
    backgroundColor: Colors.primary,
    borderRadius: 12,
    overflow: 'hidden',
    alignItems: 'center',
  },
  tileIconArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.white,
    paddingBottom: 6,
    paddingHorizontal: 4,
    textAlign: 'center',
  },

  // ── Mood Analysis ──
  analysisSection: {
    backgroundColor: Colors.backgroundLight,
    paddingTop: 10,
    paddingBottom: 8,
  },
  analysisTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
    paddingHorizontal: 16,
  },
  analysisSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginTop: 2,
    marginBottom: 10,
  },
  analysisSubtitle: {
    fontSize: 13,
    fontWeight: '400',
    color: Colors.textSecondary,
  },
  arrowGroup: {
    flexDirection: 'row',
  },
  arrowBtn: {
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  arrowText: {
    fontSize: 22,
    color: Colors.primary,
    fontWeight: '300',
  },
  arrowTextDisabled: {
    color: Colors.border,
  },

  // Chart days
  daysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    marginTop: 8,
  },
  dayLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.textSecondary,
    width: 18,
    textAlign: 'center',
  },
  chartEmptyNote: {
    fontSize: 11,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 10,
    paddingHorizontal: 32,
  },

  // ── Quote of the Day ──
  quoteCard: {
    backgroundColor: Colors.primaryLight,
    borderRadius: 16,
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 20,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
  },
  quoteLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primaryDark,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  quoteText: {
    fontSize: 15,
    fontWeight: '500',
    fontStyle: 'italic',
    color: Colors.text,
    lineHeight: 22,
  },
});

export default HomeScreen;
