/**
 * src/screens/JournalEntryScreen.tsx
 *
 * Content is encrypted before saving (see journalService -> cryptoService).
 * A non-blocking PHI warning appears if likely identifiers are detected.
 */

import React, {useState, useCallback, useMemo} from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, KeyboardAvoidingView, Platform,
  ActivityIndicator, Alert,
} from 'react-native';
import Svg, {Path} from 'react-native-svg';
import {useAuth} from '../context/AuthContext';
import {
  createEntry, updateEntry, deleteEntry,
  GUIDED_PROMPTS, JournalEntry,
} from '../services/journalService';
import {detectPHI, redactPHI} from '../services/phiDetection';
import PHIWarningBanner from '../components/PHIWarningBanner';
import ScreenHeader from '../components/ScreenHeader';
import {Colors} from '../theme/colors';

// ── Icons ──────────────────────────────────────────────────────────────────────

const RefreshIcon = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Path d="M1 4v6h6M23 20v-6h-6" stroke={Colors.primary} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
    <Path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10M23 14l-4.64 4.36A9 9 0 0 1 3.51 15"
      stroke={Colors.primary} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

const LockIcon = () => (
  <Svg width={12} height={12} viewBox="0 0 24 24" fill="none">
    <Path d="M19 11H5a2 2 0 00-2 2v7a2 2 0 002 2h14a2 2 0 002-2v-7a2 2 0 00-2-2z" stroke={Colors.primary} strokeWidth={2}/>
    <Path d="M7 11V7a5 5 0 0110 0v4" stroke={Colors.primary} strokeWidth={2} strokeLinecap="round"/>
  </Svg>
);

// ── Main screen ────────────────────────────────────────────────────────────────

const JournalEntryScreen: React.FC<{route: any; navigation: any}> = ({route, navigation}) => {
  const {user} = useAuth();

  const existingEntry: JournalEntry | undefined = route?.params?.entry;
  const isViewing = !!existingEntry;

  const initialType   = existingEntry?.type   ?? route?.params?.type   ?? 'freeWrite';
  const initialPrompt = existingEntry?.prompt ?? route?.params?.prompt ?? '';

  const [content,      setContent]      = useState(existingEntry?.content ?? '');
  const [prompt,       setPrompt]       = useState(initialPrompt);
  const [promptIdx,    setPromptIdx]    = useState(0);
  const [saving,       setSaving]       = useState(false);
  const [saved,        setSaved]        = useState(isViewing);
  const [phiDismissed, setPhiDismissed] = useState(false);

  // ── PHI detection (debounced by only running on content change) ─────────────

  const phiMatches = useMemo(() => {
    if (phiDismissed || content.length < 4) return [];
    return detectPHI(content);
  }, [content, phiDismissed]);

  const handleRedact = () => {
    setContent(prev => redactPHI(prev));
    setPhiDismissed(true);
    setSaved(false);
  };

  // ── Save ────────────────────────────────────────────────────────────────────

  const handleSave = useCallback(async () => {
    if (!user || !content.trim()) {
      Alert.alert('Empty entry', 'Please write something before saving.');
      return;
    }
    setSaving(true);
    try {
      if (existingEntry) {
        await updateEntry(user.uid, existingEntry.id, content);
      } else {
        await createEntry(user.uid, initialType, prompt, content);
      }
      setSaved(true);
      setTimeout(() => navigation.goBack(), 500);
    } catch (err: any) {
      console.error('Journal save error:', err?.code, err?.message);
      const isPermission = err?.code === 'permission-denied' ||
                           err?.message?.includes('permission');
      Alert.alert(
        'Save failed',
        isPermission
          ? 'Permission denied — publish the Firestore journal rule first.'
          : (err?.message ?? 'Check your connection and try again.'),
      );
    } finally {
      setSaving(false);
    }
  }, [user, content, prompt, existingEntry, initialType, navigation]);

  // ── Delete ──────────────────────────────────────────────────────────────────

  const handleDelete = useCallback(() => {
    if (!user || !existingEntry) return;
    Alert.alert('Delete Entry', 'Are you sure you want to delete this entry?', [
      {text: 'Cancel', style: 'cancel'},
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          await deleteEntry(user.uid, existingEntry.id).catch(() => {});
          navigation.goBack();
        },
      },
    ]);
  }, [user, existingEntry, navigation]);

  const cyclePrompt = () => {
    const next = (promptIdx + 1) % GUIDED_PROMPTS.length;
    setPromptIdx(next);
    setPrompt(GUIDED_PROMPTS[next]);
    setSaved(false);
  };

  return (
    <View style={s.screen}>
      <ScreenHeader title="Journal Entry" onBack={() => navigation.goBack()}/>
      <KeyboardAvoidingView style={s.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          style={s.scroll}
          contentContainerStyle={s.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">

          {/* Encryption reassurance */}
          <View style={s.encryptedBar}>
            <LockIcon/>
            <Text style={s.encryptedText}>
              End-to-end encrypted
            </Text>
          </View>

          {/* PHI warning (non-blocking) */}
          <PHIWarningBanner
            matches={phiMatches}
            onRedact={handleRedact}
            onDismiss={() => setPhiDismissed(true)}
          />

          {/* Guided prompt */}
          {initialType === 'guided' && (
            <View style={s.promptBar}>
              <Text style={s.promptText} numberOfLines={2}>
                {prompt || 'Tap ↻ for a prompt'}
              </Text>
              <TouchableOpacity style={s.cycleBtn} onPress={cyclePrompt} activeOpacity={0.7}>
                <RefreshIcon/>
              </TouchableOpacity>
            </View>
          )}

          {/* Writing area */}
          <View style={s.writingArea}>
            <TextInput
              style={s.textInput}
              placeholder={
                initialType === 'guided'
                  ? 'Write your thoughts here...'
                  : 'Start writing freely...'
              }
              placeholderTextColor="#BBBBBB"
              value={content}
              onChangeText={text => {
                setContent(text);
                setSaved(false);
                if (phiDismissed && text.length < 4) setPhiDismissed(false);
              }}
              multiline
              textAlignVertical="top"
              autoFocus={!isViewing}
              scrollEnabled={false}
            />
          </View>

          <Text style={s.wordCount}>
            {content.trim().split(/\s+/).filter(Boolean).length} words
          </Text>

          {/* Save / delete */}
          <TouchableOpacity
            style={[s.saveBtn, (!content.trim() || saved) && s.saveBtnDisabled]}
            onPress={handleSave}
            disabled={!content.trim() || saving || saved}
            activeOpacity={0.8}>
            {saving
              ? <ActivityIndicator color={Colors.white} size="small"/>
              : <Text style={s.saveBtnText}>{saved ? 'Saved ✓' : 'Save Entry'}</Text>}
          </TouchableOpacity>

          {existingEntry && (
            <TouchableOpacity style={s.deleteBtn} onPress={handleDelete} activeOpacity={0.7}>
              <Text style={s.deleteBtnText}>Delete Entry</Text>
            </TouchableOpacity>
          )}

          <View style={{height: 32}}/>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

// ── Styles ─────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  screen:        {flex: 1, backgroundColor: Colors.backgroundLight},
  flex:          {flex: 1},
  scroll:        {flex: 1},
  scrollContent: {padding: 16, paddingBottom: 32},

  encryptedBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  encryptedText: {fontSize: 11, color: Colors.primary, fontWeight: '600'},

  promptBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 14,
    gap: 10,
    shadowColor: '#000', shadowOffset: {width:0,height:1},
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  promptText: {flex: 1, fontSize: 14, fontWeight: '600', color: Colors.primaryDark, lineHeight: 20},
  cycleBtn:   {padding: 4},

  writingArea: {
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 16,
    minHeight: 320,
    shadowColor: '#000', shadowOffset: {width:0,height:2},
    shadowOpacity: 0.06, shadowRadius: 6, elevation: 3,
  },
  textInput: {
    fontSize: 15, color: Colors.text, lineHeight: 26,
    minHeight: 300, padding: 0,
  },
  wordCount: {textAlign: 'right', fontSize: 11, color: '#BBBBBB', marginTop: 8, marginRight: 4},

  saveBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  saveBtnDisabled: {opacity: 0.4},
  saveBtnText:     {color: Colors.white, fontSize: 16, fontWeight: '700'},
  deleteBtn:       {alignItems: 'center', paddingVertical: 14, marginTop: 4},
  deleteBtnText:   {color: Colors.error, fontSize: 14, fontWeight: '600'},
});

export default JournalEntryScreen;
