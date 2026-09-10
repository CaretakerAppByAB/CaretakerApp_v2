/**
 * CommentsModal.tsx — comment thread for a Community post.
 * Comments are public (same as posts), so the same blocking PHI check used
 * for new posts applies here before a comment can be sent.
 */

import React, {useState, useEffect, useMemo} from 'react';
import {
  Modal, View, Text, TextInput, TouchableOpacity, ScrollView, Image,
  StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import Svg, {Path} from 'react-native-svg';
import Avatar from './Avatar';
import PHIWarningBanner from './PHIWarningBanner';
import {Colors} from '../theme/colors';
import {detectPHI, redactPHI} from '../services/phiDetection';
import {subscribeToComments, addComment, Comment} from '../services/communityService';
import {pickImageWithPrompt, uploadImage, PickedImage} from '../services/mediaService';

const CloseIcon = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Path d="M18 6L6 18M6 6l12 12" stroke={Colors.text} strokeWidth={1.8} strokeLinecap="round"/>
  </Svg>
);

const SendIcon = ({active}: {active: boolean}) => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"
      stroke={active ? Colors.primary : '#BBBBBB'} strokeWidth={1.8}
      strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

const timeAgo = (ms: number): string => {
  const diff = Date.now() - ms;
  const mins = Math.floor(diff / 60000);
  const hrs  = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1)  return 'now';
  if (mins < 60) return `${mins}m`;
  if (hrs < 24)  return `${hrs}h`;
  return `${days}d`;
};

interface CommentsModalProps {
  visible:         boolean;
  postId:          string | null;
  authorName:      string;
  authorPhotoURL?: string;
  onClose:         () => void;
}

const CommentsModal: React.FC<CommentsModalProps> = ({visible, postId, authorName, authorPhotoURL, onClose}) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [text,     setText]     = useState('');
  const [sending,  setSending]  = useState(false);
  const [phiDismissed, setPhiDismissed] = useState(false);
  const [image, setImage] = useState<PickedImage | null>(null);

  const phiMatches = useMemo(
    () => (phiDismissed || text.length < 4 ? [] : detectPHI(text)),
    [text, phiDismissed],
  );
  const hasPHI = phiMatches.length > 0;

  useEffect(() => {
    if (!visible || !postId) return;
    setLoading(true);
    setLoadError(null);
    const unsubscribe = subscribeToComments(
      postId,
      cs => { setComments(cs); setLoading(false); },
      err => { setLoadError(err?.message ?? 'Could not load comments.'); setLoading(false); },
    );
    return unsubscribe;
  }, [visible, postId]);

  const close = () => {
    setText('');
    setImage(null);
    setPhiDismissed(false);
    onClose();
  };

  const handleRedact = () => {
    setText(prev => redactPHI(prev));
    setPhiDismissed(true);
  };

  const handleAttachPress = async () => {
    const picked = await pickImageWithPrompt();
    if (picked) setImage(picked);
  };

  const handleSend = async () => {
    if (!postId || (!text.trim() && !image) || sending || hasPHI) return;
    setSending(true);
    try {
      let imageUrl: string | undefined;
      if (image) {
        imageUrl = await uploadImage(image, 'commentImages');
      }
      await addComment(postId, authorName, text.trim(), imageUrl, authorPhotoURL);
      setText('');
      setImage(null);
    } catch (err: any) {
      Alert.alert('Could not send comment', err?.message ?? 'Check your connection and try again.');
    } finally {
      setSending(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={close}>
      <KeyboardAvoidingView
        style={s.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={s.sheet}>
          <View style={s.handle}/>

          <View style={s.headerRow}>
            <Text style={s.title}>Comments</Text>
            <TouchableOpacity onPress={close} hitSlop={8}>
              <CloseIcon/>
            </TouchableOpacity>
          </View>

          <ScrollView style={s.list} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            {loading ? (
              <ActivityIndicator color={Colors.primary} style={{marginTop: 24}}/>
            ) : loadError ? (
              <Text style={[s.empty, {color: Colors.error}]}>{loadError}</Text>
            ) : comments.length === 0 ? (
              <Text style={s.empty}>No comments yet. Be the first to reply!</Text>
            ) : (
              comments.map(c => (
                <View key={c.id} style={s.commentRow}>
                  <Avatar name={c.authorName} size={34} photoURL={c.authorPhotoURL}/>
                  <View style={s.commentBody}>
                    <View style={s.commentBubble}>
                      <Text style={s.commentAuthor}>{c.authorName}</Text>
                      {!!c.content && <Text style={s.commentText}>{c.content}</Text>}
                      {!!c.imageUrl && (
                        <Image source={{uri: c.imageUrl}} style={s.commentImage} resizeMode="cover"/>
                      )}
                    </View>
                    <Text style={s.commentTime}>{timeAgo(c.createdAt)}</Text>
                  </View>
                </View>
              ))
            )}
            <View style={{height: 12}}/>
          </ScrollView>

          {hasPHI && (
            <PHIWarningBanner matches={phiMatches} onRedact={handleRedact} variant="block"/>
          )}

          {image && (
            <View style={s.imagePreviewWrap}>
              <Image source={{uri: image.uri}} style={s.imagePreview} resizeMode="cover"/>
              <TouchableOpacity style={s.removeImageBtn} onPress={() => setImage(null)} activeOpacity={0.8}>
                <Text style={s.removeImageBtnText}>✕</Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={s.inputRow}>
            <TouchableOpacity style={s.attachBtn} onPress={handleAttachPress} activeOpacity={0.7}>
              <Text style={s.attachBtnText}>📷</Text>
            </TouchableOpacity>
            <TextInput
              style={s.input}
              placeholder="Add a comment..."
              placeholderTextColor="#9E9E9E"
              value={text}
              onChangeText={t => { setText(t); if (phiDismissed && t.length < 4) setPhiDismissed(false); }}
              multiline
              maxLength={500}
            />
            <TouchableOpacity
              style={s.sendBtn}
              onPress={handleSend}
              disabled={(!text.trim() && !image) || sending || hasPHI}
              activeOpacity={0.7}>
              {sending
                ? <ActivityIndicator size="small" color={Colors.primary}/>
                : <SendIcon active={(!!text.trim() || !!image) && !hasPHI}/>
              }
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

// ── Styles ─────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  overlay: {flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end'},
  sheet: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 10,
    maxHeight: '80%',
  },
  handle: {width: 40, height: 5, borderRadius: 3, backgroundColor: '#D9D9D9', alignSelf: 'center', marginBottom: 14},
  headerRow: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14},
  title: {fontSize: 17, fontWeight: '700', color: Colors.text},

  list: {flexGrow: 0},
  empty: {textAlign: 'center', color: Colors.textSecondary, fontSize: 13, marginTop: 24, marginBottom: 12},

  commentRow: {flexDirection: 'row', gap: 10, marginBottom: 14},
  commentBody: {flex: 1},
  commentBubble: {backgroundColor: Colors.primaryLight, borderRadius: 14, borderTopLeftRadius: 4, padding: 10},
  commentAuthor: {fontSize: 12, fontWeight: '700', color: Colors.text, marginBottom: 2},
  commentText: {fontSize: 13, color: Colors.text, lineHeight: 18},
  commentImage: {width: '100%', height: 140, borderRadius: 10, marginTop: 6, backgroundColor: '#E0E0E0'},
  commentTime: {fontSize: 10, color: Colors.textSecondary, marginTop: 3, marginLeft: 2},

  imagePreviewWrap: {marginBottom: 10, position: 'relative'},
  imagePreview: {width: '100%', height: 140, borderRadius: 12, backgroundColor: '#E8E8E8'},
  removeImageBtn: {
    position: 'absolute', top: 8, right: 8,
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center',
  },
  removeImageBtnText: {color: Colors.white, fontSize: 13, fontWeight: '700'},

  inputRow: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 10,
    paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#E5E5E5',
    paddingBottom: Platform.OS === 'ios' ? 24 : 12,
  },
  attachBtn: {paddingBottom: 10},
  attachBtnText: {fontSize: 20},
  input: {
    flex: 1, backgroundColor: Colors.primaryLight, borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 10,
    fontSize: 14, color: Colors.text, maxHeight: 100,
  },
  sendBtn: {paddingBottom: 8},
});

export default CommentsModal;
