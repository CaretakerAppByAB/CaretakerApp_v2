/**
 * src/screens/ProfileSetupScreen.tsx
 *
 * Multi-step profile builder shown immediately after registration.
 * Steps: 1 Basic Info  2 Goals  3 Responsibilities  4 Notifications
 * On complete -> completeProfileSetup() -> refreshUser() -> App routes to AppNavigator
 */

import React, {useState} from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, Switch, Alert, ActivityIndicator,
} from 'react-native';
import {useAuth} from '../context/AuthContext';
import {completeProfileSetup, PRONOUN_OPTIONS, GOAL_OPTIONS, RESPONSIBILITY_OPTIONS} from '../services/userService';
import ScreenHeader from '../components/ScreenHeader';
import {Colors} from '../theme/colors';

const TOTAL_STEPS = 4;

// ── Chip (multi-select option) ─────────────────────────────────────────────────

const Chip: React.FC<{label: string; selected: boolean; onPress: () => void}> = ({label, selected, onPress}) => (
  <TouchableOpacity
    style={[cs.chip, selected && cs.chipSelected]}
    onPress={onPress}
    activeOpacity={0.7}>
    <Text style={[cs.chipText, selected && cs.chipTextSelected]}>{label}</Text>
  </TouchableOpacity>
);

// ── Progress bar ───────────────────────────────────────────────────────────────

const Progress: React.FC<{step: number}> = ({step}) => (
  <View style={cs.progressWrap}>
    {Array.from({length: TOTAL_STEPS}).map((_, i) => (
      <View key={i} style={[cs.progressDot, i < step && cs.progressDotActive]}/>
    ))}
  </View>
);

// ── Main screen ────────────────────────────────────────────────────────────────

const ProfileSetupScreen: React.FC = () => {
  const {user, refreshUser} = useAuth();

  const [step,     setStep]     = useState(1);
  const [saving,   setSaving]   = useState(false);

  // Step 1 fields
  const [pronouns, setPronouns] = useState('');
  const [age,      setAge]      = useState('');

  // Step 2 — goals (multi-select)
  const [goals, setGoals] = useState<string[]>([]);

  // Step 3 — responsibilities (multi-select)
  const [responsibilities, setResponsibilities] = useState<string[]>([]);

  // Step 4 — notifications
  const [notificationsEnabled, setNotifications] = useState(false);

  const toggleGoal = (g: string) =>
    setGoals(prev => prev.includes(g) ? prev.filter(x => x !== g) : [...prev, g]);

  const toggleResp = (r: string) =>
    setResponsibilities(prev => prev.includes(r) ? prev.filter(x => x !== r) : [...prev, r]);

  const handleNext = () => {
    if (step < TOTAL_STEPS) {
      setStep(s => s + 1);
    } else {
      handleComplete();
    }
  };

  const handleComplete = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await completeProfileSetup(user.uid, {
        pronouns,
        age,
        goals,
        responsibilities,
        notificationsEnabled,
      });
      await refreshUser(); // triggers App.tsx to switch to AppNavigator
    } catch (err: any) {
      Alert.alert('Error', err?.message ?? 'Could not save profile. Try again.');
    } finally {
      setSaving(false);
    }
  };

  const stepTitle = ['Basic Info', 'Your Goals', 'Your Responsibilities', 'Notifications'][step - 1];

  return (
    <View style={cs.safe}>

      <ScreenHeader
        title="Set Up Your Profile"
        titleSlot={
          <View style={cs.headerTitleSlot}>
            <Text style={cs.headerTitle} numberOfLines={1}>Set Up Your Profile</Text>
            <Text style={cs.headerSub} numberOfLines={1}>Step {step} of {TOTAL_STEPS} — {stepTitle}</Text>
            <Progress step={step}/>
          </View>
        }
        onBack={step > 1 ? () => setStep(s => s - 1) : undefined}
      />

      <ScrollView style={cs.scroll} contentContainerStyle={cs.container} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

        {/* ── Step 1: Basic Info ── */}
        {step === 1 && (
          <>
            <Text style={cs.sectionLabel}>Hi, {user?.name?.split(' ')[0] || 'there'}! Tell us a bit about yourself.</Text>

            <Text style={cs.fieldLabel}>Pronouns (optional)</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{marginBottom: 20}}>
              <View style={cs.chipRowH}>
                {PRONOUN_OPTIONS.map(p => (
                  <Chip key={p} label={p} selected={pronouns === p} onPress={() => setPronouns(prev => prev === p ? '' : p)}/>
                ))}
              </View>
            </ScrollView>

            <Text style={cs.fieldLabel}>Age (optional)</Text>
            <TextInput
              style={cs.textInput}
              placeholder="e.g. 42"
              placeholderTextColor="#BBBBBB"
              value={age}
              onChangeText={setAge}
              keyboardType="number-pad"
              maxLength={3}
            />
          </>
        )}

        {/* ── Step 2: Goals ── */}
        {step === 2 && (
          <>
            <Text style={cs.sectionLabel}>What are your goals with AlzApp?</Text>
            <Text style={cs.sectionSub}>Select all that apply</Text>
            <View style={cs.chipGrid}>
              {GOAL_OPTIONS.map(g => (
                <Chip key={g} label={g} selected={goals.includes(g)} onPress={() => toggleGoal(g)}/>
              ))}
            </View>
          </>
        )}

        {/* ── Step 3: Responsibilities ── */}
        {step === 3 && (
          <>
            <Text style={cs.sectionLabel}>What are your caregiving responsibilities?</Text>
            <Text style={cs.sectionSub}>Select all that apply</Text>
            <View style={cs.chipGrid}>
              {RESPONSIBILITY_OPTIONS.map(r => (
                <Chip key={r} label={r} selected={responsibilities.includes(r)} onPress={() => toggleResp(r)}/>
              ))}
            </View>
          </>
        )}

        {/* ── Step 4: Notifications ── */}
        {step === 4 && (
          <>
            <Text style={cs.sectionLabel}>Stay in the loop</Text>

            <View style={cs.notifCard}>
              <View style={cs.notifRow}>
                <Text style={cs.notifTitle}>Push Notifications</Text>
                <Switch
                  value={notificationsEnabled}
                  onValueChange={setNotifications}
                  trackColor={{false: '#E8E8E8', true: Colors.primary}}
                  thumbColor={Colors.white}
                />
              </View>
            </View>
          </>
        )}

        <View style={{height: 24}}/>
      </ScrollView>

      {/* Footer buttons */}
      <View style={cs.footer}>
        {step > 1 && (
          <TouchableOpacity style={cs.backBtn} onPress={() => setStep(s => s - 1)} activeOpacity={0.7}>
            <Text style={cs.backBtnText}>Back</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[cs.nextBtn, saving && cs.btnDisabled, step === 1 && {flex: 1}]}
          onPress={handleNext}
          disabled={saving}
          activeOpacity={0.85}>
          {saving
            ? <ActivityIndicator color={Colors.white}/>
            : <Text style={cs.nextBtnText}>{step === TOTAL_STEPS ? 'Finish' : 'Next'}</Text>
          }
        </TouchableOpacity>
      </View>

      {/* Skip */}
      {step < TOTAL_STEPS && (
        <TouchableOpacity style={cs.skipWrap} onPress={handleComplete}>
          <Text style={cs.skipText}>Skip for now</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

// ── Styles ─────────────────────────────────────────────────────────────────────

const cs = StyleSheet.create({
  safe:   {flex: 1, backgroundColor: Colors.backgroundLight},
  scroll: {flex: 1},
  container: {padding: 20, paddingBottom: 8},

  headerTitleSlot: {width: '100%', alignItems: 'center'},
  headerTitle: {fontSize: 18, fontWeight: '700', color: Colors.text},
  headerSub:   {fontSize: 12, fontWeight: '500', color: Colors.textSecondary, marginTop: 2, marginBottom: 10},

  progressWrap:    {flexDirection: 'row', gap: 8, width: '100%'},
  progressDot:     {flex: 1, height: 4, borderRadius: 2, backgroundColor: Colors.primaryLight},
  progressDotActive:{backgroundColor: Colors.primary},

  sectionLabel: {fontSize: 17, fontWeight: '700', color: Colors.text, marginBottom: 6},
  sectionSub:   {fontSize: 13, color: Colors.textSecondary, marginBottom: 16},

  fieldLabel: {fontSize: 14, fontWeight: '600', color: Colors.text, marginBottom: 8},
  textInput: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: Colors.text,
    borderWidth: 1.5,
    borderColor: Colors.border,
    marginBottom: 20,
  },

  chipRowH:  {flexDirection: 'row', gap: 8, paddingRight: 8},
  chipGrid:  {flexDirection: 'row', flexWrap: 'wrap', gap: 8},
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 20,
    backgroundColor: Colors.white,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  chipSelected:     {backgroundColor: Colors.primary, borderColor: Colors.primary},
  chipText:         {fontSize: 13, fontWeight: '500', color: Colors.textSecondary},
  chipTextSelected: {color: Colors.white, fontWeight: '700'},

  notifCard: {backgroundColor: Colors.white, borderRadius: 14, padding: 16, marginBottom: 12, shadowColor:'#000', shadowOffset:{width:0,height:1}, shadowOpacity:0.06, shadowRadius:4, elevation:2},
  notifRow:  {flexDirection:'row', alignItems:'center', justifyContent:'space-between'},
  notifTitle:{fontSize:15, fontWeight:'700', color: Colors.text},

  footer:     {flexDirection:'row', paddingHorizontal:20, paddingVertical:16, gap:12},
  backBtn:    {flex:0.4, borderRadius:12, borderWidth:1.5, borderColor: Colors.primary, paddingVertical:14, alignItems:'center'},
  backBtnText:{fontSize:15, fontWeight:'700', color: Colors.primary},
  nextBtn:    {flex:0.6, backgroundColor: Colors.primary, borderRadius:12, paddingVertical:14, alignItems:'center'},
  btnDisabled:{opacity:0.55},
  nextBtnText:{fontSize:15, fontWeight:'700', color: Colors.white},
  skipWrap:   {alignItems:'center', paddingBottom:16},
  skipText:   {fontSize:13, color: Colors.textSecondary},
});

export default ProfileSetupScreen;
