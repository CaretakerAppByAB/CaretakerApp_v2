/**
 * AttachmentSheet.tsx — "Add to Message" bottom sheet for the chat composer.
 * Exactly three options: Photo, Take Photo (both send an image via
 * onSendImage), and Thank You Note (hands off to the gratitude-note composer).
 */

import React, {useState} from 'react';
import {Modal, View, Text, TouchableOpacity, StyleSheet, Alert, Pressable, ActivityIndicator} from 'react-native';
import Svg, {Path, Circle, Rect} from 'react-native-svg';
import {EnvelopeOpenIcon} from './icons/TabIcons';
import {Colors} from '../theme/colors';
import {pickImageFromLibrary, pickImageFromCamera, PickedImage} from '../services/mediaService';

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

// ── Component ──────────────────────────────────────────────────────────────────

interface AttachmentSheetProps {
  visible: boolean;
  onClose: () => void;
  onSendImage: (image: PickedImage) => void;
  onThankYouNote: () => void;
}

const AttachmentSheet: React.FC<AttachmentSheetProps> = ({visible, onClose, onSendImage, onThankYouNote}) => {
  const [picking, setPicking] = useState<'Photo' | 'Take Photo' | null>(null);

  const handlePickPhoto = (label: 'Photo' | 'Take Photo', pick: () => Promise<PickedImage | null>) => async () => {
    setPicking(label);
    try {
      const image = await pick();
      if (image) {
        onClose();
        onSendImage(image);
      }
    } catch (err: any) {
      Alert.alert('Error', err?.message ?? 'Could not open the photo picker.');
    } finally {
      setPicking(null);
    }
  };

  const OPTIONS = [
    {label: 'Photo' as const,          Icon: ImageIcon,        onPress: handlePickPhoto('Photo', pickImageFromLibrary)},
    {label: 'Take Photo' as const,      Icon: CameraIcon,       onPress: handlePickPhoto('Take Photo', pickImageFromCamera)},
    {label: 'Thank You Note',          Icon: EnvelopeOpenIcon, onPress: () => { onClose(); onThankYouNote(); }},
  ];

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={s.backdrop} onPress={onClose}/>
      <View style={s.sheet}>
        <View style={s.handle}/>

        <View style={s.headerRow}>
          <View style={s.headerSide}/>
          <Text style={s.title}>Add to Message</Text>
          <TouchableOpacity style={s.headerSide} onPress={onClose} hitSlop={8}>
            <CloseIcon/>
          </TouchableOpacity>
        </View>

        <View style={s.grid}>
          {OPTIONS.map(({label, Icon, onPress}) => (
            <TouchableOpacity key={label} style={s.tile} onPress={onPress} activeOpacity={0.75} disabled={!!picking}>
              {picking === label
                ? <ActivityIndicator color={Colors.text}/>
                : <Icon color={Colors.text} size={24}/>
              }
              <Text style={s.tileLabel}>{label}</Text>
            </TouchableOpacity>
          ))}
        </View>
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
});

export default AttachmentSheet;
