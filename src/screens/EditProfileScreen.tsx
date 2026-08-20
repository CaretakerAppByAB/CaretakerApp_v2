/**
 * src/screens/EditProfileScreen.tsx
 * Lets the user update name, pronouns, age, goals, responsibilities.
 */

import React, {useState} from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, SafeAreaView, ActivityIndicator, Alert,
} from 'react-native';
import {useAuth} from '../context/AuthContext';
import {
  updateUserProfile, refreshUser,
  PRONOUN_OPTIONS, GOAL_OPTIONS, RESPONSIBILITY_OPTIONS,
} from '../services/userService';

const Chip: React.FC<{label: string; selected: boolean; onPress: () => void}> = ({label, selected, onPress}) => (
  <TouchableOpacity style={[ep.chip, selected && ep.chipSelected]} onPress={onPress} activeOpacity={0.7}>
    <Text style={[ep.chipText, selected && ep.chipTextSelected]}>{label}</Text>
  </TouchableOpacity>
);

const EditProfileScreen: React.FC<{navigation: any}> = ({navigation}) => {
  const {user, refreshUser: refresh} = useAuth();

  const [name,             setName]     = useState(user?.name ?? '');
  const [pronouns,         setPronouns] = useState(user?.pronouns ?? '');
  const [age,              setAge]      = useState(user?.age ?? '');
  const [goals,            setGoals]    = useState<string[]>(user?.goals ?? []);
  const [responsibilities, setResps]    = useState<string[]>(user?.responsibilities ?? []);
  const [saving,           setSaving]   = useState(false);

  const toggleGoal = (g: string) =>
    setGoals(prev => prev.includes(g) ? prev.filter(x => x !== g) : [...prev, g]);
  const toggleResp = (r: string) =>
    setResps(prev => prev.includes(r) ? prev.filter(x => x !== r) : [...prev, r]);

  const handleSave = async () => {
    if (!name.trim()) { Alert.alert('Name required', 'Please enter your display name.'); return; }
    if (!user) return;
    setSaving(true);
    try {
      await updateUserProfile(user.uid, {name: name.trim(), pronouns, age, goals, responsibilities});
      await refresh();
      navigation.goBack();
    } catch (err: any) {
      Alert.alert('Error', err?.message ?? 'Could not save. Check your connection.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={ep.safe}>
      <ScrollView style={ep.scroll} contentContainerStyle={ep.container} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

        <Text style={ep.sectionTitle}>Display Name</Text>
        <TextInput
          style={ep.textInput}
          value={name}
          onChangeText={setName}
          placeholder="Your name"
          placeholderTextColor="#BBBBBB"
        />

        <Text style={ep.sectionTitle}>Pronouns</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{marginBottom: 20}}>
          <View style={{flexDirection: 'row', gap: 8, paddingRight: 8}}>
            {PRONOUN_OPTIONS.map(p => (
              <Chip key={p} label={p} selected={pronouns === p} onPress={() => setPronouns(prev => prev === p ? '' : p)}/>
            ))}
          </View>
        </ScrollView>

        <Text style={ep.sectionTitle}>Age</Text>
        <TextInput
          style={ep.textInput}
          value={age}
          onChangeText={setAge}
          placeholder="e.g. 42"
          placeholderTextColor="#BBBBBB"
          keyboardType="number-pad"
          maxLength={3}
        />

        <Text style={ep.sectionTitle}>Goals</Text>
        <View style={ep.chipGrid}>
          {GOAL_OPTIONS.map(g => (
            <Chip key={g} label={g} selected={goals.includes(g)} onPress={() => toggleGoal(g)}/>
          ))}
        </View>

        <Text style={ep.sectionTitle}>Caregiving Responsibilities</Text>
        <View style={ep.chipGrid}>
          {RESPONSIBILITY_OPTIONS.map(r => (
            <Chip key={r} label={r} selected={responsibilities.includes(r)} onPress={() => toggleResp(r)}/>
          ))}
        </View>

        <TouchableOpacity
          style={[ep.saveBtn, saving && ep.btnDisabled]}
          onPress={handleSave}
          disabled={saving}
          activeOpacity={0.85}>
          {saving
            ? <ActivityIndicator color="#fff"/>
            : <Text style={ep.saveBtnText}>Save Changes</Text>
          }
        </TouchableOpacity>

        <View style={{height: 32}}/>
      </ScrollView>
    </SafeAreaView>
  );
};

const ep = StyleSheet.create({
  safe:      {flex: 1, backgroundColor: '#F5F3FF'},
  scroll:    {flex: 1},
  container: {padding: 20},

  sectionTitle: {fontSize: 15, fontWeight: '700', color: '#333', marginBottom: 10, marginTop: 4},
  textInput: {
    backgroundColor: '#FFFFFF', borderRadius: 12, padding: 14,
    fontSize: 15, color: '#000', borderWidth: 1.5, borderColor: '#E0E0E0', marginBottom: 20,
  },

  chipGrid:         {flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20},
  chip:             {paddingHorizontal: 14, paddingVertical: 9, borderRadius: 20, backgroundColor: '#FFFFFF', borderWidth: 1.5, borderColor: '#E0E0E0'},
  chipSelected:     {backgroundColor: '#8B7EEE', borderColor: '#8B7EEE'},
  chipText:         {fontSize: 13, fontWeight: '500', color: '#555'},
  chipTextSelected: {color: '#FFFFFF', fontWeight: '700'},

  saveBtn:     {backgroundColor: '#8B7EEE', borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 8},
  btnDisabled: {opacity: 0.55},
  saveBtnText: {fontSize: 16, fontWeight: '700', color: '#FFFFFF'},
});

export default EditProfileScreen;
