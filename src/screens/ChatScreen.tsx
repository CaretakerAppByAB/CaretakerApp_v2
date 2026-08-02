/**
 * ChatScreen.tsx — Full chat thread implementation
 * Place at: src/screens/ChatScreen.tsx
 *
 * Receives from navigation.navigate('Chat', params):
 *   conversationId: string
 *   name:           string  (display name)
 *   initials:       string  (2-char avatar text)
 *   online:         boolean
 *   isSupport:      boolean (purple avatar for support accounts)
 *
 * DATA NOTE:
 * Messages use local state seeded with mock data per conversationId.
 * Sent messages are appended to state only — they reset on reload.
 * To persist: replace INITIAL_MESSAGES lookup with a Firestore
 * real-time listener (onSnapshot) and replace handleSend with
 * addDoc(collection(db, 'conversations', conversationId, 'messages'), ...).
 */

import React, {useState, useRef, useEffect} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
} from 'react-native';
import Svg, {Path, Circle} from 'react-native-svg';

const {width: SW} = Dimensions.get('window');

// ── Types ──────────────────────────────────────────────────────────────────────

interface Message {
  id:        string;
  text:      string;
  sent:      boolean;   // true = current user, false = other person
  time:      string;
  delivered: boolean;   // shows ✓✓ on sent messages
}

// ── Mock conversation history per conversation ID ──────────────────────────────

const INITIAL_MESSAGES: Record<string, Message[]> = {
  '1': [
    {id: 'm1', text: 'Good morning! How are you feeling today?',             sent: false, time: '9:30 AM', delivered: false},
    {id: 'm2', text: "I'm doing well. I enjoyed our activity yesterday.",     sent: true,  time: '9:32 AM', delivered: true},
    {id: 'm3', text: "That's great to hear! I'm glad you thought it was fun.",sent: false, time: '9:33 AM', delivered: false},
    {id: 'm4', text: 'Thanks for always being there!',                        sent: true,  time: '9:34 AM', delivered: true},
    {id: 'm5', text: 'I really enjoyed our walk today!',                      sent: false, time: '10:32 AM',delivered: false},
  ],
  '2': [
    {id: 'm1', text: 'Hey! Are you free to talk this week?',                  sent: true,  time: 'Yesterday', delivered: true},
    {id: 'm2', text: 'Would Thursday afternoon work?',                         sent: false, time: 'Yesterday', delivered: false},
  ],
  '3': [
    {id: 'm1', text: 'Just wanted to check in on you. How are you holding up?',sent: true, time: 'Monday', delivered: true},
    {id: 'm2', text: 'Thanks for checking in with me.',                         sent: false,time: 'Monday', delivered: false},
  ],
  '4': [
    {id: 'm1', text: "Welcome to Alzheimer's Buddies Support! We're here for you 24/7.", sent: false, time: 'Last week', delivered: false},
    {id: 'm2', text: 'Your weekly check-in is ready. Tap here to get started.',           sent: false, time: 'Friday',    delivered: false},
  ],
  '5': [
    {id: 'm1', text: 'Did you attend the support group meeting last week?',    sent: true,  time: 'Last week', delivered: true},
    {id: 'm2', text: 'The support group was really helpful.',                  sent: false, time: 'Last week', delivered: false},
  ],
};

// ── Icons ──────────────────────────────────────────────────────────────────────

const BackArrow = () => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <Path
      d="M19 12H5M12 19l-7-7 7-7"
      stroke="#000000"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const InfoIcon = () => (
  <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
    <Circle cx={12} cy={12} r={10} stroke="#555555" strokeWidth={1.5}/>
    <Path
      d="M12 16v-4M12 8h.01"
      stroke="#555555"
      strokeWidth={1.8}
      strokeLinecap="round"
    />
  </Svg>
);

const SendIcon = ({active}: {active: boolean}) => (
  <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
    <Path
      d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"
      stroke={active ? '#8B7EEE' : '#BBBBBB'}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

// ── Sub-components ─────────────────────────────────────────────────────────────

const HeaderAvatar: React.FC<{initials: string; isSupport: boolean}> = ({initials, isSupport}) => (
  <View style={[s.headerAvatar, isSupport && s.headerAvatarSupport]}>
    <Text style={s.headerAvatarText}>{initials}</Text>
  </View>
);

const MessageBubble: React.FC<{msg: Message}> = ({msg}) => (
  <View style={[s.bubbleWrapper, msg.sent ? s.bubbleWrapperSent : s.bubbleWrapperReceived]}>
    <View style={[s.bubble, msg.sent ? s.bubbleSent : s.bubbleReceived]}>
      <Text style={[s.bubbleText, msg.sent ? s.bubbleTextSent : s.bubbleTextReceived]}>
        {msg.text}
      </Text>
    </View>
    <View style={[s.metaRow, msg.sent && s.metaRowSent]}>
      <Text style={s.metaTime}>{msg.time}</Text>
      {msg.sent && (
        <Text style={s.checks}>{msg.delivered ? '✓✓' : '✓'}</Text>
      )}
    </View>
  </View>
);

// ── Main screen ────────────────────────────────────────────────────────────────

const ChatScreen: React.FC<{route: any; navigation: any}> = ({route, navigation}) => {
  const {
    conversationId = '1',
    name           = 'Chat',
    initials       = 'U',
    online         = false,
    isSupport      = false,
  } = route?.params ?? {};

  const [messages,   setMessages]   = useState<Message[]>(INITIAL_MESSAGES[conversationId] ?? []);
  const [inputText,  setInputText]  = useState('');
  const scrollRef = useRef<ScrollView>(null);

  // Scroll to bottom on mount and on every new message
  const scrollToEnd = (animated = true) => {
    setTimeout(() => scrollRef.current?.scrollToEnd({animated}), 80);
  };
  useEffect(() => scrollToEnd(false), []);        // initial load — no animation
  useEffect(() => scrollToEnd(true),  [messages]); // each new message — animate

  const handleSend = () => {
    const text = inputText.trim();
    if (!text) return;
    const now  = new Date();
    const time = now.toLocaleTimeString('en-US', {hour: 'numeric', minute: '2-digit'});
    setMessages(prev => [
      ...prev,
      {id: `msg_${Date.now()}`, text, sent: true, time, delivered: true},
    ]);
    setInputText('');
  };

  return (
    <SafeAreaView style={s.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF"/>

      {/* ── Header ── */}
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <BackArrow/>
        </TouchableOpacity>

        <HeaderAvatar initials={initials} isSupport={isSupport}/>

        <View style={s.headerInfo}>
          <Text style={s.headerName} numberOfLines={1}>{name}</Text>
          {online && (
            <View style={s.onlineRow}>
              <View style={s.onlineDot}/>
              <Text style={s.onlineText}>Online</Text>
            </View>
          )}
        </View>

        <TouchableOpacity style={s.infoBtn} activeOpacity={0.7}>
          <InfoIcon/>
        </TouchableOpacity>
      </View>

      <View style={s.headerDivider}/>

      {/* ── Messages + input (pushed up by keyboard on iOS) ── */}
      <KeyboardAvoidingView
        style={s.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}>

        {/* Message list */}
        <ScrollView
          ref={scrollRef}
          style={s.messageList}
          contentContainerStyle={s.messageListContent}
          showsVerticalScrollIndicator={false}>

          {/* Date separator */}
          <View style={s.dateSep}>
            <Text style={s.dateSepText}>Today</Text>
          </View>

          {messages.length === 0 && (
            <Text style={s.emptyState}>Say hello! Start the conversation.</Text>
          )}

          {messages.map(msg => (
            <MessageBubble key={msg.id} msg={msg}/>
          ))}
        </ScrollView>

        {/* Input bar */}
        <View style={s.inputBar}>
          {/* + attachment button */}
          <TouchableOpacity style={s.addBtn} activeOpacity={0.7}>
            <Text style={s.addBtnText}>+</Text>
          </TouchableOpacity>

          {/* Text input + send */}
          <View style={s.inputPill}>
            <TextInput
              style={s.input}
              placeholder="Type a message..."
              placeholderTextColor="#9E9E9E"
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={500}
            />
            <TouchableOpacity
              style={s.sendBtn}
              onPress={handleSend}
              activeOpacity={0.7}
              disabled={!inputText.trim()}>
              <SendIcon active={!!inputText.trim()}/>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

// ── Styles ─────────────────────────────────────────────────────────────────────

const MAX_BUBBLE = SW * 0.72;

const s = StyleSheet.create({
  safeArea:  {flex: 1, backgroundColor: '#FFFFFF'},
  flex:      {flex: 1},

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    gap: 10,
  },
  backBtn:    {padding: 6},
  headerAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#9E9E9E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerAvatarSupport: {backgroundColor: '#8B7EEE'},
  headerAvatarText:    {fontSize: 15, fontWeight: '700', color: '#FFFFFF'},
  headerInfo:  {flex: 1},
  headerName:  {fontSize: 15, fontWeight: '700', color: '#000000'},
  onlineRow:   {flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2},
  onlineDot:   {width: 8, height: 8, borderRadius: 4, backgroundColor: '#2ECC71'},
  onlineText:  {fontSize: 12, fontWeight: '500', color: '#2ECC71'},
  infoBtn:     {padding: 6},
  headerDivider: {height: StyleSheet.hairlineWidth, backgroundColor: 'rgba(0,0,0,0.12)'},

  // Message list
  messageList:        {flex: 1, backgroundColor: '#FFFFFF'},
  messageListContent: {padding: 16, paddingBottom: 12},

  // Date separator
  dateSep:     {alignItems: 'center', marginBottom: 20},
  dateSepText: {fontSize: 12, color: '#9E9E9E', fontWeight: '500'},

  // Empty state
  emptyState: {
    textAlign: 'center',
    color: '#BBBBBB',
    fontSize: 14,
    marginTop: 40,
  },

  // Bubble wrapper
  bubbleWrapper:          {marginBottom: 14, maxWidth: MAX_BUBBLE},
  bubbleWrapperSent:      {alignSelf: 'flex-end',   alignItems: 'flex-end'},
  bubbleWrapperReceived:  {alignSelf: 'flex-start',  alignItems: 'flex-start'},

  // Bubble
  bubble:              {paddingHorizontal: 14, paddingVertical: 10, borderRadius: 18},
  bubbleSent:          {backgroundColor: '#000000', borderTopRightRadius: 4},
  bubbleReceived:      {backgroundColor: '#E8E8E8', borderTopLeftRadius: 4},
  bubbleText:          {fontSize: 14, lineHeight: 20},
  bubbleTextSent:      {color: '#FFFFFF'},
  bubbleTextReceived:  {color: '#000000'},

  // Timestamp + checks
  metaRow:    {flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4, marginHorizontal: 2},
  metaRowSent:{justifyContent: 'flex-end'},
  metaTime:   {fontSize: 11, color: '#9E9E9E'},
  checks:     {fontSize: 11, color: '#9E9E9E'},

  // Input bar
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(0,0,0,0.1)',
    gap: 10,
  },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E8E8E8',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  addBtnText: {fontSize: 24, fontWeight: '300', color: '#555555', lineHeight: 28},
  inputPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#F0F0F0',
    borderRadius: 24,
    paddingHorizontal: 14,
    paddingVertical: 8,
    gap: 8,
    minHeight: 44,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: '#000000',
    maxHeight: 100,
    padding: 0,
    lineHeight: 20,
  },
  sendBtn: {marginBottom: 2},
});

export default ChatScreen;
