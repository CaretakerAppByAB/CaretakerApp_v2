/**
 * src/screens/auth/RegisterScreen.tsx — redesigned to match latest Figma export
 */

import React, {useState} from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, Image,
} from 'react-native';
import Svg, {Path, Circle} from 'react-native-svg';
import {useAuth} from '../../context/AuthContext';
import {Colors} from '../../theme/colors';

const BackIcon = () => (
  <Svg width={22} height={20} viewBox="0 0 22 20" fill="none">
    <Path d="M21 10H1M1 10L10 1M1 10l9 9" stroke={Colors.primary} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

const PersonIcon = () => (
  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
    <Path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" stroke="#2D3E2B" strokeWidth={1.8} strokeLinecap="round"/>
    <Circle cx={12} cy={7} r={4} stroke="#2D3E2B" strokeWidth={1.8}/>
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
    <KeyboardAvoidingView style={s.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={s.container} keyboardShouldPersistTaps="handled">

        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()} hitSlop={12}>
          <BackIcon/>
        </TouchableOpacity>

        <Text style={s.title}>Create Account</Text>
        <Text style={s.subtitle}>Join AlzApp:</Text>

        <View style={s.form}>
          <View style={s.inputRow}>
            <View style={s.iconAvatar}>
              <PersonIcon/>
            </View>
            <TextInput
              style={s.input}
              placeholder="Full Name"
              placeholderTextColor="#2D3E2B"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
            />
          </View>

          <View style={s.inputRow}>
            <View style={s.iconAvatar}>
              <Image source={require('../../../images/icon-email.png')} style={s.iconImage} resizeMode="contain"/>
            </View>
            <TextInput
              style={s.input}
              placeholder="Email"
              placeholderTextColor="#2D3E2B"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>

          <View style={s.inputRow}>
            <View style={s.iconAvatar}>
              <Image source={require('../../../images/icon-lock.png')} style={s.iconImage} resizeMode="contain"/>
            </View>
            <TextInput
              style={s.input}
              placeholder="Password"
              placeholderTextColor="#2D3E2B"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>

          <View style={s.inputRow}>
            <View style={s.iconAvatar}>
              <Image source={require('../../../images/icon-lock.png')} style={s.iconImage} resizeMode="contain"/>
            </View>
            <TextInput
              style={s.input}
              placeholder="Confirm Password"
              placeholderTextColor="#2D3E2B"
              value={confirm}
              onChangeText={setConfirm}
              secureTextEntry
              returnKeyType="done"
              onSubmitEditing={handleRegister}
            />
          </View>
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
  );
};

const s = StyleSheet.create({
  flex:      {flex: 1, backgroundColor: '#FFFFFF'},
  container: {flexGrow: 1, paddingHorizontal: 24, paddingTop: 60, paddingBottom: 40},

  backBtn: {alignSelf: 'flex-start', marginBottom: 24, padding: 4},

  title:    {fontSize: 24, fontWeight: '500', color: '#000000', marginBottom: 8},
  subtitle: {fontSize: 16, fontWeight: '400', color: '#000000', marginBottom: 24},

  form: {marginBottom: 4},
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(211, 200, 245, 0.26)',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 10,
    marginBottom: 14,
    gap: 12,
  },
  iconAvatar: {
    width: 33, height: 33, borderRadius: 16.5,
    backgroundColor: '#D3C9F5',
    alignItems: 'center', justifyContent: 'center',
  },
  iconImage: {width: 18, height: 18},
  input: {flex: 1, fontSize: 15, fontWeight: '600', color: '#2D3E2B', padding: 0},

  termsText: {
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '500',
    color: '#000000',
    lineHeight: 18,
    marginVertical: 16,
  },

  continueBtn: {
    backgroundColor: '#1F102B',
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 20,
  },
  btnDisabled:     {opacity: 0.6},
  continueBtnText: {color: Colors.white, fontSize: 14, fontWeight: '500', letterSpacing: 1.2},

  orText: {textAlign: 'center', fontSize: 12, fontWeight: '500', color: '#000000', marginBottom: 14},

  phoneBtn: {
    backgroundColor: '#CFBCE3',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 24,
  },
  phoneBtnText: {color: '#000000', fontSize: 14, fontWeight: '500', letterSpacing: 0.8},

  loginRow:     {flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start'},
  loginText:    {fontSize: 12, fontWeight: '400', color: '#000000'},
  loginPill:    {backgroundColor: 'rgba(211, 200, 245, 0.26)', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 6},
  loginPillText:{fontSize: 13, fontWeight: '600', color: '#A18CE6'},
});

export default RegisterScreen;
