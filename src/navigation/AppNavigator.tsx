import React, {useState, useRef} from 'react';
import {
  View, Text, TouchableOpacity, Animated,
  StyleSheet, TouchableWithoutFeedback, SafeAreaView,
} from 'react-native';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import type {BottomTabBarProps} from '@react-navigation/bottom-tabs';
import {useAuth} from '../context/AuthContext';
import HomeScreen from '../screens/HomeScreen';
import MoodScreen from '../screens/MoodScreen';
import ResourceLibraryScreen from '../screens/ResourceLibraryScreen';
import JournalScreen from '../screens/JournalScreen';
import CommunityForumScreen from '../screens/CommunityForumScreen';
import PrivateMessagesScreen from '../screens/PrivateMessagesScreen';

const Tab = createBottomTabNavigator();
const DRAWER_WIDTH = 270;

const MENU_ITEMS = [
  {name: 'Home',      label: 'Home',            icon: '🏠'},
  {name: 'Mood',      label: 'Mood Tracker',     icon: '😊'},
  {name: 'Resources', label: 'Resource Library', icon: '📚'},
  {name: 'Journal',   label: 'Journal',          icon: '📓'},
  {name: 'Forum',     label: 'Community Forum',  icon: '💬'},
  {name: 'Messages',  label: 'Messages',         icon: '✉️'},
];

export default function AppNavigator() {
  const {logout} = useAuth();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const translateX = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const navRef = useRef<any>(null);

  const openDrawer = () => {
    setDrawerOpen(true);
    Animated.parallel([
      Animated.timing(translateX, {toValue: 0, duration: 260, useNativeDriver: true}),
      Animated.timing(overlayOpacity, {toValue: 0.45, duration: 260, useNativeDriver: true}),
    ]).start();
  };

  const closeDrawer = () => {
    Animated.parallel([
      Animated.timing(translateX, {toValue: -DRAWER_WIDTH, duration: 260, useNativeDriver: true}),
      Animated.timing(overlayOpacity, {toValue: 0, duration: 260, useNativeDriver: true}),
    ]).start(() => setDrawerOpen(false));
  };

  const navigate = (screenName: string) => {
    navRef.current?.navigate(screenName);
    closeDrawer();
  };

  const handleLogout = async () => {
    closeDrawer();
    await logout();
  };

  return (
    <View style={{flex: 1}}>
      <Tab.Navigator
        tabBar={(props: BottomTabBarProps) => {
          navRef.current = props.navigation;
          return null;
        }}
        screenOptions={{
          headerLeft: () => (
            <TouchableOpacity onPress={openDrawer} style={styles.hamburger}>
              <View style={styles.bar} />
              <View style={styles.bar} />
              <View style={styles.bar} />
            </TouchableOpacity>
          ),
          headerStyle: {backgroundColor: '#8B7EEE'},
          headerTintColor: '#fff',
          headerTitleStyle: {fontWeight: 'bold', fontSize: 18},
        }}
      >
        <Tab.Screen name="Home"      component={HomeScreen} />
        <Tab.Screen name="Mood"      component={MoodScreen} />
        <Tab.Screen name="Resources" component={ResourceLibraryScreen} />
        <Tab.Screen name="Journal"   component={JournalScreen} />
        <Tab.Screen name="Forum"     component={CommunityForumScreen} />
        <Tab.Screen name="Messages"  component={PrivateMessagesScreen} />
      </Tab.Navigator>

      {drawerOpen && (
        <TouchableWithoutFeedback onPress={closeDrawer}>
          <Animated.View
            style={[StyleSheet.absoluteFill, {backgroundColor: '#000', opacity: overlayOpacity}]}
          />
        </TouchableWithoutFeedback>
      )}

      <Animated.View style={[styles.drawer, {transform: [{translateX}]}]}>
        <SafeAreaView style={{flex: 1}}>
          <View style={styles.drawerHeader}>
            <Text style={styles.drawerTitle}>AlzApp</Text>
            <Text style={styles.drawerSubtitle}>Caregiver Support</Text>
          </View>

          {MENU_ITEMS.map(item => (
            <TouchableOpacity
              key={item.name}
              style={styles.drawerItem}
              onPress={() => navigate(item.name)}
            >
              <Text style={styles.itemIcon}>{item.icon}</Text>
              <Text style={styles.itemLabel}>{item.label}</Text>
            </TouchableOpacity>
          ))}

          {/* Logout button pinned to the bottom */}
          <View style={styles.logoutContainer}>
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
              <Text style={styles.logoutIcon}>🚪</Text>
              <Text style={styles.logoutLabel}>Log Out</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  hamburger: {marginLeft: 16, padding: 4, justifyContent: 'center', gap: 5},
  bar: {width: 22, height: 2.5, backgroundColor: '#fff', borderRadius: 2, marginVertical: 2},
  drawer: {
    position: 'absolute', top: 0, left: 0, bottom: 0, width: DRAWER_WIDTH,
    backgroundColor: '#fff', shadowColor: '#000', shadowOffset: {width: 3, height: 0},
    shadowOpacity: 0.2, shadowRadius: 10, elevation: 10, zIndex: 999,
  },
  drawerHeader: {
    backgroundColor: '#8B7EEE', paddingHorizontal: 24, paddingTop: 24, paddingBottom: 28,
  },
  drawerTitle: {fontSize: 28, fontWeight: 'bold', color: '#fff'},
  drawerSubtitle: {fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 4},
  drawerItem: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 16, paddingHorizontal: 24,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#EBEBEB',
  },
  itemIcon: {fontSize: 20, marginRight: 18},
  itemLabel: {fontSize: 16, color: '#333', fontWeight: '500'},
  logoutContainer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    borderTopWidth: 1, borderTopColor: '#EBEBEB',
  },
  logoutButton: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 20, paddingHorizontal: 24,
  },
  logoutIcon: {fontSize: 20, marginRight: 18},
  logoutLabel: {fontSize: 16, color: '#E05252', fontWeight: '600'},
});
