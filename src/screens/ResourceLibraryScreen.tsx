/**
 * AlzApp — Resource Library Screen (SKELETON)
 *
 * DEVELOPER NOTE:
 * This screen is a placeholder with a single dummy resource card.
 * Your team needs to implement:
 *   - A full library of mental health resources (see data structure below)
 *   - Keyword extraction from journal entries mapped to resource tags
 *   - Category filtering and search
 *   - Region-based resource recommendations
 *
 * Each real resource should follow the Resource interface shape below.
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Alert,
} from 'react-native';
import {Colors} from '../theme/colors';

// ── Data structure (for developers) ──────────────────────────────────────────
// When populating the real library, each resource should have this shape:
//
// interface Resource {
//   id: string;
//   title: string;
//   description: string;
//   category: string;
//   tags: string[];        // matched against journal keywords
//   phone?: string;        // optional call button
//   url?: string;          // optional web link
//   emoji: string;
//   region?: string;       // for geo-based filtering
// }
// ─────────────────────────────────────────────────────────────────────────────

const ResourceLibraryScreen = () => {
  const openURL = (url: string) =>
    Linking.openURL(url).catch(() =>
      Alert.alert('Error', 'Could not open this link.'),
    );

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}>

      {/* ── Under development banner ── */}
      <View style={styles.devBanner}>
        <Text style={styles.devBannerEmoji}>🚧</Text>
        <View style={styles.devBannerBody}>
          <Text style={styles.devBannerTitle}>
            Resource Library — Under Development
          </Text>
          <Text style={styles.devBannerSub}>
            Your content team will populate this with real mental health
            resources tagged to caregivers' needs.
          </Text>
        </View>
      </View>

      {/* ── Single placeholder resource card ── */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderText}>
            <Text style={styles.cardTitle}>Placeholder Resource</Text>
            <View style={styles.categoryTag}>
              <Text style={styles.categoryTagText}>Example Category</Text>
            </View>
          </View>
        </View>

        <Text style={styles.cardDesc}>
          Replace this with a real mental health resource. 
        </Text>

        {/* Tag pills */}
        <View style={styles.tagRow}>
          {['placeholder', 'example', 'todo'].map(tag => (
            <View key={tag} style={styles.tagPill}>
              <Text style={styles.tagPillText}>{tag}</Text>
            </View>
          ))}
        </View>

        {/* Action */}
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => openURL('https://www.google.com')}>
          <Text style={styles.actionBtnText}>🌐 Open Resource</Text>
        </TouchableOpacity>
      </View>

      {/* ── Developer notes card ── */}
      <View style={styles.noteCard}>
        <Text style={styles.noteTitle}>📝 Developer Notes</Text>
        <Text style={styles.noteText}>
          {'• Add real resources to a RESOURCES array in this file\n'}
          {'• Each resource needs: title, description, category, tags[], emoji\n'}
          {'• Optional: phone (shows Call button), url (shows Web button)\n'}
          {'• tags[] will be matched against keywords from journal entries\n'}
          {'• Add search bar filtering by title/tags\n'}
          {'• Add category chip filter row\n'}
          {'• region field ready for geo-filtering — hook into user profile'}
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
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    shadowColor: Colors.primary,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  cardEmoji: {fontSize: 26, marginRight: 12, marginTop: 2},
  cardHeaderText: {flex: 1},
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 5,
  },
  categoryTag: {
    backgroundColor: Colors.primaryLight,
    alignSelf: 'flex-start',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  categoryTagText: {color: Colors.primaryDark, fontSize: 11, fontWeight: '600'},
  cardDesc: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 19,
    marginBottom: 12,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  tagPill: {
    backgroundColor: Colors.backgroundLight,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginRight: 6,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tagPillText: {fontSize: 10, color: Colors.textSecondary},
  actionBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 10,
    alignSelf: 'flex-start',
  },
  actionBtnText: {color: Colors.white, fontSize: 13, fontWeight: '700'},

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
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 20,
    fontFamily: 'Courier',
  },
});

export default ResourceLibraryScreen;
