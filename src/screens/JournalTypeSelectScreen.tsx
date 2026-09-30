/**
 * JournalTypeSelectScreen.tsx
 * Place at: src/screens/JournalTypeSelectScreen.tsx
 */

import React from 'react';
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';
import {GUIDED_PROMPTS} from '../services/journalService';
import ScreenHeader from '../components/ScreenHeader';
import {Colors} from '../theme/colors';

const JournalTypeSelectScreen: React.FC<{navigation: any}> = ({navigation}) => {

  const startGuided = () => {
    const prompt = GUIDED_PROMPTS[Math.floor(Math.random() * GUIDED_PROMPTS.length)];
    navigation.navigate('JournalEntry', {type: 'guided', prompt});
  };

  const startFreeWrite = () => {
    navigation.navigate('JournalEntry', {type: 'freeWrite', prompt: ''});
  };

  return (
    <View style={s.screen}>
      <ScreenHeader title="New Entry" onBack={() => navigation.goBack()}/>

      <View style={s.content}>
        {/* Prompt card */}
        <View style={s.promptCard}>
          <Text style={s.promptText}>How would you like to journal today?</Text>
        </View>

        {/* Guided option */}
        <TouchableOpacity style={s.optionCard} onPress={startGuided} activeOpacity={0.8}>
          <Text style={s.optionTitle}>Guided Journal</Text>
        </TouchableOpacity>

        {/* Free Write option */}
        <TouchableOpacity style={[s.optionCard, s.optionCardAlt]} onPress={startFreeWrite} activeOpacity={0.8}>
          <Text style={s.optionTitle}>Free Write</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const s = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.backgroundLight,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  promptCard: {
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 20,
    marginBottom: 14,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 3,
  },
  promptText: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.text,
    textAlign: 'center',
    lineHeight: 24,
  },
  optionCard: {
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 20,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 3,
  },
  optionCardAlt: {
    borderLeftColor: Colors.primaryMedium,
    backgroundColor: Colors.backgroundLight,
  },
  optionTitle: {fontSize: 16, fontWeight: '700', color: Colors.text, marginBottom: 6},
});

export default JournalTypeSelectScreen;
