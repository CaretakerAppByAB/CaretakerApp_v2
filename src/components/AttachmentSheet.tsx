/**
 * AttachmentSheet.tsx — "Add to Message" bottom sheet for the chat composer.
 *
 * Photo / Take Photo / Voice Note need a native module (image picker, camera,
 * audio recorder) that isn't installed in this project yet, so they surface a
 * "coming soon" alert for now. Activity Invite and Emoji are implemented for
 * real since they only need the existing text-message pipeline. Thank You Note
 * hands off to the existing gratitude-note composer.
 */

import React, {useState} from 'react';
import {Modal, View, Text, TouchableOpacity, TextInput, StyleSheet, Alert, Pressable} from 'react-native';
import Svg, {Path, Circle, Rect} from 'react-native-svg';
import {CalendarIcon, EnvelopeOpenIcon} from './icons/TabIcons';
import {Colors} from '../theme/colors';

// ── Icons ──────────────────────────────────────────────────────────────────────

const CloseIcon = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Path d="M18 6L6 18M6 6l12 12" stroke={Colors.text} strokeWidth={1.8} strokeLinecap="round"/>
  </Svg>
);

const ImageIcon = () => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <Rect x={3} y={3} width={18} height={18} rx={2} stroke={Colors.text} strokeWidth={1.8}/>
    <Circle cx={8.5} cy={8.5} r={1.5} stroke={Colors.text} strokeWidth={1.8}/>
    <Path d="M21 15l-5-5L5 21" stroke={Colors.text} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

const CameraIcon = () => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <Path d="M4 7h3l1.5-2h7L17 7h3a1 1 0 011 1v11a1 1 0 01-1 1H4a1 1 0 01-1-1V8a1 1 0 011-1z" stroke={Colors.text} strokeWidth={1.8} strokeLinejoin="round"/>
    <Circle cx={12} cy={13} r={3.5} stroke={Colors.text} strokeWidth={1.8}/>
  </Svg>
);

const MicIcon = () => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <Rect x={9} y={2} width={6} height={12} rx={3} stroke={Colors.text} strokeWidth={1.8}/>
    <Path d="M5 11a7 7 0 0014 0M12 18v3" stroke={Colors.text} strokeWidth={1.8} strokeLinecap="round"/>
  </Svg>
);

const SmileyIcon = () => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <Circle cx={12} cy={12} r={9} stroke={Colors.text} strokeWidth={1.8}/>
    <Circle cx={9} cy={10} r={1} fill={Colors.text}/>
    <Circle cx={15} cy={10} r={1} fill={Colors.text}/>
    <Path d="M8 14.5s1.5 2 4 2 4-2 4-2" stroke={Colors.text} strokeWidth={1.8} strokeLinecap="round"/>
  </Svg>
);

const BackIcon = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Path d="M15 18l-6-6 6-6" stroke={Colors.text} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

const EMOJIS = ['😀','😂','🥰','😊','😍','🤗','👍','🙏','❤️','🎉','😢','😴'];

// ── Component ──────────────────────────────────────────────────────────────────

type Panel = 'grid' | 'activity' | 'emoji';

interface AttachmentSheetProps {
  visible: boolean;
  onClose: () => void;
  onSendText: (text: string) => void;
  onThankYouNote: () => void;
}

const comingSoon = (feature: string) =>
  Alert.alert('Coming soon', `${feature} will be available in a future update.`);

const AttachmentSheet: React.FC<AttachmentSheetProps> = ({visible, onClose, onSendText, onThankYouNote}) => {
  const [panel, setPanel] = useState<Panel>('grid');
  const [activityText, setActivityText] = useState('');

  const close = () => {
    setPanel('grid');
    setActivityText('');
    onClose();
  };

  const handleSendActivity = () => {
    if (!activityText.trim()) return;
    onSendText(`📅 Activity Invite: ${activityText.trim()}`);
    close();
  };

  const handlePickEmoji = (emoji: string) => {
    onSendText(emoji);
    close();
  };

  const OPTIONS = [
    {label: 'Photo',          Icon: ImageIcon,  onPress: () => comingSoon('Photo attachments')},
    {label: 'Take Photo',     Icon: CameraIcon, onPress: () => comingSoon('Camera attachments')},
    {label: 'Voice Note',     Icon: MicIcon,    onPress: () => comingSoon('Voice notes')},
    {label: 'Activity Invite',Icon: CalendarIcon, onPress: () => setPanel('activity')},
    {label: 'Emoji',          Icon: SmileyIcon, onPress: () => setPanel('emoji')},
    {label: 'Thank You Note', Icon: EnvelopeOpenIcon, onPress: () => { close(); onThankYouNote(); }},
  ];

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={close}>
      <Pressable style={s.backdrop} onPress={close}/>
      <View style={s.sheet}>
        <View style={s.handle}/>

        <View style={s.headerRow}>
          {panel === 'grid' ? (
            <View style={s.headerSide}/>
          ) : (
            <TouchableOpacity style={s.headerSide} onPress={() => setPanel('grid')} hitSlop={8}>
              <BackIcon/>
            </TouchableOpacity>
          )}
          <Text style={s.title}>
            {panel === 'grid' ? 'Add to Message' : panel === 'activity' ? 'Activity Invite' : 'Choose an Emoji'}
          </Text>
          <TouchableOpacity style={s.headerSide} onPress={close} hitSlop={8}>
            <CloseIcon/>
          </TouchableOpacity>
        </View>

        {panel === 'grid' && (
          <View style={s.grid}>
            {OPTIONS.map(({label, Icon, onPress}) => (
              <TouchableOpacity key={label} style={s.tile} onPress={onPress} activeOpacity={0.75}>
                <Icon color={Colors.text} size={24}/>
                <Text style={s.tileLabel}>{label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {panel === 'activity' && (
          <View style={s.activityPanel}>
            <TextInput
              style={s.activityInput}
              placeholder="e.g. Walk in the park at 3pm?"
              placeholderTextColor="#9E9E9E"
              value={activityText}
              onChangeText={setActivityText}
              autoFocus
              multiline
            />
            <TouchableOpacity
              style={[s.sendBtn, !activityText.trim() && s.sendBtnDisabled]}
              onPress={handleSendActivity}
              disabled={!activityText.trim()}
              activeOpacity={0.85}>
              <Text style={s.sendBtnText}>Send Invite</Text>
            </TouchableOpacity>
          </View>
        )}

        {panel === 'emoji' && (
          <View style={s.emojiGrid}>
            {EMOJIS.map(e => (
              <TouchableOpacity key={e} style={s.emojiTile} onPress={() => handlePickEmoji(e)} activeOpacity={0.7}>
                <Text style={s.emojiText}>{e}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    </Modal>
  );
};

// ── Styles ─────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  backdrop: {flex: 1, backgroundColor: 'rgba(0,0,0,0.4)'},
  sheet: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 34,
  },
  handle: {width: 40, height: 5, borderRadius: 3, backgroundColor: '#D9D9D9', alignSelf: 'center', marginBottom: 14},

  headerRow: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20},
  headerSide: {width: 24, alignItems: 'flex-start'},
  title: {fontSize: 18, fontWeight: '700', color: Colors.text},

  grid: {flexDirection: 'row', flexWrap: 'wrap', gap: 12},
  tile: {
    width: '30.5%',
    backgroundColor: Colors.primaryLight,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    gap: 8,
  },
  tileLabel: {fontSize: 11, fontWeight: '600', color: Colors.text, textAlign: 'center'},

  activityPanel: {gap: 14},
  activityInput: {
    backgroundColor: Colors.primaryLight,
    borderRadius: 12,
    padding: 14,
    fontSize: 14,
    color: Colors.text,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  sendBtn: {backgroundColor: Colors.primary, borderRadius: 12, paddingVertical: 14, alignItems: 'center'},
  sendBtnDisabled: {opacity: 0.5},
  sendBtnText: {color: Colors.white, fontSize: 15, fontWeight: '700'},

  emojiGrid: {flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center'},
  emojiTile: {
    width: 56, height: 56, borderRadius: 12,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center', justifyContent: 'center',
  },
  emojiText: {fontSize: 26},
});

export default AttachmentSheet;
