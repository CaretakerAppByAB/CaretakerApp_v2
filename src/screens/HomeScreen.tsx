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

import React, {useState} from 'react';
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
import {
  MoodChartIcon,
  JournalIcon,
  CommunityIcon,
  SupportIcon,
  MessagesIcon,
} from '../components/icons/TabIcons';

const {width: SCREEN_WIDTH} = Dimensions.get('window');

// ── Helpers ────────────────────────────────────────────────────────────────────

const getGreeting = (): string => {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return 'Good Morning';
  if (h >= 12 && h < 17) return 'Good Afternoon';
  if (h >= 17 && h < 21) return 'Good Evening';
  return 'Good Night';
};

// ── Profile icon (no emoji) ────────────────────────────────────────────────────

const ProfileIcon = () => (
  <View style={styles.profileCircle}>
    {/* Head */}
    <View style={styles.personHead} />
    {/* Body — clipped by profileCircle's overflow:hidden */}
    <View style={styles.personBody} />
  </View>
);

// ── Grid config ────────────────────────────────────────────────────────────────

// 3 columns, 24px side padding each side, 8px gap × 2 between 3 columns
const TILE_W = Math.floor((SCREEN_WIDTH - 48 - 16) / 3);
const TILE_H = 140;
const ICON_SIZE = Math.floor(TILE_W * 0.38);

const GRID_ITEMS = [
  {screen: 'Mood',      label: 'Mood Calendar', Icon: MoodChartIcon},
  {screen: 'Journal',   label: 'My Journal',    Icon: JournalIcon},
  {screen: 'Community', label: 'Community',     Icon: CommunityIcon},
  {screen: 'Support',   label: 'Get Support',   Icon: SupportIcon},
  {screen: 'Journal',   label: 'Gratitude',     Icon: null},   // SVG TBD
  {screen: 'Messages',  label: 'Messages',      Icon: MessagesIcon},
];

// ── Mood chart ─────────────────────────────────────────────────────────────────

const CHART_H = 90;
const CHART_W = SCREEN_WIDTH - 48;
const DAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const WEEKLY_MOOD = [0.25, 0.7, 0.45, 0.6, 0.85, 0.5, 0.35];

const MoodLineChart: React.FC = () => {
  const step = CHART_W / (WEEKLY_MOOD.length - 1);
  const getX = (i: number) => i * step;
  const getY = (val: number) => CHART_H * (1 - val);

  const segments = WEEKLY_MOOD.slice(0, -1).map((_, i) => {
    const x1 = getX(i);
    const y1 = getY(WEEKLY_MOOD[i]);
    const x2 = getX(i + 1);
    const y2 = getY(WEEKLY_MOOD[i + 1]);
    const dx = x2 - x1;
    const dy = y2 - y1;
    const length = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(dy, dx) * (180 / Math.PI);
    return {midX: (x1 + x2) / 2, midY: (y1 + y2) / 2, length, angle};
  });

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
              backgroundColor: '#9E9E9E',
              left: seg.midX - seg.length / 2,
              top: seg.midY,
              transform: [{rotate: `${seg.angle}deg`}],
            }}
          />
        ))}
        {WEEKLY_MOOD.map((val, i) => (
          <View
            key={`dt-${i}`}
            style={{
              position: 'absolute',
              width: 20,
              height: 20,
              borderRadius: 10,
              backgroundColor: '#7E7E7E',
              left: getX(i) - 10,
              top: getY(val) - 10,
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
    </View>
  );
};

// ── Main component ─────────────────────────────────────────────────────────────

const HomeScreen = ({navigation}: any) => {
  const {user} = useAuth();
  const [selectedMood, setSelectedMood] = useState<number | null>(null);
  const displayName = user?.name ?? 'Friend';

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#CBCBCB" />
      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        bounces={false}>

        {/* ── Header ── */}
        <View style={styles.header}>
          <ProfileIcon />
          <Text style={styles.greeting}>{getGreeting()}</Text>
          <Text style={styles.userName}>
            {'Mr. '}
            <Text style={styles.userNameBold}>{displayName}</Text>
          </Text>
        </View>

        {/* ── White section ── */}
        <View style={styles.whiteSection}>

          <View style={styles.divider} />

          {/* Mood picker — plain circles, no emoji */}
          <Text style={styles.moodPrompt}>How are you feeling today?</Text>
          <View style={styles.moodRow}>
            {[0, 1, 2, 3, 4].map(i => (
              <TouchableOpacity
                key={i}
                onPress={() => setSelectedMood(i)}
                activeOpacity={0.8}
                style={[
                  styles.moodCircle,
                  selectedMood === i && styles.moodCircleSelected,
                ]}
              />
            ))}
          </View>

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
                      <item.Icon color="#FFFFFF" size={ICON_SIZE} />
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
            <Text style={styles.analysisSubtitle}>  This week</Text>
            <View style={styles.arrowGroup}>
              <TouchableOpacity style={styles.arrowBtn}>
                <Text style={styles.arrowText}>‹</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.arrowBtn}>
                <Text style={styles.arrowText}>›</Text>
              </TouchableOpacity>
            </View>
          </View>
          <MoodLineChart />
          <View style={{height: 12}} />
        </View>

      </ScrollView>
    </SafeAreaView>
  );
};

// ── Styles ─────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#CBCBCB',
  },
  scroll: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  // ── Header ──
  header: {
    backgroundColor: '#CBCBCB',
    paddingHorizontal: 20,
    paddingTop: 5,
    paddingBottom: 5,
  },

  // Profile icon drawn with Views — no emoji
  profileCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#9E9E9E',
    alignItems: 'center',
    overflow: 'hidden',
    marginBottom: 10,
  },
  personHead: {
    position: 'absolute',
    top: 6,
    width: 13,
    height: 13,
    borderRadius: 6.5,
    backgroundColor: 'rgba(255,255,255,0.85)',
  },
  personBody: {
    position: 'absolute',
    bottom: -10,
    width: 28,
    height: 20,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.85)',
  },

  greeting: {
    fontSize: 20,
    fontWeight: '400',
    color: '#000000',
    lineHeight: 28,
  },
  userName: {
    fontSize: 20,
    fontWeight: '400',
    color: '#000000',
    lineHeight: 28,
  },
  userNameBold: {
    fontWeight: '700',
  },

  // ── White section ──
  whiteSection: {
    backgroundColor: '#FFFFFF',
  },
  divider: {
    height: 1,
    marginTop: 10,
    backgroundColor: '#000000',
    marginHorizontal: 24,
  },

  // ── Mood picker — plain circles ──
  moodPrompt: {
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '500',
    color: '#000000',
    marginTop: 12,
    marginBottom: 10,
  },
  moodRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  moodCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#D9D9D9',
  },
  moodCircleSelected: {
    backgroundColor: '#A18CE6',
    transform: [{scale: 1.1}],
  },

  // ── Grid — labels inside tiles ──
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 24,
    paddingTop: 10,
    paddingBottom: 14,
    gap: 8,
  },
  tileBox: {
    width: TILE_W,
    height: TILE_H,
    backgroundColor: '#D9D9D9',
    borderRadius: 10,
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
    fontWeight: '500',
    color: '#000000',
    paddingBottom: 7,
    paddingHorizontal: 4,
    textAlign: 'center',
  },

  // ── Mood Analysis ──
  analysisSection: {
    backgroundColor: '#E9E9E9',
    paddingTop: 12,
  },
  analysisTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#000000',
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
    color: '#000000',
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
    color: '#000000',
    fontWeight: '300',
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
    color: '#000000',
    width: 18,
    textAlign: 'center',
  },
});

export default HomeScreen;
