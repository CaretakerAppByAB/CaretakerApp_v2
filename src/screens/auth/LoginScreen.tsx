/**
 * src/screens/auth/LoginScreen.tsx — redesigned to match Image 1
 */

import React, {useState} from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, KeyboardAvoidingView,
  Platform, ScrollView, Image,
} from 'react-native';
import Svg, {Path, Circle, G} from 'react-native-svg';
import {useAuth} from '../../context/AuthContext';
import {Colors} from '../../theme/colors';

// ── Icons ──────────────────────────────────────────────────────────────────────

const PersonIcon = () => (
  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
    <Path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" stroke={Colors.primary} strokeWidth={1.8} strokeLinecap="round"/>
    <Circle cx={12} cy={7} r={4} stroke={Colors.primary} strokeWidth={1.8}/>
  </Svg>
);

const LockIcon = () => (
  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
    <Path d="M19 11H5a2 2 0 00-2 2v7a2 2 0 002 2h14a2 2 0 002-2v-7a2 2 0 00-2-2z" stroke={Colors.primary} strokeWidth={1.8}/>
    <Path d="M7 11V7a5 5 0 0110 0v4" stroke={Colors.primary} strokeWidth={1.8} strokeLinecap="round"/>
  </Svg>
);

// ── Caregiver illustration (SVG) ───────────────────────────────────────────────

const CaregiverIllustration = () => (
  <Svg width={100} height={100} viewBox="0 0 100 100">
    <Circle cx={50} cy={50} r={50} fill={Colors.primaryLight}/>
    {/* Person 1 (caregiver) */}
    <Circle cx={38} cy={32} r={12} fill={Colors.primary}/>
    <Path d="M20 70 Q38 55 56 70" fill={Colors.primary}/>
    {/* Person 2 (loved one, smaller) */}
    <Circle cx={62} cy={38} r={9} fill={Colors.primaryMedium}/>
    <Path d="M48 72 Q62 60 76 72" fill={Colors.primaryMedium}/>
    {/* Heart */}
    <Path
      d="M50 48 C48 44 43 44 43 48 C43 52 50 57 50 57 C50 57 57 52 57 48 C57 44 52 44 50 48Z"
      fill="#FFFFFF" opacity={0.9}
    />
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

        {/* Illustration + app name */}
        <View style={s.illustrationWrap}>
          <CaregiverIllustration/>
          <Text style={s.appName}>AlzApp</Text>
        </View>

        {/* Inputs */}
        <View style={s.inputRow}>
          <PersonIcon/>
          <TextInput
            style={s.input}
            placeholder="Username or Email"
            placeholderTextColor="#9E9E9E"
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
            placeholderTextColor="#9E9E9E"
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

        {/* Social login (placeholder) */}
        <View style={s.socialRow}>
          {['G', 'f', ''].map((label, i) => (
            <TouchableOpacity
              key={i}
              style={s.socialBtn}
              onPress={() => Alert.alert('Coming soon', 'Social login will be available in a future update.')}
              activeOpacity={0.8}>
              <Text style={[s.socialLabel, i === 0 && {color:'#EA4335'}, i === 1 && {color:'#1877F2'}]}>
                {label || ''}
              </Text>
              {i === 2 && (
                <Svg width={20} height={20} viewBox="0 0 24 24">
                  <Path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701" fill="#000"/>
                </Svg>
              )}
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
  container: {flexGrow: 1, alignItems: 'center', paddingHorizontal: 28, paddingTop: 60, paddingBottom: 40},

  illustrationWrap: {alignItems: 'center', marginBottom: 32},
  appName:          {fontSize: 18, fontWeight: '600', color: '#333333', marginTop: 12},

  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.cardBackground,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginBottom: 12,
    width: '100%',
    gap: 10,
  },
  input: {flex: 1, fontSize: 15, color: '#000', padding: 0},

  forgotWrap: {alignSelf: 'flex-end', marginBottom: 20},
  forgotText: {fontSize: 13, color: Colors.primary},

  loginBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 28,
    paddingVertical: 16,
    width: '100%',
    alignItems: 'center',
    marginBottom: 20,
  },
  btnDisabled:  {opacity: 0.6},
  loginBtnText: {color: '#FFFFFF', fontSize: 16, fontWeight: '800', letterSpacing: 1.5},

  signupRow:     {flexDirection: 'row', alignItems: 'center', marginBottom: 24},
  signupText:    {fontSize: 14, color: '#555555'},
  signupPill:    {backgroundColor: '#EDE9FF', borderRadius: 16, paddingHorizontal: 14, paddingVertical: 6},
  signupPillText:{fontSize: 13, fontWeight: '700', color: Colors.primary},

  dividerRow: {flexDirection: 'row', alignItems: 'center', width: '100%', marginBottom: 20, gap: 10},
  dividerLine:{flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: '#CCCCCC'},
  dividerText:{fontSize: 13, color: '#9E9E9E'},

  socialRow:   {flexDirection: 'row', gap: 20},
  socialBtn: {
    width: 50, height: 50, borderRadius: 25,
    backgroundColor: '#F5F5F5',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: {width:0,height:1}, shadowOpacity:0.1, shadowRadius:3, elevation:2,
  },
  socialLabel: {fontSize: 18, fontWeight: '700'},
});

export default LoginScreen;
