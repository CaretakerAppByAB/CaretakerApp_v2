/**
 * src/components/PHIWarningBanner.tsx
 *
 * Non-blocking privacy nudge shown while the user writes a journal entry.
 * Appears only when likely PHI is detected. Offers a one-tap redact action.
 */

import React from 'react';
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';
import Svg, {Path, Circle} from 'react-native-svg';
import {PHIMatch, summarisePHI} from '../services/phiDetection';

const ShieldIcon = () => (
  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"
      stroke="#B8860B" strokeWidth={1.8} strokeLinejoin="round"
    />
    <Path d="M12 8v4M12 16h.01" stroke="#B8860B" strokeWidth={1.8} strokeLinecap="round"/>
  </Svg>
);

interface Props {
  matches:  PHIMatch[];
  onRedact: () => void;
  onDismiss: () => void;
}

const PHIWarningBanner: React.FC<Props> = ({matches, onRedact, onDismiss}) => {
  if (matches.length === 0) return null;

  return (
    <View style={s.banner}>
      <View style={s.row}>
        <ShieldIcon/>
        <View style={s.textWrap}>
          <Text style={s.title}>Privacy check</Text>
          <Text style={s.body}>
            Found {summarisePHI(matches)}. Consider using initials instead to
            protect patient privacy.
          </Text>
        </View>
      </View>

      <View style={s.actions}>
        <TouchableOpacity style={s.dismissBtn} onPress={onDismiss} activeOpacity={0.7}>
          <Text style={s.dismissText}>Keep as is</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.redactBtn} onPress={onRedact} activeOpacity={0.8}>
          <Text style={s.redactText}>Use initials</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const s = StyleSheet.create({
  banner: {
    backgroundColor: '#FEF9E7',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F5E1A4',
    padding: 14,
    marginBottom: 12,
  },
  row:      {flexDirection: 'row', gap: 10, marginBottom: 12},
  textWrap: {flex: 1},
  title:    {fontSize: 13, fontWeight: '700', color: '#8A6D0B', marginBottom: 3},
  body:     {fontSize: 12, color: '#8A6D0B', lineHeight: 18},

  actions:     {flexDirection: 'row', gap: 8, justifyContent: 'flex-end'},
  dismissBtn:  {paddingHorizontal: 12, paddingVertical: 7},
  dismissText: {fontSize: 12, color: '#8A6D0B', fontWeight: '600'},
  redactBtn:   {backgroundColor: '#B8860B', borderRadius: 16, paddingHorizontal: 14, paddingVertical: 7},
  redactText:  {fontSize: 12, color: '#FFFFFF', fontWeight: '700'},
});

export default PHIWarningBanner;
