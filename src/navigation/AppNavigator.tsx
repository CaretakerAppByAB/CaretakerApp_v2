/**
 * AppNavigator.tsx
 * Place at: src/navigation/AppNavigator.tsx
 *
 * Architecture:
 *   Tab.Navigator (all main screens + hidden screens)
 *   ├── Home       → HomeScreen (headerShown: false, custom header)
 *   ├── Journal    → JournalScreen
 *   ├── Community  → CommunityForumScreen
 *   ├── Support    → ResourceLibraryScreen
 *   ├── Messages   → MessagesNavigator (nested Stack for inbox → chat)
 *   │   ├── Inbox  → PrivateMessagesScreen (headerShown: false)
 *   │   └── Chat   → ChatScreen (headerShown: false)
 *   └── Mood       → MoodScreen (hidden tab, headerShown: false)
 *
 * The custom tab bar skips any screen not in TAB_CONFIG (Mood).
 * MessagesNavigator is a nested Stack so Chat gets proper back navigation
 * while the bottom tab bar stays visible throughout.
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import {createBottomTabNavigator}  from '@react-navigation/bottom-tabs';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import type {BottomTabBarProps}    from '@react-navigation/bottom-tabs';

import HomeScreen             from '../screens/HomeScreen';
import JournalScreen          from '../screens/JournalScreen';
import CommunityForumScreen   from '../screens/CommunityForumScreen';
import ResourceLibraryScreen  from '../screens/ResourceLibraryScreen';
import PrivateMessagesScreen  from '../screens/PrivateMessagesScreen';
import ChatScreen             from '../screens/ChatScreen';
import MoodScreen             from '../screens/MoodScreen';

import {
  HomeIcon,
  JournalIcon,
  CommunityIcon,
  SupportIcon,
  MessagesIcon,
} from '../components/icons/TabIcons';

// ── Navigators ─────────────────────────────────────────────────────────────────

const Tab      = createBottomTabNavigator();
const MsgStack = createNativeStackNavigator();

// Nested Stack inside the Messages tab — enables inbox → chat navigation
// with proper back button and persistent tab bar.
function MessagesNavigator() {
  return (
    <MsgStack.Navigator screenOptions={{headerShown: false}}>
      <MsgStack.Screen name="Inbox" component={PrivateMessagesScreen}/>
      <MsgStack.Screen name="Chat"  component={ChatScreen}/>
    </MsgStack.Navigator>
  );
}

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
        const config = TAB_CONFIG.find(c => c.name === route.name);
        if (!config) return null; // skips Mood (not in TAB_CONFIG)

        const isFocused = state.index === index;
        const color = isFocused ? '#000000' : '#7E7E7E';
        const {Icon, label} = config;

        return (
          <TouchableOpacity
            key={route.key}
            style={tabStyles.tab}
            activeOpacity={0.7}
            onPress={() => navigation.navigate(route.name)}>
            <Icon color={color} size={22}/>
            <Text style={[tabStyles.label, {color}]}>{label}</Text>
            {isFocused && <View style={tabStyles.indicator}/>}
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
  tab:       {flex: 1, alignItems: 'center', gap: 3},
  label:     {fontSize: 10, fontWeight: '700', marginTop: 1},
  indicator: {
    width: 16,
    height: 2,
    backgroundColor: '#000000',
    borderRadius: 2,
    marginTop: 2,
  },
});

// ── Root navigator ─────────────────────────────────────────────────────────────

export default function AppNavigator() {
  return (
    <Tab.Navigator
      tabBar={(props: BottomTabBarProps) => <CustomTabBar {...props}/>}
      screenOptions={{
        headerStyle:      {backgroundColor: '#8B7EEE'},
        headerTintColor:  '#FFFFFF',
        headerTitleStyle: {fontWeight: 'bold', fontSize: 18},
      }}>

      {/* ── Visible tabs ── */}
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
      {/* Messages tab uses a nested Stack for inbox → chat navigation */}
      <Tab.Screen
        name="Messages"
        component={MessagesNavigator}
        options={{headerShown: false}}
      />

      {/* ── Hidden tabs (not in TAB_CONFIG, skipped by tab bar) ── */}
      <Tab.Screen
        name="Mood"
        component={MoodScreen}
        options={{headerShown: false}}
      />
    </Tab.Navigator>
  );
}
