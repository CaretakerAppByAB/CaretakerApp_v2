/**
 * SupportActionScreen.tsx — "Get Support" hub.
 * Three entry points: create a support request, review submitted requests,
 * or browse mental health resources (the existing Resource Library).
 */

import React from 'react';
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';
import ScreenHeader from '../components/ScreenHeader';
import {Colors} from '../theme/colors';

const SupportActionScreen: React.FC<{navigation: any}> = ({navigation}) => {
  const ACTIONS = [
    {
      label: 'Create request',
      onPress: () => navigation.navigate('CreateRequest'),
    },
    {
      label: 'Submitted Requests',
      onPress: () => navigation.navigate('SubmittedRequests'),
    },
    {
      label: 'Mental Health Resources',
      onPress: () => navigation.navigate('ResourceLibrary'),
    },
  ];

  return (
    <View style={s.screen}>
      <ScreenHeader
        title="Support Action"
        subtitle="How can we help you"
        onBack={() => navigation.navigate('Home')}
      />
      <View style={s.body}>
        {ACTIONS.map(action => (
          <TouchableOpacity
            key={action.label}
            style={s.actionBtn}
            onPress={action.onPress}
            activeOpacity={0.8}>
            <Text style={s.actionLabel}>{action.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const s = StyleSheet.create({
  screen: {flex: 1, backgroundColor: Colors.white},
  body:   {flex: 1, paddingHorizontal: 24, paddingTop: 32, gap: 24},
  actionBtn: {
    backgroundColor: Colors.primaryLight,
    borderRadius: 14,
    paddingVertical: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLabel: {fontSize: 17, fontWeight: '700', color: Colors.text},
});

export default SupportActionScreen;
