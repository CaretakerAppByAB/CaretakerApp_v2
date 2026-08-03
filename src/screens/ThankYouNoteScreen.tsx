/**
 * ThankYouNoteScreen.tsx
 * Place at: src/screens/ThankYouNoteScreen.tsx
 *
 * Compose a handwritten-style gratitude card and send it to
 * the recipient's Private Messages inbox as a special Thank You Note bubble.
 */

import React, {useState} from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, SafeAreaView, StatusBar, KeyboardAvoidingView,
  Platform, ActivityIndicator, Alert, Dimensions,
} from 'react-native';
import Svg, {Path} from 'react-native-svg';
import {EnvelopeOpenIcon} from '../components/icons/TabIcons';
import {useAuth} from '../context/AuthContext';
import {getOrCreateConversation, sendMessage} from '../services/messagingService';

const {width: SW} = Dimensions.get('window');

// ── Icons ──────────────────────────────────────────────────────────────────────

const BackArrow = () => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <Path d="M19 12H5M12 19l-7-7 7-7" stroke="#000" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

// EnvelopeOpenIcon is imported from '../components/icons/TabIcons' above

// ── Helpers ────────────────────────────────────────────────────────────────────

const getInitials = (name: string) =>
  name.split(' ').map(w => w[0] ?? '').join('').slice(0, 2).toUpperCase() || '?';

// ── Main screen ────────────────────────────────────────────────────────────────

const ThankYouNoteScreen: React.FC<{route: any; navigation: any}> = ({route, navigation}) => {
  const {user} = useAuth();
  const {
    receiverId     = '',
    receiverName   = 'Friend',
    receiverHandle = '',
  } = route?.params ?? {};

  const firstName = receiverName.split(' ')[0];

  const QUICK_MESSAGES = [
    `You are so amazing...`,
    `Hi ${firstName}, thank you for all of your support...`,
    `Hi ${firstName}, you have helped me in so many ways...`,
  ];

  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sent,    setSent]    = useState(false);

  const handleSend = async () => {
    if (!message.trim() || !user) return;
    setSending(true);
    try {
      const receiverProfile = {uid: receiverId, name: receiverName, handle: receiverHandle};
      const convId = await getOrCreateConversation(user, receiverProfile);
      await sendMessage(convId, user.uid, user.name, receiverId, message.trim(), 'thankYouNote');
      setSent(true);
    } catch (err: any) {
      Alert.alert('Error', 'Could not send. Check your connection and try again.');
    } finally {
      setSending(false);
    }
  };

  // ── Success state ────────────────────────────────────────────────────────────

  if (sent) {
    return (
      <SafeAreaView style={[s.safe, {justifyContent: 'center', alignItems: 'center', padding: 32}]}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff"/>
        <View style={s.successIcon}>
          <EnvelopeOpenIcon size={52} color="#8B7EEE"/>
        </View>
        <Text style={s.successTitle}>Note Delivered! 💜</Text>
        <Text style={s.successSub}>
          Your gratitude has been sent to{'\n'}
          <Text style={{fontWeight: '700'}}>{receiverName}</Text>.
        </Text>
        <TouchableOpacity
          style={s.successBtn}
          onPress={() => navigation.navigate('Messages')}
          activeOpacity={0.85}>
          <Text style={s.successBtnText}>Go to Messages</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={s.successSecondary}
          onPress={() => navigation.goBack()}>
          <Text style={s.successSecondaryText}>Send another</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // ── Compose state ────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff"/>

      {/* Header — matches ChatScreen style */}
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <BackArrow/>
        </TouchableOpacity>
        <View style={s.headerAvatar}>
          <Text style={s.headerAvatarText}>{getInitials(receiverName)}</Text>
        </View>
        <Text style={s.headerName} numberOfLines={1}>{receiverName}</Text>
      </View>
      <View style={s.headerDivider}/>

      <KeyboardAvoidingView style={s.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          style={s.scroll}
          contentContainerStyle={s.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">

          {/* Date */}
          <Text style={s.dateSep}>Today</Text>

          {/* Letter card + side options */}
          <View style={s.cardRow}>

            {/* Letter card */}
            <View style={s.letterCard}>
              <TextInput
                style={s.letterInput}
                placeholder="Write your message..."
                placeholderTextColor="#BBBBBB"
                value={message}
                onChangeText={setMessage}
                multiline
                maxLength={600}
                textAlignVertical="top"
              />
              {/* Lined paper effect */}
              {[0,1,2].map(i => <View key={i} style={s.paperLine}/>)}
              {/* Envelope watermark */}
              <View style={s.watermark}>
                <EnvelopeOpenIcon size={56} color="#8B7EEE"/>
              </View>
            </View>

            {/* Side options */}
            <View style={s.sidePanel}>
              {['Add\nImage', 'Add\nGIF', 'Add\nMusic', 'More card\ndesigns'].map(label => (
                <TouchableOpacity
                  key={label}
                  style={s.sideOption}
                  activeOpacity={0.7}
                  onPress={() => Alert.alert('Coming soon', 'This feature is on the way!')}>
                  <Text style={s.sideOptionText}>{label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Quick message suggestions */}
          <View style={s.quickSection}>
            {QUICK_MESSAGES.map((qm, i) => (
              <TouchableOpacity
                key={i}
                style={s.quickPill}
                onPress={() => setMessage(qm.replace('...', ''))}
                activeOpacity={0.8}>
                <Text style={s.quickPillText} numberOfLines={1}>{qm}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={{height: 16}}/>
        </ScrollView>

        {/* SEND button */}
        <View style={s.sendWrap}>
          <TouchableOpacity
            style={[s.sendBtn, (!message.trim() || sending) && s.sendBtnDisabled]}
            onPress={handleSend}
            disabled={!message.trim() || sending}
            activeOpacity={0.85}>
            {sending ? (
              <ActivityIndicator color="#fff"/>
            ) : (
              <Text style={s.sendBtnText}>SEND  ✈</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

// ── Styles ─────────────────────────────────────────────────────────────────────

const SIDE_W      = 112;
const CARD_W      = SW - 32 - 10 - SIDE_W; // 16px padding each side, 10px gap

const s = StyleSheet.create({
  safe:  {flex: 1, backgroundColor: '#FFFFFF'},
  flex:  {flex: 1},

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    gap: 10,
  },
  backBtn:          {padding: 6},
  headerAvatar:     {width: 40, height: 40, borderRadius: 20, backgroundColor: '#9E9E9E', alignItems: 'center', justifyContent: 'center'},
  headerAvatarText: {fontSize: 14, fontWeight: '700', color: '#fff'},
  headerName:       {flex: 1, fontSize: 15, fontWeight: '700', color: '#000'},
  headerDivider:    {height: StyleSheet.hairlineWidth, backgroundColor: 'rgba(0,0,0,0.12)'},

  // Scroll
  scroll:        {flex: 1},
  scrollContent: {paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8},

  dateSep: {textAlign: 'center', fontSize: 12, color: '#9E9E9E', marginBottom: 14},

  // Card + side panel row
  cardRow: {flexDirection: 'row', gap: 10, marginBottom: 14},

  // Letter card (paper effect)
  letterCard: {
    width:           CARD_W,
    minHeight:       230,
    backgroundColor: '#EBEBEB',
    borderRadius:    12,
    padding:         14,
    overflow:        'hidden',
  },
  letterInput: {
    fontSize:   14,
    color:      '#000',
    lineHeight: 22,
    minHeight:  120,
    padding:    0,
    zIndex:     2,
  },
  paperLine: {
    height:           1,
    backgroundColor:  '#CCCCCC',
    marginVertical:   10,
  },
  watermark: {
    position:  'absolute',
    bottom:    10,
    left:      10,
    opacity:   0.14,
  },

  // Side options panel
  sidePanel: {gap: 8, width: SIDE_W},
  sideOption: {
    flex:            0,
    backgroundColor: '#DCDCDC',
    borderRadius:    10,
    paddingVertical:  12,
    paddingHorizontal: 8,
    alignItems:      'center',
    justifyContent:  'center',
    minHeight:       50,
  },
  sideOptionText: {
    fontSize:   11,
    color:      '#555',
    textAlign:  'center',
    lineHeight: 15,
  },

  // Quick messages
  quickSection: {gap: 8, marginBottom: 4},
  quickPill: {
    backgroundColor: '#000000',
    borderRadius:    28,
    paddingVertical:   12,
    paddingHorizontal: 18,
  },
  quickPillText: {color: '#FFFFFF', fontSize: 13, fontWeight: '500'},

  // Send button
  sendWrap: {paddingHorizontal: 16, paddingBottom: Platform.OS === 'ios' ? 16 : 12, paddingTop: 8, backgroundColor: '#fff'},
  sendBtn: {
    backgroundColor: '#8B7EEE',
    borderRadius:     14,
    paddingVertical:  16,
    alignItems:      'center',
  },
  sendBtnDisabled: {opacity: 0.45},
  sendBtnText:     {color: '#fff', fontSize: 17, fontWeight: '800', letterSpacing: 1.5},

  // Success
  successIcon:      {width: 88, height: 88, borderRadius: 44, backgroundColor: '#F0EEFF', alignItems: 'center', justifyContent: 'center', marginBottom: 20},
  successTitle:     {fontSize: 24, fontWeight: '800', color: '#8B7EEE', marginBottom: 10},
  successSub:       {fontSize: 15, color: '#555', textAlign: 'center', lineHeight: 22, marginBottom: 32},
  successBtn:       {backgroundColor: '#8B7EEE', borderRadius: 14, paddingVertical: 14, paddingHorizontal: 40, marginBottom: 14},
  successBtnText:   {color: '#fff', fontSize: 15, fontWeight: '700'},
  successSecondary: {paddingVertical: 8},
  successSecondaryText: {color: '#8B7EEE', fontSize: 14, fontWeight: '600'},
});

export default ThankYouNoteScreen;
