import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import {useAuth} from '../context/AuthContext';

const ProfileScreen = ({navigation}: any) => {
  const {user, logout} = useAuth();

  const email = user?.email ?? 'No email available';

  const username =
    email !== 'No email available'
      ? email.split('@')[0]
      : 'Username';

  const initials = username.slice(0, 2).toUpperCase();

  const menuItems = [
    {
      title: 'Edit Profile',
      icon: '👤',
      onPress: () => Alert.alert('Coming Soon'),
    },
    {
      title: 'Notifications',
      icon: '🔔',
      onPress: () => Alert.alert('Coming Soon'),
    },
    {
      title: 'Settings',
      icon: '⚙️',
      onPress: () => Alert.alert('Coming Soon'),
    },
    {
      title: 'Q&A',
      icon: '❓',
      onPress: () => Alert.alert('Coming Soon'),
    },
    {
      title: 'Sign Out',
      icon: '🚪',
      danger: true,
      onPress: async () => {
        try {
          await logout();
        } catch {
          Alert.alert('Error', 'Unable to sign out.');
        }
      },
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>

        <View style={styles.cover}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}>
            <Text style={styles.backText}>‹</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.coverButton}>
            <Text style={styles.coverButtonText}>
              Add Cover Page
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.profileContainer}>

          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {initials}
            </Text>
          </View>

          <Text style={styles.username}>
            {username}
          </Text>

          <Text style={styles.email}>
            {email}
          </Text>

        </View>

        <View style={styles.menuContainer}>
          {menuItems.map(item => (
            <TouchableOpacity
              key={item.title}
              style={styles.menuItem}
              onPress={item.onPress}>

              <Text style={styles.icon}>
                {item.icon}
              </Text>

              <Text
                style={[
                  styles.menuText,
                  item.danger && styles.logoutText,
                ]}>
                {item.title}
              </Text>

            </TouchableOpacity>
          ))}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
};

export default ProfileScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  cover: {
    height: 240,
    backgroundColor: '#D7CBF8',
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },

  backButton: {
    position: 'absolute',
    left: 16,
    top: 20,
  },

  backText: {
    fontSize: 36,
    color: '#7C3AED',
  },

  coverButton: {
    backgroundColor: 'rgba(255,255,255,0.35)',
    paddingHorizontal: 24,
    paddingVertical: 8,
    borderRadius: 10,
  },

  coverButtonText: {
    fontWeight: '600',
    fontSize: 15,
  },

  profileContainer: {
    alignItems: 'center',
    marginTop: -75,
  },

  avatar: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: '#F8F6FF',
    borderWidth: 1,
    borderColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },

  avatarText: {
    fontSize: 42,
    fontWeight: '700',
  },

  username: {
    marginTop: 14,
    fontSize: 20,
    fontWeight: '600',
  },

  email: {
    marginTop: 4,
    fontSize: 13,
    color: '#555',
  },

  menuContainer: {
    marginTop: 35,
    paddingHorizontal: 24,
  },

  menuItem: {
    height: 48,
    borderRadius: 10,
    backgroundColor: '#EEE9FF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },

  icon: {
    fontSize: 20,
    width: 28,
  },

  menuText: {
    marginLeft: 12,
    fontSize: 15,
    fontWeight: '600',
    color: '#222',
  },

  logoutText: {
    color: '#D45B5B',
  },
});