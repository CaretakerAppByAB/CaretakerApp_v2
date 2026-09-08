/**
 * src/screens/auth/LoginScreen.tsx — redesigned to match latest Figma export
 */

import React, {useState} from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, KeyboardAvoidingView,
  Platform, ScrollView, Image,
} from 'react-native';
import Svg, {Path, Circle} from 'react-native-svg';
import {useAuth} from '../../context/AuthContext';
import {Colors} from '../../theme/colors';

// ── Icons ──────────────────────────────────────────────────────────────────────

const BackIcon = () => (
  <Svg width={22} height={20} viewBox="0 0 22 20" fill="none">
    <Path d="M21 10H1M1 10L10 1M1 10l9 9" stroke={Colors.primary} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

const PersonIcon = () => (
  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
    <Path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" stroke="#2D3E2B" strokeWidth={1.8} strokeLinecap="round"/>
    <Circle cx={12} cy={7} r={4} stroke="#2D3E2B" strokeWidth={1.8}/>
  </Svg>
);

const LockIcon = () => (
  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
    <Path d="M19 11H5a2 2 0 00-2 2v7a2 2 0 002 2h14a2 2 0 002-2v-7a2 2 0 00-2-2z" stroke="#2D3E2B" strokeWidth={1.8}/>
    <Path d="M7 11V7a5 5 0 0110 0v4" stroke="#2D3E2B" strokeWidth={1.8} strokeLinecap="round"/>
  </Svg>
);

// ── Main screen ────────────────────────────────────────────────────────────────

const LoginScreen: React.FC<{navigation: any}> = ({navigation}) => {
  const {login}        = useAuth();
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
    } catch (err: any) {
      const code = err?.code ?? '';
      if (code === 'auth/user-not-found' || code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
        Alert.alert('Login failed', 'Incorrect email or password.');
      } else if (code === 'auth/invalid-email') {
        Alert.alert('Login failed', 'Please enter a valid email address.');
      } else {
        Alert.alert('Error', err?.message ?? 'Login failed. Check your connection.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={s.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={s.container} keyboardShouldPersistTaps="handled">

        {navigation?.canGoBack?.() && (
          <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()} hitSlop={12}>
            <BackIcon/>
          </TouchableOpacity>
        )}

        {/* Logo + app name */}
        <View style={s.illustrationWrap}>
          <Image source={require('../../../images/logo-app.png')} style={s.logo} resizeMode="contain"/>
          <Text style={s.appName}>AlzApp</Text>
        </View>

        {/* Inputs */}
        <View style={s.inputRow}>
          <PersonIcon/>
          <TextInput
            style={s.input}
            placeholder="Username or Email"
            placeholderTextColor="#2D3E2B"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            returnKeyType="next"
          />
        </View>

        <View style={s.inputRow}>
          <LockIcon/>
          <TextInput
            style={s.input}
            placeholder="Password"
            placeholderTextColor="#2D3E2B"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            returnKeyType="done"
            onSubmitEditing={handleLogin}
          />
        </View>

        <TouchableOpacity style={s.forgotWrap}>
          <Text style={s.forgotText}>Forgot Password?</Text>
        </TouchableOpacity>

        {/* Login button */}
        <TouchableOpacity
          style={[s.loginBtn, loading && s.btnDisabled]}
          onPress={handleLogin}
          disabled={loading}
          activeOpacity={0.85}>
          {loading
            ? <ActivityIndicator color="#fff"/>
            : <Text style={s.loginBtnText}>LOGIN</Text>
          }
        </TouchableOpacity>

        {/* Sign up link */}
        <View style={s.signupRow}>
          <Text style={s.signupText}>Don't have an account?  </Text>
          <TouchableOpacity
            style={s.signupPill}
            onPress={() => navigation.navigate('Register')}
            activeOpacity={0.8}>
            <Text style={s.signupPillText}>Sign Up</Text>
          </TouchableOpacity>
        </View>

        {/* OR divider */}
        <View style={s.dividerRow}>
          <View style={s.dividerLine}/>
          <Text style={s.dividerText}>OR</Text>
          <View style={s.dividerLine}/>
        </View>

        {/* Social login */}
        <View style={s.socialRow}>
          {[
            {source: require('../../../images/icon-google.png'), size: 32},
            {source: require('../../../images/icon-facebook.png'), size: 26},
            {source: require('../../../images/icon-apple.png'), size: 32},
          ].map(({source, size}, i) => (
            <TouchableOpacity
              key={i}
              style={s.socialBtn}
              onPress={() => Alert.alert('Coming soon', 'Social login will be available in a future update.')}
              activeOpacity={0.8}>
              <Image source={source} style={{width: size, height: size}} resizeMode="contain"/>
            </TouchableOpacity>
          ))}
        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
};

// ── Styles ─────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  flex:      {flex: 1, backgroundColor: '#FFFFFF'},
  container: {flexGrow: 1, alignItems: 'center', paddingHorizontal: 26, paddingTop: 60, paddingBottom: 40},

  backBtn: {alignSelf: 'flex-start', marginBottom: 8, padding: 4},

  illustrationWrap: {alignItems: 'center', marginBottom: 28, marginTop: 12},
  logo: {width: 130, height: 130},
  appName: {fontSize: 16, fontWeight: '400', color: '#000000', marginTop: 14},

  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(211, 200, 245, 0.26)',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginBottom: 14,
    width: '100%',
    gap: 10,
  },
  input: {flex: 1, fontSize: 15, fontWeight: '600', color: '#2D3E2B', padding: 0},

  forgotWrap: {alignSelf: 'flex-end', marginBottom: 20},
  forgotText: {fontSize: 12, fontWeight: '600', color: '#2D3E2B'},

  loginBtn: {
    backgroundColor: '#D3C9F5',
    borderRadius: 20,
    paddingVertical: 14,
    width: '100%',
    alignItems: 'center',
    marginBottom: 20,
  },
  btnDisabled:  {opacity: 0.6},
  loginBtnText: {color: '#FFFFFF', fontSize: 18, fontWeight: '600', letterSpacing: 1.5},

  signupRow:     {flexDirection: 'row', alignItems: 'center', marginBottom: 24},
  signupText:    {fontSize: 12, fontWeight: '600', color: '#2D3E2B'},
  signupPill:    {backgroundColor: 'rgba(211, 200, 245, 0.26)', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 6},
  signupPillText:{fontSize: 13, fontWeight: '600', color: '#A18CE6'},

  dividerRow: {flexDirection: 'row', alignItems: 'center', width: '100%', marginBottom: 20, gap: 10},
  dividerLine:{flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: '#CCCCCC'},
  dividerText:{fontSize: 12, fontWeight: '600', color: '#2D3E2B'},

  socialRow:   {flexDirection: 'row', gap: 20},
  socialBtn: {
    width: 50, height: 50, borderRadius: 25,
    backgroundColor: '#F5F5F5',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: {width:0,height:1}, shadowOpacity:0.1, shadowRadius:3, elevation:2,
  },
});

export default LoginScreen;
