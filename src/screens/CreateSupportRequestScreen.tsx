/**
 * CreateSupportRequestScreen.tsx — compose a "Get Support" request.
 * Also handles editing an existing request when route.params.editRequest is set
 * (used by the "Edit post" action on the confirmation screen).
 */

import React, {useState, useMemo} from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView, Switch,
  StyleSheet, ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import ScreenHeader from '../components/ScreenHeader';
import PHIWarningBanner from '../components/PHIWarningBanner';
import {Colors} from '../theme/colors';
import {detectPHI, redactPHI} from '../services/phiDetection';
import {useAuth} from '../context/AuthContext';
import {
  createSupportRequest,
  updateSupportRequest,
  RequestScope,
  SupportRequest,
} from '../services/supportService';

const CATEGORIES = ['Emotional Distress', 'Finances', 'Work Issues', 'Personal Health', 'Other'];

const SCOPE_OPTIONS: {value: RequestScope; label: string}[] = [
  {value: 'circle', label: 'My Circle only (Default)'},
  {value: 'local',  label: 'My local community'},
  {value: 'public', label: 'Public AlzApp community'},
];

interface RouteParams {
  editRequest?: SupportRequest;
}

const CreateSupportRequestScreen: React.FC<{navigation: any; route: any}> = ({navigation, route}) => {
  const {user} = useAuth();
  const {editRequest}: RouteParams = route?.params ?? {};
  const isEditing = !!editRequest;

  const [title,       setTitle]       = useState(editRequest?.title ?? '');
  const [categories,  setCategories]  = useState<string[]>(editRequest?.categories ?? []);
  const [description, setDescription] = useState(editRequest?.description ?? '');
  const [scope,        setScope]       = useState<RequestScope>(editRequest?.scope ?? 'circle');
  const [anonymous,    setAnonymous]   = useState(editRequest?.anonymous ?? false);
  const [submitting,   setSubmitting]  = useState(false);
  const [phiDismissed, setPhiDismissed] = useState(false);

  // Circle-only requests are private to the caregiver's trusted circle, so PHI
  // is advisory there — anything shared more broadly is treated as public and
  // the check becomes blocking, matching the Community forum's rules.
  const isPublicish = scope !== 'circle';
  const combinedText = `${title} ${description}`;

  const phiMatches = useMemo(
    () => (phiDismissed || combinedText.trim().length < 4 ? [] : detectPHI(combinedText)),
    [combinedText, phiDismissed],
  );
  const hasBlockingPHI = isPublicish && phiMatches.length > 0;

  const toggleCategory = (cat: string) => {
    setCategories(prev => prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]);
  };

  const handleRedact = () => {
    setTitle(prev => redactPHI(prev));
    setDescription(prev => redactPHI(prev));
    setPhiDismissed(true);
  };

  const canSubmit = title.trim().length > 0 && categories.length > 0 && !hasBlockingPHI;

  const handleSubmit = async () => {
    if (!canSubmit || !user || submitting) return;
    setSubmitting(true);
    const input = {title: title.trim(), categories, description: description.trim(), scope, anonymous};
    try {
      if (isEditing) {
        await updateSupportRequest(editRequest!.id, input);
        navigation.navigate('RequestConfirmation', {
          request: {...editRequest, ...input},
        });
      } else {
        const id = await createSupportRequest(user.uid, user.name, input);
        navigation.navigate('RequestConfirmation', {
          request: {
            id, authorId: user.uid, authorName: user.name,
            expandedReach: false, status: 'open', createdAt: Date.now(), ...input,
          },
        });
      }
    } catch (err: any) {
      Alert.alert('Error', err?.message ?? 'Could not send your request. Check your connection.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={s.screen}>
      <ScreenHeader
        title={isEditing ? 'Edit Request' : 'Create Request'}
        onBack={() => navigation.goBack()}
      />

      <KeyboardAvoidingView style={s.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={s.container}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">

          <Text style={s.prompt}>What do you need help with?</Text>

          <TextInput
            style={s.titleInput}
            placeholder="Title"
            placeholderTextColor="#9E9E9E"
            value={title}
            onChangeText={setTitle}
            maxLength={80}
          />

          <View style={s.tagRow}>
            {CATEGORIES.map(cat => {
              const selected = categories.includes(cat);
              return (
                <TouchableOpacity
                  key={cat}
                  style={[s.tagPill, selected && s.tagPillActive]}
                  onPress={() => toggleCategory(cat)}
                  activeOpacity={0.75}>
                  <Text style={[s.tagText, selected && s.tagTextActive]}>{cat}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <TextInput
            style={s.descInput}
            placeholder="Description (Optional)"
            placeholderTextColor="#9E9E9E"
            value={description}
            onChangeText={setDescription}
            multiline
            maxLength={800}
            textAlignVertical="top"
          />

          {phiMatches.length > 0 && (
            <PHIWarningBanner
              matches={phiMatches}
              onRedact={handleRedact}
              onDismiss={isPublicish ? undefined : () => setPhiDismissed(true)}
              variant={isPublicish ? 'block' : 'warn'}
            />
          )}

          <Text style={s.sectionLabel}>Post in:</Text>
          <View style={s.scopeGroup}>
            {SCOPE_OPTIONS.map(opt => {
              const selected = scope === opt.value;
              return (
                <TouchableOpacity
                  key={opt.value}
                  style={[s.scopeRow, selected && s.scopeRowActive]}
                  onPress={() => setScope(opt.value)}
                  activeOpacity={0.75}>
                  <View style={[s.radioOuter, selected && s.radioOuterActive]}>
                    {selected && <View style={s.radioInner}/>}
                  </View>
                  <Text style={[s.scopeLabel, selected && s.scopeLabelActive]}>{opt.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={s.anonRow}>
            <Text style={s.anonLabel}>Post anonymously</Text>
            <Switch
              value={anonymous}
              onValueChange={setAnonymous}
              trackColor={{false: '#E0E0E0', true: Colors.primaryMedium}}
              thumbColor={Colors.white}
            />
          </View>

          <TouchableOpacity
            style={[s.submitBtn, !canSubmit && s.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={!canSubmit || submitting}
            activeOpacity={0.85}>
            {submitting
              ? <ActivityIndicator color={Colors.white}/>
              : <Text style={s.submitText}>{isEditing ? 'SAVE CHANGES' : 'REQUEST'}</Text>
            }
          </TouchableOpacity>

          <View style={{height: 24}}/>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const s = StyleSheet.create({
  screen: {flex: 1, backgroundColor: Colors.white},
  flex:   {flex: 1},
  container: {paddingHorizontal: 20, paddingTop: 20, paddingBottom: 12},

  prompt: {fontSize: 17, fontWeight: '700', color: Colors.text, marginBottom: 16, textAlign: 'center'},

  titleInput: {
    backgroundColor: 'rgba(211, 200, 245, 0.26)',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: Colors.text,
    marginBottom: 14,
  },

  tagRow: {flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14},
  tagPill: {
    paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: 16, backgroundColor: Colors.primaryLight,
  },
  tagPillActive: {backgroundColor: Colors.primary},
  tagText: {fontSize: 12, fontWeight: '600', color: Colors.text},
  tagTextActive: {color: Colors.white},

  descInput: {
    backgroundColor: 'rgba(211, 200, 245, 0.26)',
    borderRadius: 10,
    padding: 16,
    fontSize: 14,
    color: Colors.text,
    minHeight: 100,
    marginBottom: 16,
  },

  sectionLabel: {fontSize: 15, fontWeight: '700', color: Colors.text, marginBottom: 10},
  scopeGroup: {gap: 8, marginBottom: 20},
  scopeRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderWidth: 1, borderColor: '#DDDDDD', borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 13,
  },
  scopeRowActive: {backgroundColor: Colors.primaryLight, borderColor: Colors.primary},
  radioOuter: {
    width: 18, height: 18, borderRadius: 9,
    borderWidth: 1.5, borderColor: '#BBBBBB',
    alignItems: 'center', justifyContent: 'center',
  },
  radioOuterActive: {borderColor: Colors.primary},
  radioInner: {width: 9, height: 9, borderRadius: 4.5, backgroundColor: Colors.primary},
  scopeLabel: {fontSize: 14, fontWeight: '500', color: Colors.text},
  scopeLabelActive: {color: Colors.primary, fontWeight: '700'},

  anonRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Colors.primaryLight, borderRadius: 10,
    paddingHorizontal: 16, paddingVertical: 14, marginBottom: 24,
  },
  anonLabel: {fontSize: 14, fontWeight: '600', color: Colors.text},

  submitBtn: {
    backgroundColor: Colors.primary, borderRadius: 20,
    paddingVertical: 16, alignItems: 'center',
  },
  submitBtnDisabled: {opacity: 0.45},
  submitText: {color: Colors.white, fontSize: 16, fontWeight: '700', letterSpacing: 1},
});

export default CreateSupportRequestScreen;
