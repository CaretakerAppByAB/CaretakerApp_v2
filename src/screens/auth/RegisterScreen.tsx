import React, {useState} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import {useAuth} from '../../context/AuthContext';
import {Colors} from '../../theme/colors';

const RegisterScreen = ({navigation}: any) => {
  const {register} = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || !password || !confirmPassword) {
      Alert.alert('Missing Info', 'Please fill in all fields.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Weak Password', 'Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Password Mismatch', 'Passwords do not match.');
      return;
    }

    setLoading(true);
    const {success, error} = await register(name, email.trim(), password);
    setLoading(false);

    if (!success) {
      Alert.alert('Registration Failed', error);
    }
    // On success, AuthContext user is set → Navigator switches automatically
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled">

        {/* Brand mark */}
        <View style={styles.brand}>
          <Text style={styles.brandIcon}>🧠</Text>
          <Text style={styles.brandName}>AlzApp</Text>
          <Text style={styles.brandTagline}>Join Our Community</Text>
        </View>

        {/* Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Create Account</Text>

          {[
            {
              label: 'Full Name',
              value: name,
              setter: setName,
              placeholder: 'Jane Smith',
              type: 'default' as const,
            },
            {
              label: 'Email',
              value: email,
              setter: setEmail,
              placeholder: 'your@email.com',
              type: 'email-address' as const,
            },
            {
              label: 'Password',
              value: password,
              setter: setPassword,
              placeholder: '••••••••',
              type: 'default' as const,
              secure: true,
            },
            {
              label: 'Confirm Password',
              value: confirmPassword,
              setter: setConfirmPassword,
              placeholder: '••••••••',
              type: 'default' as const,
              secure: true,
            },
          ].map(field => (
            <View key={field.label} style={styles.inputGroup}>
              <Text style={styles.label}>{field.label}</Text>
              <TextInput
                style={styles.input}
                placeholder={field.placeholder}
                placeholderTextColor={Colors.textSecondary}
                value={field.value}
                onChangeText={field.setter}
                keyboardType={field.type}
                autoCapitalize={
                  field.label === 'Full Name' ? 'words' : 'none'
                }
                autoCorrect={false}
                secureTextEntry={!!field.secure}
                returnKeyType="next"
              />
            </View>
          ))}

          <TouchableOpacity
            style={[styles.primaryBtn, loading && styles.primaryBtnDisabled]}
            onPress={handleRegister}
            disabled={loading}
            activeOpacity={0.85}>
            {loading ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <Text style={styles.primaryBtnText}>Create Account</Text>
            )}
          </TouchableOpacity>

          <View style={styles.divider} />

          <View style={styles.row}>
            <Text style={styles.secondaryText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Text style={styles.link}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  flex: {flex: 1, backgroundColor: Colors.backgroundLight},
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 48,
  },
  brand: {alignItems: 'center', marginBottom: 30},
  brandIcon: {fontSize: 48, marginBottom: 8},
  brandName: {
    fontSize: 34,
    fontWeight: '800',
    color: Colors.primary,
    letterSpacing: -1,
  },
  brandTagline: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 4,
    fontWeight: '500',
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: 24,
    padding: 28,
    shadowColor: Colors.primary,
    shadowOffset: {width: 0, height: 6},
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 20,
    textAlign: 'center',
  },
  inputGroup: {marginBottom: 14},
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 15,
    color: Colors.text,
    backgroundColor: Colors.backgroundLight,
  },
  primaryBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 6,
    shadowColor: Colors.primary,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryBtnDisabled: {opacity: 0.6},
  primaryBtnText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  divider: {height: 1, backgroundColor: Colors.border, marginVertical: 20},
  row: {flexDirection: 'row', justifyContent: 'center'},
  secondaryText: {color: Colors.textSecondary, fontSize: 14},
  link: {color: Colors.primary, fontSize: 14, fontWeight: '700'},
});

export default RegisterScreen;
