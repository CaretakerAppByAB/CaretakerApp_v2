/**
 * src/screens/auth/RegisterScreen.tsx — redesigned to match Image 2
 */

import React, {useState} from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import Svg, {Path, Rect} from 'react-native-svg';
import {useAuth} from '../../context/AuthContext';
import ScreenHeader from '../../components/ScreenHeader';
import {Colors} from '../../theme/colors';

const EmailIcon = () => (
  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
    <Rect x={2} y={4} width={20} height={16} rx={3} stroke={Colors.primary} strokeWidth={1.8}/>
    <Path d="M2 8l10 6 10-6" stroke={Colors.primary} strokeWidth={1.8} strokeLinecap="round"/>
  </Svg>
);

const LockIcon = () => (
  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
    <Path d="M19 11H5a2 2 0 00-2 2v7a2 2 0 002 2h14a2 2 0 002-2v-7a2 2 0 00-2-2z" stroke={Colors.primary} strokeWidth={1.8}/>
    <Path d="M7 11V7a5 5 0 0110 0v4" stroke={Colors.primary} strokeWidth={1.8} strokeLinecap="round"/>
  </Svg>
);

const RegisterScreen: React.FC<{navigation: any}> = ({navigation}) => {
  const {register}     = useAuth();
  const [name,     setName]     = useState('');
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [confirm,  setConfirm]  = useState('');
  const [loading,  setLoading]  = useState(false);

  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || !password) {
      Alert.alert('Missing fields', 'Please fill in all fields.');
      return;
    }
    if (password !== confirm) {
      Alert.alert('Password mismatch', 'Passwords do not match.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Weak password', 'Password must be at least 6 characters.');
      return;
    }
    setLoading(true);
    try {
      await register(name, email, password);
    } catch (err: any) {
      const code = err?.code ?? '';
      if (code === 'auth/email-already-in-use') {
        Alert.alert('Email taken', 'That email is already registered.');
      } else {
        Alert.alert('Error', err?.message ?? 'Registration failed.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={s.root}>
      <ScreenHeader title="Create Account" onBack={() => navigation.goBack()}/>

      <KeyboardAvoidingView style={s.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={s.container} keyboardShouldPersistTaps="handled">

        <View style={s.inputRow}>
          <EmailIcon/>
          <TextInput
            style={s.input}
            placeholder="Full Name"
            placeholderTextColor="#9E9E9E"
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
          />
        </View>

        <View style={s.inputRow}>
          <EmailIcon/>
          <TextInput
            style={s.input}
            placeholder="Email"
            placeholderTextColor="#9E9E9E"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
        </View>

        <View style={s.inputRow}>
          <LockIcon/>
          <TextInput
            style={s.input}
            placeholder="Password"
            placeholderTextColor="#9E9E9E"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
        </View>

        <View style={s.inputRow}>
          <LockIcon/>
          <TextInput
            style={s.input}
            placeholder="Confirm Password"
            placeholderTextColor="#9E9E9E"
            value={confirm}
            onChangeText={setConfirm}
            secureTextEntry
            returnKeyType="done"
            onSubmitEditing={handleRegister}
          />
        </View>

        <Text style={s.termsText}>
          By continuing, you agree to the Conditions,{'\n'}and Privacy Policy
        </Text>

        <TouchableOpacity
          style={[s.continueBtn, loading && s.btnDisabled]}
          onPress={handleRegister}
          disabled={loading}
          activeOpacity={0.85}>
          {loading
            ? <ActivityIndicator color={Colors.white}/>
            : <Text style={s.continueBtnText}>CONTINUE</Text>
          }
        </TouchableOpacity>

        <Text style={s.orText}>Or continue with</Text>

        <TouchableOpacity
          style={s.phoneBtn}
          onPress={() => Alert.alert('Coming soon', 'Phone number sign-up will be available in a future update.')}
          activeOpacity={0.8}>
          <Text style={s.phoneBtnText}>SIGN UP WITH PHONE NUMBER</Text>
        </TouchableOpacity>

        <View style={s.loginRow}>
          <Text style={s.loginText}>Already have an account?  </Text>
          <TouchableOpacity
            style={s.loginPill}
            onPress={() => navigation.navigate('Login')}
            activeOpacity={0.8}>
            <Text style={s.loginPillText}>Log In</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const s = StyleSheet.create({
  root:      {flex: 1},
  flex:      {flex: 1, backgroundColor: Colors.white},
  container: {flexGrow: 1, paddingHorizontal: 28, paddingTop: 32, paddingBottom: 40},

  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.cardBackground,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginBottom: 12,
    gap: 10,
  },
  input: {flex: 1, fontSize: 15, color: Colors.text, padding: 0},

  termsText: {
    textAlign: 'center',
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 18,
    marginVertical: 16,
  },

  continueBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  btnDisabled:     {opacity: 0.6},
  continueBtnText: {color: Colors.white, fontSize: 15, fontWeight: '800', letterSpacing: 1.2},

  orText: {textAlign: 'center', fontSize: 13, color: Colors.textSecondary, marginBottom: 14},

  phoneBtn: {
    backgroundColor: Colors.primaryLight,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 24,
  },
  phoneBtnText: {color: Colors.primary, fontSize: 14, fontWeight: '700', letterSpacing: 0.8},

  loginRow:     {flexDirection: 'row', alignItems: 'center', justifyContent: 'center'},
  loginText:    {fontSize: 14, color: Colors.textSecondary},
  loginPill:    {backgroundColor: Colors.primaryLight, borderRadius: 16, paddingHorizontal: 14, paddingVertical: 6},
  loginPillText:{fontSize: 13, fontWeight: '700', color: Colors.primary},
});

export default RegisterScreen;
