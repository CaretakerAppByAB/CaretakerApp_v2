/**
 * AppNavigator.tsx
 * Place at: src/navigation/AppNavigator.tsx
 *
 * Architecture:
 *   Root Stack
 *   ├── MainTabs  (Tab.Navigator with custom bottom tab bar)
 *   │   ├── Home       → HomeScreen      (headerShown: false, has own header)
 *   │   ├── Journal    → JournalScreen
 *   │   ├── Community  → CommunityForumScreen
 *   │   ├── Support    → ResourceLibraryScreen
 *   │   └── Messages   → PrivateMessagesScreen
 *   └── Mood           → MoodScreen  (pushed on top, has back button)
 *
 * The Mood screen lives in the root stack so it can be navigated to
 * from the Home grid without appearing as a tab.
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import type {BottomTabBarProps} from '@react-navigation/bottom-tabs';

import HomeScreen from '../screens/HomeScreen';
import JournalScreen from '../screens/JournalScreen';
import CommunityForumScreen from '../screens/CommunityForumScreen';
import ResourceLibraryScreen from '../screens/ResourceLibraryScreen';
import PrivateMessagesScreen from '../screens/PrivateMessagesScreen';
import MoodScreen from '../screens/MoodScreen';

import {
  HomeIcon,
  JournalIcon,
  CommunityIcon,
  SupportIcon,
  MessagesIcon,
} from '../components/icons/TabIcons';

// ── Navigators ─────────────────────────────────────────────────────────────────

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// ── Tab bar config ─────────────────────────────────────────────────────────────

const TAB_CONFIG = [
  {name: 'Home',      label: 'Home',      Icon: HomeIcon},
  {name: 'Journal',   label: 'Journal',   Icon: JournalIcon},
  {name: 'Community', label: 'Community', Icon: CommunityIcon},
  {name: 'Support',   label: 'Support',   Icon: SupportIcon},
  {name: 'Messages',  label: 'Messages',  Icon: MessagesIcon},
];

// ── Custom tab bar ─────────────────────────────────────────────────────────────

function CustomTabBar({state, navigation}: BottomTabBarProps) {
  return (
    <View style={tabStyles.container}>
      {state.routes.map((route, index) => {
        const isFocused = state.index === index;
        const config = TAB_CONFIG.find(c => c.name === route.name);
        if (!config) return null;

        const color = isFocused ? '#000000' : '#7E7E7E';
        const {Icon, label} = config;

        return (
          <TouchableOpacity
            key={route.key}
            style={tabStyles.tab}
            activeOpacity={0.7}
            onPress={() => navigation.navigate(route.name)}>
            <Icon color={color} size={22} />
            <Text style={[tabStyles.label, {color}]}>{label}</Text>
            {isFocused && <View style={tabStyles.indicator} />}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const tabStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(0,0,0,0.1)',
    paddingTop: 6,
    paddingBottom: Platform.OS === 'ios' ? 24 : 10,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: -1},
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 8,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    gap: 3,
  },
  label: {
    fontSize: 10,
    fontWeight: '700',
    marginTop: 1,
  },
  indicator: {
    width: 16,
    height: 2,
    backgroundColor: '#000000',
    borderRadius: 2,
    marginTop: 2,
  },
});

// ── Main tabs ──────────────────────────────────────────────────────────────────

function MainTabs() {
  return (
    <Tab.Navigator
      tabBar={(props: BottomTabBarProps) => <CustomTabBar {...props} />}
      screenOptions={{
        headerStyle: {backgroundColor: '#8B7EEE'},
        headerTintColor: '#FFFFFF',
        headerTitleStyle: {fontWeight: 'bold', fontSize: 18},
      }}>
      {/* headerShown: false — HomeScreen has its own custom header */}
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{headerShown: false}}
      />
      <Tab.Screen
        name="Journal"
        component={JournalScreen}
        options={{title: 'Journal'}}
      />
      <Tab.Screen
        name="Community"
        component={CommunityForumScreen}
        options={{title: 'Community'}}
      />
      <Tab.Screen
        name="Support"
        component={ResourceLibraryScreen}
        options={{title: 'Support'}}
      />
      <Tab.Screen
        name="Messages"
        component={PrivateMessagesScreen}
        options={{title: 'Messages'}}
      />
    </Tab.Navigator>
  );
}

// ── Root navigator ─────────────────────────────────────────────────────────────

export default function AppNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {backgroundColor: '#8B7EEE'},
        headerTintColor: '#FFFFFF',
        headerTitleStyle: {fontWeight: 'bold', fontSize: 18},
        headerBackTitle: '',
      }}>
      {/* Tab screens — tab bar visible */}
      <Stack.Screen
        name="MainTabs"
        component={MainTabs}
        options={{headerShown: false}}
      />
      {/* Mood — pushed on top of tabs, back button returns to Home */}
      <Stack.Screen
        name="Mood"
        component={MoodScreen}
        options={{title: 'Mood Tracker'}}
      />
    </Stack.Navigator>
  );
}
