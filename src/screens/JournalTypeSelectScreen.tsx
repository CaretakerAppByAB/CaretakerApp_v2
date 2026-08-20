/**
 * JournalTypeSelectScreen.tsx
 * Place at: src/screens/JournalTypeSelectScreen.tsx
 * Header (with back arrow) is handled by JournalNavigator's Stack.
 */

import React from 'react';
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';
import {GUIDED_PROMPTS} from '../services/journalService';

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

      {/* Prompt card */}
      <View style={s.promptCard}>
        <Text style={s.promptText}>How would you like to journal today?</Text>
      </View>

      {/* Guided option */}
      <TouchableOpacity style={s.optionCard} onPress={startGuided} activeOpacity={0.8}>
        <Text style={s.optionTitle}>Guided Journal</Text>
        <Text style={s.optionSub}>Reflect using personalized prompts</Text>
      </TouchableOpacity>

      {/* Free Write option */}
      <TouchableOpacity style={[s.optionCard, s.optionCardAlt]} onPress={startFreeWrite} activeOpacity={0.8}>
        <Text style={s.optionTitle}>Free Write</Text>
        <Text style={s.optionSub}>Explore your thoughts without guidance</Text>
      </TouchableOpacity>

    </View>
  );
};

const s = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F5F3FF',
    padding: 16,
  },
  promptCard: {
    backgroundColor: '#FFFFFF',
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
    color: '#1A1A1A',
    textAlign: 'center',
    lineHeight: 24,
  },
  optionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 20,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#8B7EEE',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 3,
  },
  optionCardAlt: {
    borderLeftColor: '#A18CE6',
    backgroundColor: '#F8F5FF',
  },
  optionTitle: {fontSize: 16, fontWeight: '700', color: '#000000', marginBottom: 6},
  optionSub:   {fontSize: 13, color: '#7E7E7E', lineHeight: 19},
});

export default JournalTypeSelectScreen;
