/**
 * src/screens/JournalEntryScreen.tsx
 *
 * Content is encrypted before saving (see journalService -> cryptoService).
 * A non-blocking PHI warning appears if likely identifiers are detected.
 */

import React, {useState, useLayoutEffect, useCallback, useMemo} from 'react';
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

// ── Icons ──────────────────────────────────────────────────────────────────────

const RefreshIcon = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Path d="M1 4v6h6M23 20v-6h-6" stroke="#8B7EEE" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
    <Path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10M23 14l-4.64 4.36A9 9 0 0 1 3.51 15"
      stroke="#8B7EEE" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

const LockIcon = () => (
  <Svg width={12} height={12} viewBox="0 0 24 24" fill="none">
    <Path d="M19 11H5a2 2 0 00-2 2v7a2 2 0 002 2h14a2 2 0 002-2v-7a2 2 0 00-2-2z" stroke="#8B7EEE" strokeWidth={2}/>
    <Path d="M7 11V7a5 5 0 0110 0v4" stroke="#8B7EEE" strokeWidth={2} strokeLinecap="round"/>
  </Svg>
);

const formatHeader = (ms: number) =>
  new Date(ms).toLocaleDateString('en-US', {weekday: 'long', month: 'long', day: 'numeric'});

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

  // ── Header buttons ──────────────────────────────────────────────────────────

  useLayoutEffect(() => {
    navigation.setOptions({
      title: existingEntry
        ? formatHeader(existingEntry.createdAt)
        : (initialType === 'guided' ? 'Guided Journal' : 'Free Write'),
      headerRight: () => (
        <View style={{flexDirection: 'row', alignItems: 'center', gap: 16, marginRight: 4}}>
          {existingEntry && (
            <TouchableOpacity onPress={handleDelete} activeOpacity={0.7}>
              <Text style={{color: 'rgba(255,180,180,1)', fontWeight: '600', fontSize: 14}}>Delete</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={handleSave} disabled={!content.trim() || saving || saved} activeOpacity={0.7}>
            {saving
              ? <ActivityIndicator color="#fff" size="small"/>
              : <Text style={{
                  color: content.trim() && !saved ? '#fff' : 'rgba(255,255,255,0.45)',
                  fontWeight: '700', fontSize: 15,
                }}>
                  {saved ? 'Saved ✓' : 'Save'}
                </Text>
            }
          </TouchableOpacity>
        </View>
      ),
    });
  }, [content, saving, saved, existingEntry, handleSave, handleDelete]);

  const cyclePrompt = () => {
    const next = (promptIdx + 1) % GUIDED_PROMPTS.length;
    setPromptIdx(next);
    setPrompt(GUIDED_PROMPTS[next]);
    setSaved(false);
  };

  return (
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
            End-to-end encrypted — only you can read this
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

        <View style={{height: 32}}/>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

// ── Styles ─────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  flex:          {flex: 1, backgroundColor: '#F5F3FF'},
  scroll:        {flex: 1},
  scrollContent: {padding: 16, paddingBottom: 32},

  encryptedBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  encryptedText: {fontSize: 11, color: '#8B7EEE', fontWeight: '600'},

  promptBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 14,
    gap: 10,
    shadowColor: '#000', shadowOffset: {width:0,height:1},
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  promptText: {flex: 1, fontSize: 14, fontWeight: '600', color: '#5A4DA8', lineHeight: 20},
  cycleBtn:   {padding: 4},

  writingArea: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    minHeight: 320,
    shadowColor: '#000', shadowOffset: {width:0,height:2},
    shadowOpacity: 0.06, shadowRadius: 6, elevation: 3,
  },
  textInput: {
    fontSize: 15, color: '#1A1A1A', lineHeight: 26,
    minHeight: 300, padding: 0,
  },
  wordCount: {textAlign: 'right', fontSize: 11, color: '#BBBBBB', marginTop: 8, marginRight: 4},
});

export default JournalEntryScreen;
