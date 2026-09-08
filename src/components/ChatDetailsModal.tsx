/**
 * ChatDetailsModal.tsx — "info" panel for a 1:1 chat.
 * Lets the user view the other person's profile and adjust conversation
 * settings (mute, search, clear, archive, delete). Backend support for the
 * settings actions doesn't exist yet, so they surface a "coming soon" alert —
 * same pattern used elsewhere in the app (e.g. social login on the login screen).
 */

import React, {useState} from 'react';
import {Modal, View, Text, TouchableOpacity, StyleSheet, Alert} from 'react-native';
import Svg, {Path, Circle, Rect} from 'react-native-svg';
import Avatar from './Avatar';
import {Colors} from '../theme/colors';

// ── Icons ──────────────────────────────────────────────────────────────────────

const CloseIcon = () => (
  <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
    <Path d="M18 6L6 18M6 6l12 12" stroke={Colors.text} strokeWidth={1.8} strokeLinecap="round"/>
  </Svg>
);

const BellIcon = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Path d="M18 8a6 6 0 00-12 0c0 7-3 9-3 9h18s-3-2-3-9" stroke={Colors.text} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"/>
    <Path d="M13.73 21a2 2 0 01-3.46 0" stroke={Colors.text} strokeWidth={1.8} strokeLinecap="round"/>
  </Svg>
);

const PersonIcon = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" stroke={Colors.text} strokeWidth={1.8} strokeLinecap="round"/>
    <Circle cx={12} cy={7} r={4} stroke={Colors.text} strokeWidth={1.8}/>
  </Svg>
);

const ImageIcon = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Rect x={3} y={3} width={18} height={18} rx={2} stroke={Colors.text} strokeWidth={1.8}/>
    <Circle cx={8.5} cy={8.5} r={1.5} stroke={Colors.text} strokeWidth={1.8}/>
    <Path d="M21 15l-5-5L5 21" stroke={Colors.text} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

const SearchIcon = () => (
  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
    <Circle cx={11} cy={11} r={8} stroke={Colors.text} strokeWidth={1.8}/>
    <Path d="M21 21l-4.35-4.35" stroke={Colors.text} strokeWidth={1.8} strokeLinecap="round"/>
  </Svg>
);

const TrashIcon = ({color = Colors.text}: {color?: string}) => (
  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
    <Path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0l-1 14a2 2 0 01-2 2H7a2 2 0 01-2-2L4 6h16z"
      stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

const ArchiveIcon = () => (
  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
    <Rect x={3} y={4} width={18} height={4} rx={1} stroke={Colors.text} strokeWidth={1.8}/>
    <Path d="M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8M10 13h4" stroke={Colors.text} strokeWidth={1.8} strokeLinecap="round"/>
  </Svg>
);

const ChevronRight = () => (
  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
    <Path d="M9 18l6-6-6-6" stroke="#999999" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

// ── Component ──────────────────────────────────────────────────────────────────

interface ChatDetailsModalProps {
  visible: boolean;
  name: string;
  online: boolean;
  onClose: () => void;
}

const comingSoon = (feature: string) =>
  Alert.alert('Coming soon', `${feature} will be available in a future update.`);

const ChatDetailsModal: React.FC<ChatDetailsModalProps> = ({visible, name, online, onClose}) => {
  const [muted, setMuted] = useState(false);

  const handleClearChat = () => {
    Alert.alert(
      'Clear Chat',
      `This will remove all messages with ${name} from your device. This can't be undone.`,
      [{text: 'Cancel', style: 'cancel'}, {text: 'Clear', style: 'destructive', onPress: () => comingSoon('Clearing chats')}],
    );
  };

  const handleDeleteChat = () => {
    Alert.alert(
      'Delete Chat',
      `Delete your entire conversation with ${name}? This can't be undone.`,
      [{text: 'Cancel', style: 'cancel'}, {text: 'Delete', style: 'destructive', onPress: () => comingSoon('Deleting chats')}],
    );
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={s.screen}>
        <TouchableOpacity style={s.closeBtn} onPress={onClose} hitSlop={12}>
          <CloseIcon/>
        </TouchableOpacity>

        <View style={s.profileBlock}>
          <Avatar name={name} size={96}/>
          <Text style={s.name}>{name}</Text>
          <Text style={s.status}>{online ? 'Online today' : 'Offline'}</Text>
        </View>

        <View style={s.actionRow}>
          <TouchableOpacity
            style={s.actionTile}
            onPress={() => setMuted(m => !m)}
            activeOpacity={0.75}>
            <BellIcon/>
            <Text style={s.actionLabel}>{muted ? 'Unmute' : 'Mute'}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={s.actionTile}
            onPress={() => comingSoon('Viewing profiles')}
            activeOpacity={0.75}>
            <PersonIcon/>
            <Text style={s.actionLabel}>View Profile</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={s.actionTile}
            onPress={() => comingSoon('Shared media')}
            activeOpacity={0.75}>
            <ImageIcon/>
            <Text style={s.actionLabel}>Shared Media</Text>
          </TouchableOpacity>
        </View>

        <View style={s.listCard}>
          <TouchableOpacity style={s.listRow} onPress={() => comingSoon('Search in chat')} activeOpacity={0.7}>
            <SearchIcon/>
            <Text style={s.listLabel}>Search in Chat</Text>
            <ChevronRight/>
          </TouchableOpacity>
          <View style={s.listDivider}/>

          <TouchableOpacity style={s.listRow} onPress={handleClearChat} activeOpacity={0.7}>
            <TrashIcon/>
            <Text style={s.listLabel}>Clear Chat</Text>
            <ChevronRight/>
          </TouchableOpacity>
          <View style={s.listDivider}/>

          <TouchableOpacity style={s.listRow} onPress={() => comingSoon('Archiving chats')} activeOpacity={0.7}>
            <ArchiveIcon/>
            <Text style={s.listLabel}>Archive Chat</Text>
            <ChevronRight/>
          </TouchableOpacity>
          <View style={s.listDivider}/>

          <TouchableOpacity style={s.listRow} onPress={handleDeleteChat} activeOpacity={0.7}>
            <TrashIcon color={Colors.error}/>
            <Text style={[s.listLabel, {color: Colors.error}]}>Delete Chat</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

// ── Styles ─────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  screen: {flex: 1, backgroundColor: Colors.white, paddingTop: 56, paddingHorizontal: 20},
  closeBtn: {position: 'absolute', top: 56, right: 20, zIndex: 1, padding: 4},

  profileBlock: {alignItems: 'center', marginTop: 12, marginBottom: 28},
  name:   {fontSize: 20, fontWeight: '700', color: Colors.text, marginTop: 14},
  status: {fontSize: 13, fontWeight: '400', color: Colors.textSecondary, marginTop: 2},

  actionRow: {flexDirection: 'row', gap: 12, marginBottom: 28},
  actionTile: {
    flex: 1,
    backgroundColor: Colors.primaryLight,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    gap: 8,
  },
  actionLabel: {fontSize: 12, fontWeight: '600', color: Colors.text, textAlign: 'center'},

  listCard: {
    backgroundColor: Colors.white,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#DDDDDD',
    overflow: 'hidden',
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 15,
    gap: 12,
  },
  listLabel: {flex: 1, fontSize: 14, fontWeight: '500', color: Colors.text},
  listDivider: {height: StyleSheet.hairlineWidth, backgroundColor: '#E5E5E5', marginLeft: 48},
});

export default ChatDetailsModal;
