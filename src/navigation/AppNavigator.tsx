/**
 * AppNavigator.tsx
 * Updated: Profile is a hidden tab with its own stack (Profile + EditProfile).
 * HomeScreen's profile circle navigates to the Profile tab.
 */

import React from 'react';
import {View, Text, TouchableOpacity, StyleSheet, Platform} from 'react-native';
import {createBottomTabNavigator}   from '@react-navigation/bottom-tabs';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import type {BottomTabBarProps}     from '@react-navigation/bottom-tabs';

import HomeScreen               from '../screens/HomeScreen';
import JournalScreen            from '../screens/JournalScreen';
import JournalTypeSelectScreen  from '../screens/JournalTypeSelectScreen';
import JournalEntryScreen       from '../screens/JournalEntryScreen';
import CommunityForumScreen     from '../screens/CommunityForumScreen';
import ResourceLibraryScreen    from '../screens/ResourceLibraryScreen';
import PrivateMessagesScreen    from '../screens/PrivateMessagesScreen';
import ChatScreen               from '../screens/ChatScreen';
import MoodScreen               from '../screens/MoodScreen';
import GratitudePortalScreen    from '../screens/GratitudePortalScreen';
import ThankYouNoteScreen       from '../screens/ThankYouNoteScreen';
import ProfileScreen            from '../screens/ProfileScreen';
import EditProfileScreen        from '../screens/EditProfileScreen';

import {HomeIcon, JournalIcon, CommunityIcon, SupportIcon, MessagesIcon} from '../components/icons/TabIcons';

// ── Shared header style ────────────────────────────────────────────────────────

const HEADER_OPTS = {
  headerStyle:      {backgroundColor: '#8B7EEE'},
  headerTintColor:  '#FFFFFF',
  headerTitleStyle: {fontWeight: 'bold' as const, fontSize: 18},
  headerBackTitle:  '',
};

// ── Nested stack navigators ────────────────────────────────────────────────────

const Tab        = createBottomTabNavigator();
const JrnStack   = createNativeStackNavigator();
const MsgStack   = createNativeStackNavigator();
const GrtStack   = createNativeStackNavigator();
const PrfStack   = createNativeStackNavigator();

function JournalNavigator() {
  return (
    <JrnStack.Navigator screenOptions={HEADER_OPTS}>
      <JrnStack.Screen name="JournalHome"       component={JournalScreen}           options={{title: 'Journal'}}/>
      <JrnStack.Screen name="JournalTypeSelect" component={JournalTypeSelectScreen} options={{title: 'Journal'}}/>
      <JrnStack.Screen name="JournalEntry"      component={JournalEntryScreen}      options={{title: 'Journal'}}/>
    </JrnStack.Navigator>
  );
}

function MessagesNavigator() {
  return (
    <MsgStack.Navigator screenOptions={{headerShown: false}}>
      <MsgStack.Screen name="Inbox" component={PrivateMessagesScreen}/>
      <MsgStack.Screen name="Chat"  component={ChatScreen}/>
    </MsgStack.Navigator>
  );
}

function GratitudeNavigator() {
  return (
    <GrtStack.Navigator screenOptions={{headerShown: false}}>
      <GrtStack.Screen name="GratitudePortal" component={GratitudePortalScreen}/>
      <GrtStack.Screen name="ThankYouNote"    component={ThankYouNoteScreen}/>
    </GrtStack.Navigator>
  );
}

/** Profile stack — hidden tab, navigated to from HomeScreen's profile circle */
function ProfileNavigator() {
  return (
    <PrfStack.Navigator screenOptions={{headerShown: false}}>
      <PrfStack.Screen name="ProfileMain"       component={ProfileScreen}/>
      <PrfStack.Screen name="EditProfile"       component={EditProfileScreen}/>
      <PrfStack.Screen
        name="NotificationSettings"
        component={require('../screens/NotificationSettingsScreen').default}
      />
    </PrfStack.Navigator>
  );
}

// ── Custom bottom tab bar ──────────────────────────────────────────────────────

const TAB_CONFIG = [
  {name: 'Home',      label: 'Home',      Icon: HomeIcon},
  {name: 'Journal',   label: 'Journal',   Icon: JournalIcon},
  {name: 'Community', label: 'Community', Icon: CommunityIcon},
  {name: 'Support',   label: 'Support',   Icon: SupportIcon},
  {name: 'Messages',  label: 'Messages',  Icon: MessagesIcon},
];

function CustomTabBar({state, navigation}: BottomTabBarProps) {
  return (
    <View style={t.container}>
      {state.routes.map((route, index) => {
        const config = TAB_CONFIG.find(c => c.name === route.name);
        if (!config) return null;
        const isFocused = state.index === index;
        const color = isFocused ? '#000000' : '#7E7E7E';
        const {Icon, label} = config;
        return (
          <TouchableOpacity
            key={route.key}
            style={t.tab}
            activeOpacity={0.7}
            onPress={() => navigation.navigate(route.name)}>
            <Icon color={color} size={22}/>
            <Text style={[t.label, {color}]}>{label}</Text>
            {isFocused && <View style={t.indicator}/>}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const t = StyleSheet.create({
  container: {
    flexDirection: 'row', backgroundColor: '#FFFFFF',
    borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: 'rgba(0,0,0,0.1)',
    paddingTop: 6, paddingBottom: Platform.OS === 'ios' ? 24 : 10,
    shadowColor: '#000', shadowOffset: {width:0,height:-1}, shadowOpacity:0.06, shadowRadius:4, elevation:8,
  },
  tab:       {flex: 1, alignItems: 'center', gap: 3},
  label:     {fontSize: 10, fontWeight: '700', marginTop: 1},
  indicator: {width: 16, height: 2, backgroundColor: '#000', borderRadius: 2, marginTop: 2},
});

// ── Root navigator ─────────────────────────────────────────────────────────────

export default function AppNavigator() {
  return (
    <Tab.Navigator
      tabBar={(props: BottomTabBarProps) => <CustomTabBar {...props}/>}
      screenOptions={HEADER_OPTS}>

      <Tab.Screen name="Home"      component={HomeScreen}            options={{headerShown: false}}/>
      <Tab.Screen name="Journal"   component={JournalNavigator}      options={{headerShown: false}}/>
      <Tab.Screen name="Community" component={CommunityForumScreen}  options={{title: 'Community'}}/>
      <Tab.Screen name="Support"   component={ResourceLibraryScreen} options={{title: 'Support'}}/>
      <Tab.Screen name="Messages"  component={MessagesNavigator}     options={{headerShown: false}}/>

      {/* Hidden tabs */}
      <Tab.Screen name="Mood"      component={MoodScreen}            options={{headerShown: false}}/>
      <Tab.Screen name="Gratitude" component={GratitudeNavigator}    options={{headerShown: false}}/>
      <Tab.Screen name="Profile"   component={ProfileNavigator}      options={{headerShown: false}}/>
    </Tab.Navigator>
  );
}
