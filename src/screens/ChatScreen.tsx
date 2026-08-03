/**
 * ChatScreen.tsx
 * Place at: src/screens/ChatScreen.tsx
 *
 * Updated: shows ThankYouNoteOverlay when the recipient opens a chat
 * containing an unseen Thank You Note. Overlay is shown exactly once
 * per note (tracked in AsyncStorage).
 */

import React, {useState, useEffect, useRef} from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, SafeAreaView, StatusBar, KeyboardAvoidingView,
  Platform, ActivityIndicator,
} from 'react-native';
import Svg, {Path, Circle} from 'react-native-svg';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useAuth} from '../context/AuthContext';
import {EnvelopeOpenIcon} from '../components/icons/TabIcons';
import ThankYouNoteOverlay from '../components/ThankYouNoteOverlay';
import {
  subscribeToMessages, sendMessage, markConversationRead, Message,
} from '../services/messagingService';

// ── Icons ──────────────────────────────────────────────────────────────────────

const BackArrow = () => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <Path d="M19 12H5M12 19l-7-7 7-7" stroke="#000" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

const InfoIcon = () => (
  <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
    <Circle cx={12} cy={12} r={10} stroke="#555" strokeWidth={1.5}/>
    <Path d="M12 16v-4M12 8h.01" stroke="#555" strokeWidth={1.8} strokeLinecap="round"/>
  </Svg>
);

const SendIcon = ({active}: {active: boolean}) => (
  <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
    <Path
      d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"
      stroke={active ? '#8B7EEE' : '#BBBBBB'}
      strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"
    />
  </Svg>
);

// ── Helpers ────────────────────────────────────────────────────────────────────

const formatTime = (ms: number) =>
  new Date(ms).toLocaleTimeString([], {hour: 'numeric', minute: '2-digit'});

const SEEN_KEY = (noteId: string) => `@alz_note_seen_${noteId}`;

// ── Thank You Note bubble (in the chat thread) ─────────────────────────────────

const ThankYouNoteBubble: React.FC<{msg: Message; isMine: boolean}> = ({msg, isMine}) => (
  <View style={[s.bubbleWrap, isMine ? s.bubbleWrapMine : s.bubbleWrapTheirs]}>
    <View style={s.thankYouCard}>
      <EnvelopeOpenIcon size={52} color="#A18CE6"/>
      <Text style={s.thankYouLabel}>Thank You Note</Text>
      {!!msg.text && (
        <Text style={s.thankYouPreview} numberOfLines={2}>{msg.text}</Text>
      )}
    </View>
    <View style={[s.meta, isMine && s.metaMine]}>
      <Text style={s.metaTime}>{formatTime(msg.createdAt)}</Text>
      {isMine && <Text style={s.checks}>✓✓</Text>}
    </View>
  </View>
);

// ── Main screen ────────────────────────────────────────────────────────────────

interface PendingNote {
  noteId:     string;
  message:    string;
  senderName: string;
}

const ChatScreen: React.FC<{route: any; navigation: any}> = ({route, navigation}) => {
  const {user} = useAuth();
  const {
    conversationId = '',
    name           = 'Chat',
    initials       = '?',
    receiverId     = '',
    online         = false,
  } = route?.params ?? {};

  const [messages,     setMessages]     = useState<Message[]>([]);
  const [inputText,    setInputText]    = useState('');
  const [loading,      setLoading]      = useState(true);
  const [sending,      setSending]      = useState(false);
  const [pendingNote,  setPendingNote]  = useState<PendingNote | null>(null);
  const scrollRef = useRef<ScrollView>(null);

  // Mark conversation as read when opened
  useEffect(() => {
    if (user && conversationId) {
      markConversationRead(conversationId, user.uid).catch(() => {});
    }
  }, [conversationId, user?.uid]);

  // Subscribe to real-time messages
  useEffect(() => {
    if (!conversationId) return;
    const unsub = subscribeToMessages(
      conversationId,
      msgs => { setMessages(msgs); setLoading(false); },
      ()   => { setLoading(false); },
    );
    return unsub;
  }, [conversationId]);

  // Scroll to bottom on new messages
  useEffect(() => {
    const t = setTimeout(() => scrollRef.current?.scrollToEnd({animated: true}), 80);
    return () => clearTimeout(t);
  }, [messages]);

  // Check for an unseen Thank You Note when messages load/change
  useEffect(() => {
    if (!user || messages.length === 0) return;

    // Find the most recent thankYouNote sent by the OTHER person
    const latestNote = [...messages]
      .reverse()
      .find(m => m.messageType === 'thankYouNote' && m.senderId !== user.uid);

    if (!latestNote) return;

    AsyncStorage.getItem(SEEN_KEY(latestNote.id))
      .then(seen => {
        if (!seen) {
          // Small delay so the chat renders first, then overlay appears
          setTimeout(() => {
            setPendingNote({
              noteId:     latestNote.id,
              message:    latestNote.text,
              senderName: latestNote.senderName,
            });
          }, 500);
        }
      })
      .catch(() => {});
    // Only re-run when the message count changes, not on every render
  }, [messages.length, user?.uid]);

  const handleCloseNote = async () => {
    if (pendingNote) {
      await AsyncStorage.setItem(SEEN_KEY(pendingNote.noteId), 'true').catch(() => {});
    }
    setPendingNote(null);
  };

  const handleSend = async () => {
    const text = inputText.trim();
    if (!text || !user || sending) return;
    setSending(true);
    setInputText('');
    try {
      await sendMessage(conversationId, user.uid, user.name, receiverId, text);
    } catch {
      setInputText(text);
    } finally {
      setSending(false);
    }
  };

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff"/>

      {/* ── Animated Thank You Note overlay ── */}
      <ThankYouNoteOverlay
        visible={!!pendingNote}
        message={pendingNote?.message ?? ''}
        senderName={pendingNote?.senderName ?? ''}
        onClose={handleCloseNote}
      />

      {/* ── Header ── */}
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <BackArrow/>
        </TouchableOpacity>
        <View style={s.avatarCircle}>
          <Text style={s.avatarText}>{initials}</Text>
        </View>
        <View style={s.headerInfo}>
          <Text style={s.headerName} numberOfLines={1}>{name}</Text>
          {online && (
            <View style={s.onlineRow}>
              <View style={s.onlineDot}/><Text style={s.onlineText}>Online</Text>
            </View>
          )}
        </View>
        <TouchableOpacity style={s.infoBtn} activeOpacity={0.7}><InfoIcon/></TouchableOpacity>
      </View>
      <View style={s.divider}/>

      {/* ── Messages + input ── */}
      <KeyboardAvoidingView style={s.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          ref={scrollRef}
          style={s.msgList}
          contentContainerStyle={s.msgContent}
          showsVerticalScrollIndicator={false}>

          <View style={s.dateSep}><Text style={s.dateSepText}>Today</Text></View>

          {loading && <ActivityIndicator color="#8B7EEE" style={{marginTop: 20}}/>}

          {!loading && messages.length === 0 && (
            <Text style={s.empty}>Send a message to start the conversation.</Text>
          )}

          {messages.map(msg => {
            const isMine = msg.senderId === user?.uid;

            if (msg.messageType === 'thankYouNote') {
              return <ThankYouNoteBubble key={msg.id} msg={msg} isMine={isMine}/>;
            }

            return (
              <View key={msg.id} style={[s.bubbleWrap, isMine ? s.bubbleWrapMine : s.bubbleWrapTheirs]}>
                <View style={[s.bubble, isMine ? s.bubbleMine : s.bubbleTheirs]}>
                  <Text style={[s.bubbleText, isMine ? s.bubbleTextMine : s.bubbleTextTheirs]}>
                    {msg.text}
                  </Text>
                </View>
                <View style={[s.meta, isMine && s.metaMine]}>
                  <Text style={s.metaTime}>{formatTime(msg.createdAt)}</Text>
                  {isMine && <Text style={s.checks}>✓✓</Text>}
                </View>
              </View>
            );
          })}
        </ScrollView>

        {/* Input bar */}
        <View style={s.inputBar}>
          <TouchableOpacity style={s.addBtn} activeOpacity={0.7}>
            <Text style={s.addBtnText}>+</Text>
          </TouchableOpacity>
          <View style={s.inputPill}>
            <TextInput
              style={s.input}
              placeholder="Type a message..."
              placeholderTextColor="#9E9E9E"
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={1000}
            />
            <TouchableOpacity
              style={s.sendBtn}
              onPress={handleSend}
              activeOpacity={0.7}
              disabled={!inputText.trim() || sending}>
              {sending
                ? <ActivityIndicator size="small" color="#8B7EEE"/>
                : <SendIcon active={!!inputText.trim()}/>
              }
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

// ── Styles ─────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  safe: {flex:1, backgroundColor:'#fff'},
  flex: {flex:1},

  header:        {flexDirection:'row', alignItems:'center', paddingHorizontal:12, paddingVertical:10, backgroundColor:'#fff', gap:10},
  backBtn:       {padding:6},
  avatarCircle:  {width:42, height:42, borderRadius:21, backgroundColor:'#9E9E9E', alignItems:'center', justifyContent:'center'},
  avatarText:    {fontSize:15, fontWeight:'700', color:'#fff'},
  headerInfo:    {flex:1},
  headerName:    {fontSize:15, fontWeight:'700', color:'#000'},
  onlineRow:     {flexDirection:'row', alignItems:'center', gap:5, marginTop:2},
  onlineDot:     {width:8, height:8, borderRadius:4, backgroundColor:'#2ECC71'},
  onlineText:    {fontSize:12, fontWeight:'500', color:'#2ECC71'},
  infoBtn:       {padding:6},
  divider:       {height:StyleSheet.hairlineWidth, backgroundColor:'rgba(0,0,0,0.12)'},

  msgList:    {flex:1, backgroundColor:'#fff'},
  msgContent: {padding:16, paddingBottom:12},
  dateSep:    {alignItems:'center', marginBottom:20},
  dateSepText:{fontSize:12, color:'#9E9E9E', fontWeight:'500'},
  empty:      {textAlign:'center', color:'#BBBBBB', fontSize:14, marginTop:40},

  // Regular bubble
  bubbleWrap:       {marginBottom:14, maxWidth:'72%'},
  bubbleWrapMine:   {alignSelf:'flex-end',  alignItems:'flex-end'},
  bubbleWrapTheirs: {alignSelf:'flex-start', alignItems:'flex-start'},
  bubble:           {paddingHorizontal:14, paddingVertical:10, borderRadius:18},
  bubbleMine:       {backgroundColor:'#000', borderTopRightRadius:4},
  bubbleTheirs:     {backgroundColor:'#E8E8E8', borderTopLeftRadius:4},
  bubbleText:       {fontSize:14, lineHeight:20},
  bubbleTextMine:   {color:'#fff'},
  bubbleTextTheirs: {color:'#000'},

  // Thank You Note card in thread
  thankYouCard: {
    backgroundColor: '#000000',
    borderRadius:    18, borderTopRightRadius:4,
    padding:         20, alignItems:'center', width:190,
  },
  thankYouLabel:   {color:'#FFFFFF', fontSize:14, fontWeight:'700', marginTop:10},
  thankYouPreview: {color:'rgba(255,255,255,0.65)', fontSize:12, marginTop:4, textAlign:'center'},

  meta:     {flexDirection:'row', alignItems:'center', gap:4, marginTop:4, marginHorizontal:2},
  metaMine: {justifyContent:'flex-end'},
  metaTime: {fontSize:11, color:'#9E9E9E'},
  checks:   {fontSize:11, color:'#9E9E9E'},

  inputBar:   {flexDirection:'row', alignItems:'flex-end', paddingHorizontal:12, paddingVertical:10, backgroundColor:'#fff', borderTopWidth:StyleSheet.hairlineWidth, borderTopColor:'rgba(0,0,0,0.1)', gap:10},
  addBtn:     {width:40, height:40, borderRadius:20, backgroundColor:'#E8E8E8', alignItems:'center', justifyContent:'center', marginBottom:2},
  addBtnText: {fontSize:24, fontWeight:'300', color:'#555', lineHeight:28},
  inputPill:  {flex:1, flexDirection:'row', alignItems:'flex-end', backgroundColor:'#F0F0F0', borderRadius:24, paddingHorizontal:14, paddingVertical:8, gap:8, minHeight:44},
  input:      {flex:1, fontSize:14, color:'#000', maxHeight:100, padding:0, lineHeight:20},
  sendBtn:    {marginBottom:2},
});

export default ChatScreen;
