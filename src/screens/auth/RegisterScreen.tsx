/**
 * src/screens/auth/RegisterScreen.tsx
 * Replace your existing file with this one.
 */

import React, {useState} from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert, KeyboardAvoidingView,
  Platform, ScrollView,
} from 'react-native';
import {useAuth} from '../../context/AuthContext';

const RegisterScreen: React.FC<{navigation: any}> = ({navigation}) => {
  const {register}     = useAuth();
  const [name,     setName]     = useState('');
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [confirm,  setConfirm]  = useState('');
  const [loading,  setLoading]  = useState(false);

  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || !password || !confirm) {
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
      // onAuthStateChanged will detect the new user and navigate automatically
    } catch (err: any) {
      const code = err?.code ?? '';
      if (code === 'auth/email-already-in-use') {
        Alert.alert('Email taken', 'That email is already registered. Try signing in instead.');
      } else if (code === 'auth/invalid-email') {
        Alert.alert('Invalid email', 'Please enter a valid email address.');
      } else {
        Alert.alert('Error', err?.message ?? 'Registration failed. Check your connection.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={s.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={s.container}
        keyboardShouldPersistTaps="handled">

        <View style={s.header}>
          <Text style={s.appName}>Create Account</Text>
          <Text style={s.tagline}>Join the AlzApp community</Text>
        </View>

        <View style={s.form}>
          <Text style={s.label}>Full Name</Text>
          <TextInput
            style={s.input}
            placeholder="Your name"
            placeholderTextColor="#BBBBBB"
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
            returnKeyType="next"
          />

          <Text style={s.label}>Email</Text>
          <TextInput
            style={s.input}
            placeholder="you@example.com"
            placeholderTextColor="#BBBBBB"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
            returnKeyType="next"
          />

          <Text style={s.label}>Password</Text>
          <TextInput
            style={s.input}
            placeholder="At least 6 characters"
            placeholderTextColor="#BBBBBB"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            returnKeyType="next"
          />

          <Text style={s.label}>Confirm Password</Text>
          <TextInput
            style={s.input}
            placeholder="Repeat password"
            placeholderTextColor="#BBBBBB"
            value={confirm}
            onChangeText={setConfirm}
            secureTextEntry
            returnKeyType="done"
            onSubmitEditing={handleRegister}
          />

          <TouchableOpacity
            style={[s.btn, loading && s.btnDisabled]}
            onPress={handleRegister}
            disabled={loading}
            activeOpacity={0.85}>
            {loading
              ? <ActivityIndicator color="#fff"/>
              : <Text style={s.btnText}>Create Account</Text>
            }
          </TouchableOpacity>
        </View>

        <View style={s.footer}>
          <Text style={s.footerText}>Already have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={s.footerLink}>Sign in</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const s = StyleSheet.create({
  flex:      {flex: 1, backgroundColor: '#F5F3FF'},
  container: {flexGrow: 1, justifyContent: 'center', padding: 28},
  header:    {alignItems: 'center', marginBottom: 32},
  appName:   {fontSize: 30, fontWeight: '800', color: '#8B7EEE'},
  tagline:   {fontSize: 14, color: '#7E7E7E', marginTop: 4},
  form:      {gap: 4},
  label:     {fontSize: 13, fontWeight: '600', color: '#444', marginBottom: 2, marginTop: 10},
  input: {
    backgroundColor: '#FFFFFF', borderRadius: 12,
    paddingHorizontal: 16, paddingVertical: 13,
    fontSize: 15, color: '#000',
    borderWidth: 1, borderColor: '#E0E0E0',
  },
  btn: {
    backgroundColor: '#8B7EEE', borderRadius: 12,
    paddingVertical: 15, alignItems: 'center', marginTop: 22,
  },
  btnDisabled: {opacity: 0.6},
  btnText:     {color: '#fff', fontSize: 16, fontWeight: '700'},
  footer:      {flexDirection: 'row', justifyContent: 'center', marginTop: 24},
  footerText:  {fontSize: 14, color: '#7E7E7E'},
  footerLink:  {fontSize: 14, color: '#8B7EEE', fontWeight: '700'},
});

export default RegisterScreen;
