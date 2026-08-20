/**
 * src/components/PHIWarningBanner.tsx
 *
 * Privacy nudge shown when likely PHI is detected in user input.
 *
 * Two modes:
 *   variant="warn"  — advisory. Offers redaction, allows the user to proceed.
 *                     Used for private, encrypted contexts (journal, chat).
 *   variant="block" — must be resolved before sending. Used for the PUBLIC
 *                     community forum, where content cannot be encrypted and
 *                     is visible to every user.
 */

import React from 'react';
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';
import Svg, {Path} from 'react-native-svg';
import {PHIMatch, summarisePHI} from '../services/phiDetection';

const ShieldIcon: React.FC<{color: string}> = ({color}) => (
  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"
      stroke={color} strokeWidth={1.8} strokeLinejoin="round"
    />
    <Path d="M12 8v4M12 16h.01" stroke={color} strokeWidth={1.8} strokeLinecap="round"/>
  </Svg>
);

interface Props {
  matches:   PHIMatch[];
  onRedact:  () => void;
  onDismiss?: () => void;
  variant?:  'warn' | 'block';
}

const PHIWarningBanner: React.FC<Props> = ({
  matches, onRedact, onDismiss, variant = 'warn',
}) => {
  if (matches.length === 0) return null;

  const isBlock = variant === 'block';
  const theme   = isBlock ? blockTheme : warnTheme;

  return (
    <View style={[s.banner, {backgroundColor: theme.bg, borderColor: theme.border}]}>
      <View style={s.row}>
        <ShieldIcon color={theme.accent}/>
        <View style={s.textWrap}>
          <Text style={[s.title, {color: theme.text}]}>
            {isBlock ? 'Cannot post — private info detected' : 'Privacy check'}
          </Text>
          <Text style={[s.body, {color: theme.text}]}>
            {isBlock
              ? `Found ${summarisePHI(matches)}. Community posts are public to all users and cannot be encrypted. Please remove identifying details before posting.`
              : `Found ${summarisePHI(matches)}. Consider using initials to protect patient privacy.`}
          </Text>
        </View>
      </View>

      <View style={s.actions}>
        {!isBlock && onDismiss && (
          <TouchableOpacity style={s.dismissBtn} onPress={onDismiss} activeOpacity={0.7}>
            <Text style={[s.dismissText, {color: theme.text}]}>Keep as is</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[s.redactBtn, {backgroundColor: theme.accent}]}
          onPress={onRedact}
          activeOpacity={0.8}>
          <Text style={s.redactText}>
            {isBlock ? 'Remove identifiers' : 'Use initials'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const warnTheme  = {bg: '#FEF9E7', border: '#F5E1A4', accent: '#B8860B', text: '#8A6D0B'};
const blockTheme = {bg: '#FDECEC', border: '#F5B7B7', accent: '#C0392B', text: '#A93226'};

const s = StyleSheet.create({
  banner:   {borderRadius: 12, borderWidth: 1, padding: 14, marginBottom: 12},
  row:      {flexDirection: 'row', gap: 10, marginBottom: 12},
  textWrap: {flex: 1},
  title:    {fontSize: 13, fontWeight: '700', marginBottom: 3},
  body:     {fontSize: 12, lineHeight: 18},

  actions:     {flexDirection: 'row', gap: 8, justifyContent: 'flex-end'},
  dismissBtn:  {paddingHorizontal: 12, paddingVertical: 7},
  dismissText: {fontSize: 12, fontWeight: '600'},
  redactBtn:   {borderRadius: 16, paddingHorizontal: 14, paddingVertical: 7},
  redactText:  {fontSize: 12, color: '#FFFFFF', fontWeight: '700'},
});

export default PHIWarningBanner;
