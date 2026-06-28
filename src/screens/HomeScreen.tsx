import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  StatusBar,
} from 'react-native';
import {useAuth} from '../context/AuthContext';
import {Colors} from '../theme/colors';

// ── Action card data ──────────────────────────────────────────────────────────

const HOME_ACTIONS = [
  {
    key: 'CommunityForum',
    title: 'Connect with Others',
    subtitle: 'Join the community forum',
    emoji: '💬',
    badge: null,
  },
  {
    key: 'ResourceLibrary',
    title: 'Referrals',
    subtitle: 'Mental health resources for you',
    emoji: '👥',
    badge: null,
  },
  {
    key: 'ThankYou',
    title: 'Send a Thank You Note',
    subtitle: 'Brighten a colleague\'s day anonymously',
    emoji: '💌',
    badge: null,
  },
  {
    key: 'Journal',
    title: 'Open Journal',
    subtitle: 'Write about your experiences',
    emoji: '📓',
    badge: null,
  },
];

// ── Component ─────────────────────────────────────────────────────────────────

const HomeScreen = ({navigation}: any) => {
  const {user} = useAuth();
  const firstName = user?.name?.split(' ')[0] ?? 'Friend';

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.white} />

      {/* ── Welcome header ── */}
      <View style={styles.welcomeSection}>
        <Text style={styles.welcomeLine}>Welcome back,</Text>
        <Text style={styles.userName}>{firstName}!</Text>
        <Text style={styles.subtitle}>What would you like to do today?</Text>
      </View>

      {/* ── Mood quick-access banner ── */}
      <TouchableOpacity
        style={styles.moodBanner}
        onPress={() => navigation.navigate('Mood')}
        activeOpacity={0.85}>

        <View style={styles.moodBannerBody}>
        <Text style={styles.moodBannerTitle}>How are you feeling today?</Text>
        <Text style={styles.moodBannerSub}>Tap to log your mood</Text>
        </View>
        <Text style={styles.moodBannerEmoji}>😊</Text>
      </TouchableOpacity>

      {/* ── Main action cards ── */}
      <View style={styles.actionsSection}>
        {HOME_ACTIONS.map(action => (
          <TouchableOpacity
            key={action.key}
            style={styles.actionCard}
            onPress={() => navigation.navigate(action.key)}
            activeOpacity={0.82}>
            {/* Left text */}
            <View style={styles.actionLeft}>
              <Text style={styles.actionTitle}>{action.title}</Text>
              <Text style={styles.actionSubtitle}>{action.subtitle}</Text>
            </View>

            {/* Right: optional badge + emoji */}
            <View style={styles.actionRight}>
              {action.badge !== null && (
                <View style={styles.badgeChip}>
                  <Text style={styles.badgeText}>{action.badge}</Text>
                </View>
              )}
              <Text style={styles.actionEmoji}>{action.emoji}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
};

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: Colors.backgroundLight,
  },
  container: {
    paddingBottom: 40,
  },

  // Welcome
  welcomeSection: {
    paddingHorizontal: 22,
    paddingTop: 24,
    paddingBottom: 20,
  },
  welcomeLine: {
    fontSize: 18,
    color: Colors.textSecondary,
    fontWeight: '400',
  },
  userName: {
    fontSize: 30,
    fontWeight: '800',
    color: Colors.text,
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
  },

  // Mood banner
  moodBanner: {
    marginHorizontal: 22,
    marginBottom: 22,
    backgroundColor: Colors.primary,
    borderRadius: 18,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: Colors.primary,
    shadowOffset: {width: 0, height: 6},
    shadowOpacity: 0.32,
    shadowRadius: 10,
    elevation: 5,
  },
  moodBannerEmoji: {fontSize: 32, marginRight: 14},
  moodBannerBody: {flex: 1},
  moodBannerTitle: {
    color: Colors.white,
    fontWeight: '700',
    fontSize: 15,
  },
  moodBannerSub: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 12,
    marginTop: 2,
  },
  moodBannerChevron: {
    color: Colors.white,
    fontSize: 26,
    fontWeight: '300',
    marginLeft: 6,
  },

  // Action cards
  actionsSection: {
    paddingHorizontal: 22,
  },
  actionCard: {
    backgroundColor: Colors.primary,
    borderRadius: 18,
    paddingVertical: 20,
    paddingHorizontal: 20,
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: Colors.primary,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.22,
    shadowRadius: 8,
    elevation: 4,
  },
  actionLeft: {flex: 1, paddingRight: 8},
  actionTitle: {
    color: Colors.white,
    fontWeight: '700',
    fontSize: 17,
    marginBottom: 3,
  },
  actionSubtitle: {
    color: 'rgba(255,255,255,0.72)',
    fontSize: 12,
  },
  actionRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  badgeChip: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    minWidth: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
    marginRight: 8,
  },
  badgeText: {
    color: Colors.primary,
    fontSize: 11,
    fontWeight: '800',
  },
  actionEmoji: {fontSize: 26},

  // Encouragement
  encouragement: {
    marginHorizontal: 22,
    marginTop: 8,
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  encouragementIcon: {fontSize: 20, marginRight: 12},
  encouragementQuote: {
    flex: 1,
    fontSize: 13,
    color: Colors.textSecondary,
    fontStyle: 'italic',
    lineHeight: 19,
  },
});

export default HomeScreen;
