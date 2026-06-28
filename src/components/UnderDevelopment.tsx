import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {Colors} from '../theme/colors';

interface Props {
  emoji: string;
  featureName: string;
  description: string;
}

/**
 * Generic placeholder shown for features not yet implemented.
 * Developers can replace this component when working on their feature.
 */
const UnderDevelopment: React.FC<Props> = ({emoji, featureName, description}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.emoji}>{emoji}</Text>

      <View style={styles.badge}>
        <Text style={styles.badgeText}>🚧  Under Development</Text>
      </View>

      <Text style={styles.title}>{featureName}</Text>
      <Text style={styles.description}>{description}</Text>

      <View style={styles.infoBox}>
        <Text style={styles.infoIcon}>👷</Text>
        <Text style={styles.infoText}>
          A developer is assigned to build this feature. It will be live in
          the next sprint.
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundLight,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emoji: {
    fontSize: 72,
    marginBottom: 20,
  },
  badge: {
    backgroundColor: '#FEF3C7',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginBottom: 20,
  },
  badgeText: {
    color: '#92400E',
    fontWeight: '700',
    fontSize: 13,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  description: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 28,
  },
  infoBox: {
    backgroundColor: Colors.primaryLight,
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    maxWidth: 300,
  },
  infoIcon: {
    fontSize: 18,
    marginRight: 10,
    marginTop: 1,
  },
  infoText: {
    flex: 1,
    color: Colors.primaryDark,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '500',
  },
});

export default UnderDevelopment;
