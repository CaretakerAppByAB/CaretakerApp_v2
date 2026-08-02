/**
 * src/screens/auth/LoginScreen.tsx
 * Replace your existing file with this one.
 */

import React, {useState} from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert, KeyboardAvoidingView,
  Platform, ScrollView,
} from 'react-native';
import {useAuth} from '../../context/AuthContext';

const LoginScreen: React.FC<{navigation: any}> = ({navigation}) => {
  const {login}       = useAuth();
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [loading,  setLoading]  = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      Alert.alert('Missing fields', 'Please enter your email and password.');
      return;
    }
    setLoading(true);
    try {
      await login(email, password);
      // onAuthStateChanged in AuthContext will update the user and
      // RootNavigator in App.tsx will automatically switch to AppNavigator
    } catch (err: any) {
      const code = err?.code ?? '';
      if (code === 'auth/user-not-found' || code === 'auth/wrong-password' ||
          code === 'auth/invalid-credential') {
        Alert.alert('Login failed', 'Incorrect email or password.');
      } else if (code === 'auth/invalid-email') {
        Alert.alert('Login failed', 'Please enter a valid email address.');
      } else if (code === 'auth/too-many-requests') {
        Alert.alert('Too many attempts', 'Please wait a moment and try again.');
      } else {
        Alert.alert('Error', err?.message ?? 'Login failed. Check your connection.');
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

        {/* Header */}
        <View style={s.header}>
          <Text style={s.appName}>AlzApp</Text>
          <Text style={s.tagline}>Caregiver Support</Text>
        </View>

        {/* Form */}
        <View style={s.form}>
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
            placeholder="••••••••"
            placeholderTextColor="#BBBBBB"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            returnKeyType="done"
            onSubmitEditing={handleLogin}
          />

          <TouchableOpacity
            style={[s.btn, loading && s.btnDisabled]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.85}>
            {loading
              ? <ActivityIndicator color="#fff"/>
              : <Text style={s.btnText}>Sign In</Text>
            }
          </TouchableOpacity>
        </View>

        {/* Register link */}
        <View style={s.footer}>
          <Text style={s.footerText}>Don't have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Register')}>
            <Text style={s.footerLink}>Create one</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const s = StyleSheet.create({
  flex:      {flex: 1, backgroundColor: '#F5F3FF'},
  container: {flexGrow: 1, justifyContent: 'center', padding: 28},
  header:    {alignItems: 'center', marginBottom: 40},
  appName:   {fontSize: 38, fontWeight: '800', color: '#8B7EEE'},
  tagline:   {fontSize: 15, color: '#7E7E7E', marginTop: 4},
  form:      {gap: 6},
  label:     {fontSize: 13, fontWeight: '600', color: '#444', marginBottom: 2, marginTop: 12},
  input: {
    backgroundColor: '#FFFFFF', borderRadius: 12,
    paddingHorizontal: 16, paddingVertical: 14,
    fontSize: 15, color: '#000',
    borderWidth: 1, borderColor: '#E0E0E0',
  },
  btn: {
    backgroundColor: '#8B7EEE', borderRadius: 12,
    paddingVertical: 15, alignItems: 'center', marginTop: 24,
  },
  btnDisabled: {opacity: 0.6},
  btnText:     {color: '#fff', fontSize: 16, fontWeight: '700'},
  footer:      {flexDirection: 'row', justifyContent: 'center', marginTop: 28},
  footerText:  {fontSize: 14, color: '#7E7E7E'},
  footerLink:  {fontSize: 14, color: '#8B7EEE', fontWeight: '700'},
});

export default LoginScreen;
