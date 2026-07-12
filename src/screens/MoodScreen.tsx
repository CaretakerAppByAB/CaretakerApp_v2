/**
 * AlzApp — Mood Screen (SKELETON)
 *
 * DEVELOPER NOTE:
 * This screen shows a bare calendar grid for the current month.
 * Your team needs to implement:
 *   - Mood check-in modal (emoji scale 😢☹️😐🙂😀)
 *   - Saving mood per day to AsyncStorage (key: @alz_moods_${user.id})
 *   - Colour-coding calendar days based on logged mood
 *   - Viewing past mood entries
 */

import React, {useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import {Colors} from '../theme/colors';

// ── Constants ─────────────────────────────────────────────────────────────────

const WEEK_DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

// ── Component ─────────────────────────────────────────────────────────────────

const MoodScreen = () => {
  const now = new Date();
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());

  const handleMonthChange = (delta: number) => {
    let m = viewMonth + delta;
    let y = viewYear;
    if (m < 0) { m = 11; y--; }
    if (m > 11) { m = 0; y++; }
    setViewMonth(m);
    setViewYear(y);
  };

  // Build the calendar grid
  const firstDow = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const isCurrentMonth =
    now.getFullYear() === viewYear && now.getMonth() === viewMonth;

  const cells: (number | null)[] = [
    ...Array(firstDow).fill(null),
    ...Array.from({length: daysInMonth}, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) { cells.push(null); }

  const weeks: (number | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7));
  }

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}>

      {/* ── Under development banner ── */}
      <View style={styles.devBanner}>
        <Text style={styles.devBannerEmoji}>🚧</Text>
        <View style={styles.devBannerBody}>
          <Text style={styles.devBannerTitle}>Mood Tracking — Under Development</Text>
          <Text style={styles.devBannerSub}>
            Implement the daily mood check-in modal and colour-coded calendar
            indicators in MoodScreen.tsx.
          </Text>
        </View>
      </View>

      {/* ── Calendar card ── */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Mood Calendar</Text>

        {/* Month navigation */}
        <View style={styles.monthNav}>
          <TouchableOpacity
            style={styles.navBtn}
            onPress={() => handleMonthChange(-1)}>
            <Text style={styles.navArrow}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.monthLabel}>
            {MONTH_NAMES[viewMonth]} {viewYear}
          </Text>
          <TouchableOpacity
            style={styles.navBtn}
            onPress={() => handleMonthChange(1)}>
            <Text style={styles.navArrow}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Day-of-week headers */}
        <View style={styles.weekRow}>
          {WEEK_DAYS.map(d => (
            <Text key={d} style={styles.dowLabel}>{d}</Text>
          ))}
        </View>

        {/* Date grid — no mood colours yet */}
        {weeks.map((week, wi) => (
          <View key={wi} style={styles.weekRow}>
            {week.map((day, di) => {
              if (day === null) {
                return <View key={`e-${wi}-${di}`} style={styles.cell} />;
              }
              const isToday = isCurrentMonth && day === now.getDate();
              return (
                <View
                  key={`${wi}-${di}`}
                  style={[styles.cell, isToday && styles.cellToday]}>
                  <Text
                    style={[
                      styles.dayNum,
                      isToday && styles.dayNumToday,
                    ]}>
                    {day}
                  </Text>
                </View>
              );
            })}
          </View>
        ))}

      </View>

      {/* ── Developer notes ── */}
      <View style={styles.noteCard}>
        <Text style={styles.noteTitle}>Developer Notes</Text>
        <Text style={styles.noteText}>
          {'• Show a bottom-sheet modal on page load asking user to rate mood 0–4\n'}
          {'• Emojis: 😢 ☹️ 😐 🙂 😀\n'}
        </Text>
      </View>
    </ScrollView>
  );
};

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  scroll: {flex: 1, backgroundColor: Colors.backgroundLight},
  container: {padding: 16, paddingBottom: 40},

  devBanner: {
    backgroundColor: '#FEF3C7',
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  devBannerEmoji: {fontSize: 22, marginRight: 10, marginTop: 1},
  devBannerBody: {flex: 1},
  devBannerTitle: {fontSize: 14, fontWeight: '700', color: '#92400E'},
  devBannerSub: {fontSize: 12, color: '#B45309', marginTop: 3, lineHeight: 17},

  card: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: Colors.primary,
    shadowOffset: {width: 0, height: 3},
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 16,
  },

  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  navBtn: {padding: 8},
  navArrow: {fontSize: 26, color: Colors.primary, fontWeight: '600'},
  monthLabel: {fontSize: 16, fontWeight: '700', color: Colors.text},

  weekRow: {flexDirection: 'row', marginBottom: 2},
  dowLabel: {
    flex: 1,
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textSecondary,
    paddingBottom: 8,
  },

  cell: {
    flex: 1,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    margin: 1,
  },
  cellToday: {borderWidth: 2, borderColor: Colors.primary},
  dayNum: {fontSize: 13, color: Colors.text, fontWeight: '500'},
  dayNumToday: {color: Colors.primary, fontWeight: '800'},

  placeholder: {
    marginTop: 20,
    backgroundColor: Colors.primaryLight,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  placeholderEmoji: {fontSize: 32, marginBottom: 8},
  placeholderText: {
    color: Colors.primary,
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 18,
  },

  noteCard: {
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  noteTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 10,
  },
  noteText: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 21,
    fontFamily: 'Courier',
  },
});

export default MoodScreen;
