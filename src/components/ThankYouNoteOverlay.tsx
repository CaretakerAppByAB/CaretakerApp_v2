/**
 * ThankYouNoteOverlay.tsx
 * Place at: src/components/ThankYouNoteOverlay.tsx
 *
 * Full-screen animated overlay that plays when a recipient opens a chat
 * containing an unseen Thank You Note.
 *
 * Animation sequence:
 *  0ms    — dark backdrop fades in, card springs up
 *  550ms  — envelope shakes (there's something inside!)
 *  950ms  — message content slides up and fades in
 *  1200ms — hearts float upward continuously
 */

import React, {useEffect, useRef} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  Modal,
  Platform,
} from 'react-native';
import Svg, {Path} from 'react-native-svg';
import {EnvelopeOpenIcon} from './icons/TabIcons';
import {Colors} from '../theme/colors';

const {width: SW, height: SH} = Dimensions.get('window');

// ── SVG helpers ────────────────────────────────────────────────────────────────

const HeartIcon = ({size = 20, color = Colors.primary}: {size?: number; color?: string}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
    <Path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
  </Svg>
);

// ── Floating heart ─────────────────────────────────────────────────────────────

const FloatingHeart: React.FC<{
  startDelay: number;
  xOffset:    number;
  size:       number;
  color:      string;
}> = ({startDelay, xOffset, size, color}) => {
  const y       = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const scale   = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const t = setTimeout(() => {
      Animated.parallel([
        // Rise up
        Animated.timing(y, {toValue: -260, duration: 2400, useNativeDriver: true}),
        // Pop in, linger, fade out
        Animated.sequence([
          Animated.timing(opacity, {toValue: 1,   duration: 280, useNativeDriver: true}),
          Animated.delay(1500),
          Animated.timing(opacity, {toValue: 0,   duration: 620, useNativeDriver: true}),
        ]),
        // Grow a little as it rises
        Animated.timing(scale,   {toValue: 1.3, duration: 2400, useNativeDriver: true}),
      ]).start();
    }, startDelay);
    return () => clearTimeout(t);
  }, []);

  return (
    <Animated.View
      style={{
        position:  'absolute',
        bottom:    '30%',
        left:      SW / 2 + xOffset,
        opacity,
        transform: [{translateY: y}, {scale}],
        zIndex:    999,
      }}>
      <HeartIcon size={size} color={color}/>
    </Animated.View>
  );
};

// ── Main overlay ───────────────────────────────────────────────────────────────

interface Props {
  visible:    boolean;
  message:    string;
  senderName: string;
  onClose:    () => void;
}

// Heart config — stable (not re-randomised on re-render)
// Colors drawn from the brand purple palette (Colors.primary / primaryMedium / primaryDark)
// instead of one-off magenta/violet shades, so the hearts stay varied but on-brand.
const HEARTS = [
  {delay: 0,    x: -80,  size: 18, color: Colors.primary},
  {delay: 180,  x:  40,  size: 24, color: Colors.primary},
  {delay: 340,  x: -30,  size: 14, color: Colors.primaryDark},
  {delay: 500,  x:  70,  size: 20, color: Colors.primaryMedium},
  {delay: 660,  x: -60,  size: 16, color: Colors.primary},
  {delay: 820,  x:  10,  size: 22, color: Colors.primary},
  {delay: 980,  x: -90,  size: 12, color: Colors.primaryDark},
];

const ThankYouNoteOverlay: React.FC<Props> = ({visible, message, senderName, onClose}) => {
  // ── Animation values ────────────────────────────────────────────────────────
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const cardScale       = useRef(new Animated.Value(0.65)).current;
  const cardOpacity     = useRef(new Animated.Value(0)).current;
  const cardY           = useRef(new Animated.Value(40)).current;
  const shakeX          = useRef(new Animated.Value(0)).current;
  const contentOpacity  = useRef(new Animated.Value(0)).current;
  const contentY        = useRef(new Animated.Value(22)).current;
  const btnOpacity      = useRef(new Animated.Value(0)).current;
  const envelopeScale   = useRef(new Animated.Value(1)).current;

  // Reset & replay when overlay becomes visible
  useEffect(() => {
    if (!visible) return;

    // Reset
    [backdropOpacity, cardScale, cardOpacity, cardY, shakeX,
     contentOpacity, contentY, btnOpacity, envelopeScale].forEach(v => v.setValue(
      v === cardScale ? 0.65 : v === cardY || v === contentY ? (v === cardY ? 40 : 22) : 0
    ));

    const timers: ReturnType<typeof setTimeout>[] = [];

    // ── Phase 1: backdrop + card entrance (0ms) ────────────────────────────────
    Animated.parallel([
      Animated.timing(backdropOpacity, {toValue: 1,   duration: 380, useNativeDriver: true}),
      Animated.spring(cardScale,       {toValue: 1,   tension: 70, friction: 7, useNativeDriver: true}),
      Animated.timing(cardOpacity,     {toValue: 1,   duration: 320, useNativeDriver: true}),
      Animated.spring(cardY,           {toValue: 0,   tension: 65, friction: 8, useNativeDriver: true}),
    ]).start();

    // ── Phase 2: envelope shake (550ms) ───────────────────────────────────────
    timers.push(setTimeout(() => {
      Animated.sequence([
        Animated.timing(envelopeScale, {toValue: 1.12, duration: 140, useNativeDriver: true}),
        Animated.timing(shakeX,        {toValue:  10,  duration: 70,  useNativeDriver: true}),
        Animated.timing(shakeX,        {toValue: -10,  duration: 70,  useNativeDriver: true}),
        Animated.timing(shakeX,        {toValue:   7,  duration: 70,  useNativeDriver: true}),
        Animated.timing(shakeX,        {toValue:  -7,  duration: 70,  useNativeDriver: true}),
        Animated.timing(shakeX,        {toValue:   0,  duration: 70,  useNativeDriver: true}),
        Animated.timing(envelopeScale, {toValue: 1,    duration: 180, useNativeDriver: true}),
      ]).start();
    }, 550));

    // ── Phase 3: message content slides up (950ms) ────────────────────────────
    timers.push(setTimeout(() => {
      Animated.parallel([
        Animated.timing(contentOpacity, {toValue: 1, duration: 480, useNativeDriver: true}),
        Animated.spring(contentY,       {toValue: 0, tension: 60, friction: 8, useNativeDriver: true}),
      ]).start();
    }, 950));

    // ── Phase 4: button fades in (1350ms) ─────────────────────────────────────
    timers.push(setTimeout(() => {
      Animated.timing(btnOpacity, {toValue: 1, duration: 400, useNativeDriver: true}).start();
    }, 1350));

    return () => timers.forEach(clearTimeout);
  }, [visible]);

  // Helpers
  const getInitials = (name: string) =>
    name.split(' ').map(w => w[0] ?? '').join('').slice(0, 2).toUpperCase() || '?';

  const firstName = senderName.split(' ')[0] || senderName;

  return (
    <Modal visible={visible} transparent statusBarTranslucent animationType="none">
      {/* Floating hearts — rendered behind the card in z-order but above backdrop */}
      {HEARTS.map((h, i) => (
        <FloatingHeart key={i} startDelay={1200 + h.delay} xOffset={h.x} size={h.size} color={h.color}/>
      ))}

      {/* Backdrop */}
      <Animated.View style={[s.backdrop, {opacity: backdropOpacity}]}/>

      {/* Card */}
      <View style={s.centreWrap} pointerEvents="box-none">
        <Animated.View style={[
          s.card,
          {
            opacity:   cardOpacity,
            transform: [{scale: cardScale}, {translateY: cardY}],
          },
        ]}>
          {/* ── Purple header ────────────────────────────────────────────────── */}
          <View style={s.cardHeader}>
            {/* Stars */}
            <Text style={s.starsTop}>✨ ✨</Text>

            {/* Envelope */}
            <Animated.View style={[
              s.envelopeWrap,
              {transform: [{translateX: shakeX}, {scale: envelopeScale}]},
            ]}>
              <EnvelopeOpenIcon size={72} color="rgba(255,255,255,0.92)"/>
            </Animated.View>

            <Text style={s.headerSub}>You received a</Text>
            <Text style={s.headerTitle}>Thank You Note 💜</Text>
          </View>

          {/* ── Message content ───────────────────────────────────────────────── */}
          <Animated.View style={[
            s.content,
            {opacity: contentOpacity, transform: [{translateY: contentY}]},
          ]}>
            {/* From row */}
            <View style={s.fromRow}>
              <View style={s.fromAvatar}>
                <Text style={s.fromAvatarText}>{getInitials(senderName)}</Text>
              </View>
              <View>
                <Text style={s.fromLabel}>From</Text>
                <Text style={s.fromName}>{senderName}</Text>
              </View>
            </View>

            {/* Divider */}
            <View style={s.divider}/>

            {/* The message */}
            <View style={s.messageBox}>
              <Text style={s.messageText}>{message}</Text>
            </View>
          </Animated.View>

          {/* ── Dismiss button ────────────────────────────────────────────────── */}
          <Animated.View style={{opacity: btnOpacity, paddingHorizontal: 20, paddingBottom: 20}}>
            <TouchableOpacity style={s.closeBtn} onPress={onClose} activeOpacity={0.85}>
              <Text style={s.closeBtnText}>Thank you, {firstName}! 💜</Text>
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>
      </View>
    </Modal>
  );
};

// ── Styles ─────────────────────────────────────────────────────────────────────

const CARD_W = Math.min(SW - 40, 360);

const s = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.78)',
  },
  centreWrap: {
    flex: 1,
    alignItems:     'center',
    justifyContent: 'center',
  },
  card: {
    width:           CARD_W,
    backgroundColor: Colors.white,
    borderRadius:    24,
    overflow:        'hidden',
    shadowColor:     '#000',
    shadowOffset:    {width: 0, height: 12},
    shadowOpacity:   0.35,
    shadowRadius:    24,
    elevation:       20,
  },

  // Header
  cardHeader: {
    backgroundColor: Colors.primary,
    paddingTop:      20,
    paddingBottom:   24,
    alignItems:      'center',
  },
  starsTop:    {fontSize: 18, letterSpacing: 8, marginBottom: 8, opacity: 0.8},
  envelopeWrap:{marginBottom: 12},
  headerSub:   {fontSize: 13, color: Colors.overlayLight, marginBottom: 4},
  headerTitle: {fontSize: 22, fontWeight: '800', color: Colors.white, letterSpacing: -0.3},

  // Content
  content: {
    paddingHorizontal: 20,
    paddingTop:        18,
    paddingBottom:     4,
  },
  fromRow:       {flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14},
  fromAvatar:    {width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center'},
  fromAvatarText:{fontSize: 16, fontWeight: '700', color: Colors.white},
  fromLabel:     {fontSize: 11, color: '#9E9E9E', fontWeight: '500'},
  fromName:      {fontSize: 15, fontWeight: '700', color: Colors.text},
  divider:       {height: StyleSheet.hairlineWidth, backgroundColor: '#E8E8E8', marginBottom: 14},
  messageBox: {
    backgroundColor: Colors.primaryLight,
    borderRadius:    12,
    padding:         14,
    marginBottom:    16,
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary,
  },
  messageText: {fontSize: 15, color: Colors.text, lineHeight: 24, fontStyle: 'italic'},

  // Button
  closeBtn: {
    backgroundColor: Colors.primary,
    borderRadius:    14,
    paddingVertical: 14,
    alignItems:      'center',
  },
  closeBtnText: {fontSize: 15, fontWeight: '700', color: Colors.white},
});

export default ThankYouNoteOverlay;
