/**
 * src/screens/ChatScreen.tsx
 *
 * Messages are end-to-end encrypted (see e2eService.ts).
 * A PHI warning appears before sending if identifiers are detected.
 */

import React, {useState, useEffect, useRef, useMemo} from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView, Image,
  StyleSheet, KeyboardAvoidingView,
  Platform, ActivityIndicator, Alert,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import Svg, {Path, Circle} from 'react-native-svg';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useAuth} from '../context/AuthContext';
import {EnvelopeOpenIcon} from '../components/icons/TabIcons';
import ThankYouNoteOverlay from '../components/ThankYouNoteOverlay';
import PHIWarningBanner from '../components/PHIWarningBanner';
import ScreenHeader from '../components/ScreenHeader';
import ChatDetailsModal from '../components/ChatDetailsModal';
import AttachmentSheet from '../components/AttachmentSheet';
import Avatar from '../components/Avatar';
import {Colors} from '../theme/colors';
import {detectPHI, redactPHI} from '../services/phiDetection';
import {uploadImage, PickedImage} from '../services/mediaService';
import {
  subscribeToMessages, sendMessage, markConversationRead, Message,
} from '../services/messagingService';

// ── Icons ──────────────────────────────────────────────────────────────────────

const SendIcon = ({active}: {active: boolean}) => (
  <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
    <Path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"
      stroke={active ? Colors.primary : '#BBBBBB'} strokeWidth={1.8}
      strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

const LockIcon = () => (
  <Svg width={11} height={11} viewBox="0 0 24 24" fill="none">
    <Path d="M19 11H5a2 2 0 00-2 2v7a2 2 0 002 2h14a2 2 0 002-2v-7a2 2 0 00-2-2z" stroke={Colors.textSecondary} strokeWidth={2}/>
    <Path d="M7 11V7a5 5 0 0110 0v4" stroke={Colors.textSecondary} strokeWidth={2} strokeLinecap="round"/>
  </Svg>
);

const InfoIcon = () => (
  <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
    <Circle cx={12} cy={12} r={9} stroke={Colors.primary} strokeWidth={1.6}/>
    <Path d="M12 11v5.5" stroke={Colors.primary} strokeWidth={1.6} strokeLinecap="round"/>
    <Circle cx={12} cy={8} r={1} fill={Colors.primary}/>
  </Svg>
);

const formatTime = (ms: number) =>
  new Date(ms).toLocaleTimeString([], {hour: 'numeric', minute: '2-digit'});

const SEEN_KEY = (noteId: string) => `@alz_note_seen_${noteId}`;

// ── Thank You Note bubble ──────────────────────────────────────────────────────

const ThankYouNoteBubble: React.FC<{msg: Message; isMine: boolean}> = ({msg, isMine}) => (
  <View style={[s.bubbleWrap, isMine ? s.bubbleWrapMine : s.bubbleWrapTheirs]}>
    <View style={s.thankYouCard}>
      <EnvelopeOpenIcon size={52} color={Colors.primaryMedium}/>
      <Text style={s.thankYouLabel}>Thank You Note</Text>
      {!!msg.text && <Text style={s.thankYouPreview} numberOfLines={2}>{msg.text}</Text>}
    </View>
    <View style={[s.meta, isMine && s.metaMine]}>
      <Text style={s.metaTime}>{formatTime(msg.createdAt)}</Text>
      {isMine && <Text style={s.checks}>✓✓</Text>}
    </View>
  </View>
);

// ── Main screen ────────────────────────────────────────────────────────────────

interface PendingNote {noteId: string; message: string; senderName: string}

const ChatScreen: React.FC<{route: any; navigation: any}> = ({route, navigation}) => {
  const {user} = useAuth();
  const {
    conversationId = '', name = 'Chat',
    receiverId = '', online = false, photoURL,
  } = route?.params ?? {};

  const [messages,     setMessages]     = useState<Message[]>([]);
  const [inputText,    setInputText]    = useState('');
  const [loading,      setLoading]      = useState(true);
  const [sending,      setSending]      = useState(false);
  const [pendingNote,  setPendingNote]  = useState<PendingNote | null>(null);
  const [phiDismissed, setPhiDismissed] = useState(false);
  const [showDetails,  setShowDetails]  = useState(false);
  const [showAttach,   setShowAttach]   = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const insets = useSafeAreaInsets();

  // ── PHI detection on the draft message ──────────────────────────────────────
  const phiMatches = useMemo(() => {
    if (phiDismissed || inputText.length < 4) return [];
    return detectPHI(inputText);
  }, [inputText, phiDismissed]);

  const handleRedact = () => {
    setInputText(prev => redactPHI(prev));
    setPhiDismissed(true);
  };

  // ── Mark read ───────────────────────────────────────────────────────────────
  useEffect(() => {
    if (user && conversationId) {
      markConversationRead(conversationId, user.uid).catch(() => {});
    }
  }, [conversationId, user?.uid]);

  // ── Subscribe (decrypts via e2eService) ─────────────────────────────────────
  useEffect(() => {
    if (!conversationId || !user || !receiverId) return;
    const unsub = subscribeToMessages(
      conversationId,
      user.uid,
      receiverId,
      msgs => { setMessages(msgs); setLoading(false); },
      ()   => { setLoading(false); },
    );
    return unsub;
  }, [conversationId, user?.uid, receiverId]);

  useEffect(() => {
    const t = setTimeout(() => scrollRef.current?.scrollToEnd({animated: true}), 80);
    return () => clearTimeout(t);
  }, [messages]);

  // ── Thank You Note overlay ──────────────────────────────────────────────────
  useEffect(() => {
    if (!user || messages.length === 0) return;
    const latestNote = [...messages].reverse()
      .find(m => m.messageType === 'thankYouNote' && m.senderId !== user.uid);
    if (!latestNote) return;

    AsyncStorage.getItem(SEEN_KEY(latestNote.id))
      .then(seen => {
        if (!seen) {
          setTimeout(() => setPendingNote({
            noteId: latestNote.id,
            message: latestNote.text,
            senderName: latestNote.senderName,
          }), 500);
        }
      })
      .catch(() => {});
  }, [messages.length, user?.uid]);

  const handleCloseNote = async () => {
    if (pendingNote) {
      await AsyncStorage.setItem(SEEN_KEY(pendingNote.noteId), 'true').catch(() => {});
    }
    setPendingNote(null);
  };

  // ── Send ────────────────────────────────────────────────────────────────────
  const handleSend = async () => {
    const text = inputText.trim();
    if (!text || !user || sending) return;
    setSending(true);
    setInputText('');
    setPhiDismissed(false);
    try {
      await sendMessage(conversationId, user.uid, user.name, receiverId, text);
    } catch {
      setInputText(text);
    } finally {
      setSending(false);
    }
  };

  // Uploads a picked/captured photo, then sends it as an image message
  const handleSendImage = async (image: PickedImage) => {
    if (!user) return;
    try {
      const url = await uploadImage(image, 'chatImages');
      await sendMessage(conversationId, user.uid, user.name, receiverId, '', 'image', url);
    } catch (err: any) {
      console.error('[ChatScreen] send image failed:', err);
      Alert.alert('Could not send the photo', err?.message ?? 'Check your connection and try again.');
    }
  };

  const handleThankYouNote = () => {
    navigation.navigate('Gratitude', {
      screen: 'ThankYouNote',
      params: {receiverId, receiverName: name},
    });
  };

  return (
    <View style={s.safe}>
      <ThankYouNoteOverlay
        visible={!!pendingNote}
        message={pendingNote?.message ?? ''}
        senderName={pendingNote?.senderName ?? ''}
        onClose={handleCloseNote}
      />

      <ChatDetailsModal
        visible={showDetails}
        name={name}
        online={online}
        onClose={() => setShowDetails(false)}
      />

      <AttachmentSheet
        visible={showAttach}
        onClose={() => setShowAttach(false)}
        onSendImage={handleSendImage}
        onThankYouNote={handleThankYouNote}
      />

      <ScreenHeader
        title={name}
        onBack={() => navigation.goBack()}
        titleSlot={
          <View style={s.headerTitleSlot}>
            <Avatar name={name} size={36} photoURL={photoURL}/>
            <View style={s.headerTitleText}>
              <Text style={s.headerName} numberOfLines={1}>{name}</Text>
              <View style={s.statusRow}>
                <View style={[s.statusDot, online && s.statusDotOnline]}/>
                <Text style={s.statusText}>{online ? 'Online' : 'Offline'}</Text>
              </View>
            </View>
          </View>
        }
        rightElement={
          <TouchableOpacity onPress={() => setShowDetails(true)} hitSlop={8}>
            <InfoIcon/>
          </TouchableOpacity>
        }
      />

      <KeyboardAvoidingView style={s.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          ref={scrollRef}
          style={s.msgList}
          contentContainerStyle={s.msgContent}
          showsVerticalScrollIndicator={false}>

          <View style={s.encBanner}>
            <LockIcon/>
            <Text style={s.encBannerText}>End-to-end encrypted</Text>
          </View>

          <View style={s.dateSep}><Text style={s.dateSepText}>Today</Text></View>

          {loading && <ActivityIndicator color={Colors.primary} style={{marginTop:20}}/>}
          {!loading && messages.length === 0 && (
            <Text style={s.empty}>No messages yet</Text>
          )}

          {messages.map(msg => {
            const isMine = msg.senderId === user?.uid;
            if (msg.messageType === 'thankYouNote') {
              return <ThankYouNoteBubble key={msg.id} msg={msg} isMine={isMine}/>;
            }
            if (msg.messageType === 'image') {
              return (
                <View key={msg.id} style={[s.bubbleWrap, isMine ? s.bubbleWrapMine : s.bubbleWrapTheirs]}>
                  {!!msg.imageUrl && (
                    <Image source={{uri: msg.imageUrl}} style={s.imageBubble} resizeMode="cover"/>
                  )}
                  {!!msg.text && (
                    <View style={[s.bubble, isMine ? s.bubbleMine : s.bubbleTheirs, {marginTop: 4}]}>
                      <Text style={[s.bubbleText, isMine ? s.bubbleTextMine : s.bubbleTextTheirs]}>
                        {msg.text}
                      </Text>
                    </View>
                  )}
                  <View style={[s.meta, isMine && s.metaMine]}>
                    <Text style={s.metaTime}>{formatTime(msg.createdAt)}</Text>
                    {isMine && <Text style={s.checks}>✓✓</Text>}
                  </View>
                </View>
              );
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

        {/* PHI warning above the input */}
        {phiMatches.length > 0 && (
          <View style={{paddingHorizontal: 12}}>
            <PHIWarningBanner
              matches={phiMatches}
              onRedact={handleRedact}
              onDismiss={() => setPhiDismissed(true)}
              variant="warn"
            />
          </View>
        )}

        {/* Input bar */}
        <View style={[s.inputBar, {paddingBottom: 10 + insets.bottom}]}>
          <TouchableOpacity style={s.addBtn} activeOpacity={0.7} onPress={() => setShowAttach(true)}>
            <Text style={s.addBtnText}>+</Text>
          </TouchableOpacity>
          <View style={s.inputPill}>
            <TextInput
              style={s.input}
              placeholder="Type a message..."
              placeholderTextColor="#9E9E9E"
              value={inputText}
              onChangeText={t => {
                setInputText(t);
                if (phiDismissed && t.length < 4) setPhiDismissed(false);
              }}
              multiline
              maxLength={1000}
            />
            <TouchableOpacity
              style={s.sendBtn}
              onPress={handleSend}
              activeOpacity={0.7}
              disabled={!inputText.trim() || sending}>
              {sending
                ? <ActivityIndicator size="small" color={Colors.primary}/>
                : <SendIcon active={!!inputText.trim()}/>
              }
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};

// ── Styles ─────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  safe: {flex:1, backgroundColor: Colors.white},
  flex: {flex:1},

  headerTitleSlot: {flexDirection:'row', alignItems:'center', gap:8},
  headerTitleText: {},
  headerName:      {fontSize:15, fontWeight:'700', color: Colors.text},
  statusRow:       {flexDirection:'row', alignItems:'center', gap:5, marginTop:2},
  statusDot:       {width:6, height:6, borderRadius:3, backgroundColor:'#BBBBBB'},
  statusDotOnline: {backgroundColor: Colors.success},
  statusText:      {fontSize:11, color: Colors.textSecondary, fontWeight:'500'},

  msgList:    {flex:1, backgroundColor: Colors.white},
  msgContent: {padding:16, paddingBottom:12},
  encBanner: {
    flexDirection:'row', alignItems:'center', justifyContent:'center', gap:6,
    backgroundColor: Colors.primaryLight, borderRadius:10,
    paddingVertical:8, paddingHorizontal:14, marginBottom:16,
  },
  encBannerText: {fontSize:11, color: Colors.textSecondary, fontWeight:'600', textAlign:'center', flexShrink:1},
  dateSep:    {alignItems:'center', marginBottom:20},
  dateSepText:{fontSize:12, color:'#9E9E9E', fontWeight:'500'},
  empty:      {textAlign:'center', color:'#BBBBBB', fontSize:14, marginTop:40},

  bubbleWrap:       {marginBottom:14, maxWidth:'72%'},
  bubbleWrapMine:   {alignSelf:'flex-end',  alignItems:'flex-end'},
  bubbleWrapTheirs: {alignSelf:'flex-start', alignItems:'flex-start'},
  bubble:           {paddingHorizontal:14, paddingVertical:10, borderRadius:18},
  bubbleMine:       {backgroundColor:'#000', borderTopRightRadius:4},
  bubbleTheirs:     {backgroundColor:'#E8E8E8', borderTopLeftRadius:4},
  bubbleText:       {fontSize:14, lineHeight:20},
  bubbleTextMine:   {color: Colors.white},
  bubbleTextTheirs: {color: Colors.text},
  imageBubble:      {width: 200, height: 200, borderRadius: 16, backgroundColor: '#E8E8E8'},

  thankYouCard:    {backgroundColor:'#000', borderRadius:18, borderTopRightRadius:4, padding:20, alignItems:'center', width:190},
  thankYouLabel:   {color: Colors.white, fontSize:14, fontWeight:'700', marginTop:10},
  thankYouPreview: {color:'rgba(255,255,255,0.65)', fontSize:12, marginTop:4, textAlign:'center'},

  meta:     {flexDirection:'row', alignItems:'center', gap:4, marginTop:4, marginHorizontal:2},
  metaMine: {justifyContent:'flex-end'},
  metaTime: {fontSize:11, color:'#9E9E9E'},
  checks:   {fontSize:11, color:'#9E9E9E'},

  inputBar:   {flexDirection:'row', alignItems:'flex-end', paddingHorizontal:12, paddingVertical:10, backgroundColor: Colors.white, borderTopWidth:StyleSheet.hairlineWidth, borderTopColor:'rgba(0,0,0,0.1)', gap:10},
  addBtn:     {width:40, height:40, borderRadius:20, backgroundColor:'#E8E8E8', alignItems:'center', justifyContent:'center', marginBottom:2},
  addBtnText: {fontSize:24, fontWeight:'300', color:'#555', lineHeight:28},
  inputPill:  {flex:1, flexDirection:'row', alignItems:'flex-end', backgroundColor:'#F0F0F0', borderRadius:24, paddingHorizontal:14, paddingVertical:8, gap:8, minHeight:44},
  input:      {flex:1, fontSize:14, color: Colors.text, maxHeight:100, padding:0, lineHeight:20},
  sendBtn:    {marginBottom:2},
});

export default ChatScreen;
