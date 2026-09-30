/**
 * ThankYouNoteScreen.tsx
 * Place at: src/screens/ThankYouNoteScreen.tsx
 *
 * Compose a handwritten-style gratitude card and send it to
 * the recipient's Private Messages inbox as a special Thank You Note bubble.
 */

import React, {useState, useMemo} from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, SafeAreaView, StatusBar, KeyboardAvoidingView,
  Platform, ActivityIndicator, Alert, Dimensions,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {EnvelopeOpenIcon} from '../components/icons/TabIcons';
import {useAuth} from '../context/AuthContext';
import {getOrCreateConversation, sendMessage} from '../services/messagingService';
import {detectPHI, redactPHI} from '../services/phiDetection';
import PHIWarningBanner from '../components/PHIWarningBanner';
import ScreenHeader from '../components/ScreenHeader';
import Avatar from '../components/Avatar';
import {Colors} from '../theme/colors';

const {width: SW} = Dimensions.get('window');

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
  const [phiDismissed, setPhiDismissed] = useState(false);
  const insets = useSafeAreaInsets();

  // PHI detection on the note text
  const phiMatches = useMemo(() => {
    if (phiDismissed || message.length < 4) return [];
    return detectPHI(message);
  }, [message, phiDismissed]);

  const handleRedact = () => {
    setMessage(prev => redactPHI(prev));
    setPhiDismissed(true);
  };
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
        <StatusBar barStyle="dark-content" backgroundColor={Colors.white}/>
        <View style={s.successIcon}>
          <EnvelopeOpenIcon size={52} color={Colors.primary}/>
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
    <View style={s.safe}>
      <ScreenHeader
        title={receiverName}
        onBack={() => navigation.goBack()}
        titleSlot={
          <View style={s.headerTitleSlot}>
            <Avatar name={receiverName} size={36}/>
            <Text style={s.headerName} numberOfLines={1}>{receiverName}</Text>
          </View>
        }
      />

      <KeyboardAvoidingView style={s.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          style={s.scroll}
          contentContainerStyle={s.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">

          {/* Date */}
          <Text style={s.dateSep}>Today</Text>

          {/* PHI privacy nudge */}
          <PHIWarningBanner
            matches={phiMatches}
            onRedact={handleRedact}
            onDismiss={() => setPhiDismissed(true)}
            variant="warn"
          />

          {/* Encryption notice */}
          <Text style={s.encNotice}>
            🔒 End-to-end encrypted
          </Text>

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
                <EnvelopeOpenIcon size={56} color={Colors.primary}/>
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
        <View style={[s.sendWrap, {paddingBottom: (Platform.OS === 'ios' ? 16 : 12) + insets.bottom}]}>
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
    </View>
  );
};

// ── Styles ─────────────────────────────────────────────────────────────────────

const SIDE_W      = 112;
const CARD_W      = SW - 32 - 10 - SIDE_W; // 16px padding each side, 10px gap

const s = StyleSheet.create({
  safe:  {flex: 1, backgroundColor: Colors.white},
  flex:  {flex: 1},

  // Header (titleSlot content — sits on the white ScreenHeader bar)
  headerTitleSlot: {flexDirection: 'row', alignItems: 'center', gap: 8},
  headerName:      {fontSize: 15, fontWeight: '700', color: Colors.text},

  // Scroll
  scroll:        {flex: 1},
  scrollContent: {paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8},

  dateSep: {textAlign: 'center', fontSize: 12, color: '#9E9E9E', marginBottom: 14},
  encNotice: {textAlign: 'center', fontSize: 11, color: Colors.primary, fontWeight: '600', marginBottom: 12},

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
    color:      Colors.text,
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
  quickPillText: {color: Colors.white, fontSize: 13, fontWeight: '500'},

  // Send button
  sendWrap: {paddingHorizontal: 16, paddingBottom: Platform.OS === 'ios' ? 16 : 12, paddingTop: 8, backgroundColor: Colors.white},
  sendBtn: {
    backgroundColor: Colors.primary,
    borderRadius:     14,
    paddingVertical:  16,
    alignItems:      'center',
  },
  sendBtnDisabled: {opacity: 0.45},
  sendBtnText:     {color: Colors.white, fontSize: 17, fontWeight: '800', letterSpacing: 1.5},

  // Success
  successIcon:      {width: 88, height: 88, borderRadius: 44, backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center', marginBottom: 20},
  successTitle:     {fontSize: 24, fontWeight: '800', color: Colors.primary, marginBottom: 10},
  successSub:       {fontSize: 15, color: '#555', textAlign: 'center', lineHeight: 22, marginBottom: 32},
  successBtn:       {backgroundColor: Colors.primary, borderRadius: 14, paddingVertical: 14, paddingHorizontal: 40, marginBottom: 14},
  successBtnText:   {color: Colors.white, fontSize: 15, fontWeight: '700'},
  successSecondary: {paddingVertical: 8},
  successSecondaryText: {color: Colors.primary, fontSize: 14, fontWeight: '600'},
});

export default ThankYouNoteScreen;
