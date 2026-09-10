/**
 * CreateSupportRequestScreen.tsx — compose a "Get Support" request.
 * Also handles editing an existing request when route.params.editRequest is set
 * (used by the "Edit post" action on the confirmation screen).
 */

import React, {useState, useMemo} from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView, Image,
  StyleSheet, ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import ScreenHeader from '../components/ScreenHeader';
import PHIWarningBanner from '../components/PHIWarningBanner';
import {Colors} from '../theme/colors';
import {detectPHI, redactPHI} from '../services/phiDetection';
import {useAuth} from '../context/AuthContext';
import {pickImageWithPrompt, uploadImage, PickedImage} from '../services/mediaService';
import {
  createSupportRequest,
  updateSupportRequest,
  SupportRequest,
} from '../services/supportService';

const CATEGORIES = ['Emotional Distress', 'Finances', 'Work Issues', 'Personal Health', 'Other'];

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
  const [image,        setImage]       = useState<PickedImage | null>(null);
  const [submitting,   setSubmitting]  = useState(false);
  const [phiDismissed, setPhiDismissed] = useState(false);

  const handlePickImage = async () => {
    const picked = await pickImageWithPrompt();
    if (picked) setImage(picked);
  };

  // Every request is posted anonymously to the public Help/Advice community
  // tab, so PHI is always blocking here — matching the Community forum's rules.
  const combinedText = `${title} ${description}`;

  const phiMatches = useMemo(
    () => (phiDismissed || combinedText.trim().length < 4 ? [] : detectPHI(combinedText)),
    [combinedText, phiDismissed],
  );
  const hasBlockingPHI = phiMatches.length > 0;

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
    const input = {title: title.trim(), categories, description: description.trim()};
    try {
      const imageUrl = image ? await uploadImage(image, 'postImages') : undefined;
      if (isEditing) {
        await updateSupportRequest(editRequest!.id, editRequest!.postId, input, imageUrl);
        navigation.navigate('RequestConfirmation', {
          request: {...editRequest, ...input},
        });
      } else {
        const {id, postId} = await createSupportRequest(user.uid, user.name, input, imageUrl);
        navigation.navigate('RequestConfirmation', {
          request: {
            id, postId, authorId: user.uid, authorName: user.name,
            expandedReach: false, status: 'open', createdAt: Date.now(), ...input,
          },
        });
      }
    } catch (err: any) {
      console.error('[CreateSupportRequestScreen] submit failed:', err);
      Alert.alert('Could not send your request', err?.message ?? 'Check your connection and try again.');
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
              variant="block"
            />
          )}

          {image ? (
            <View style={s.imagePreviewWrap}>
              <Image source={{uri: image.uri}} style={s.imagePreview} resizeMode="cover"/>
              <TouchableOpacity style={s.removeImageBtn} onPress={() => setImage(null)} activeOpacity={0.8}>
                <Text style={s.removeImageBtnText}>✕</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={s.photoBtn} onPress={handlePickImage} activeOpacity={0.75}>
              <Text style={s.photoBtnText}>📷 Add Photo</Text>
            </TouchableOpacity>
          )}

          <View style={s.anonNotice}>
            <Text style={s.anonNoticeText}>
              🌐 Posted anonymously to the community Help/Advice board, so anyone on AlzApp can offer advice.
            </Text>
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

  photoBtn: {
    backgroundColor: Colors.primaryLight, borderRadius: 12,
    paddingVertical: 12, alignItems: 'center', marginBottom: 16,
  },
  photoBtnText: {fontSize: 13, fontWeight: '600', color: Colors.text},
  imagePreviewWrap: {marginBottom: 16, position: 'relative'},
  imagePreview: {width: '100%', height: 180, borderRadius: 12, backgroundColor: '#E8E8E8'},
  removeImageBtn: {
    position: 'absolute', top: 8, right: 8,
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center',
  },
  removeImageBtnText: {color: Colors.white, fontSize: 13, fontWeight: '700'},

  anonNotice: {
    backgroundColor: '#EEF4FD', borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 9, marginBottom: 24,
  },
  anonNoticeText: {fontSize: 12, color: '#2C5A8F', lineHeight: 17},

  submitBtn: {
    backgroundColor: Colors.primary, borderRadius: 20,
    paddingVertical: 16, alignItems: 'center',
  },
  submitBtnDisabled: {opacity: 0.45},
  submitText: {color: Colors.white, fontSize: 16, fontWeight: '700', letterSpacing: 1},
});

export default CreateSupportRequestScreen;
