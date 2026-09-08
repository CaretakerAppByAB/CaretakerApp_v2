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
import SupportActionScreen      from '../screens/SupportActionScreen';
import CreateSupportRequestScreen        from '../screens/CreateSupportRequestScreen';
import SupportRequestConfirmationScreen  from '../screens/SupportRequestConfirmationScreen';
import SubmittedRequestsScreen           from '../screens/SubmittedRequestsScreen';
import PrivateMessagesScreen    from '../screens/PrivateMessagesScreen';
import ChatScreen               from '../screens/ChatScreen';
import MoodScreen               from '../screens/MoodScreen';
import GratitudePortalScreen    from '../screens/GratitudePortalScreen';
import ThankYouNoteScreen       from '../screens/ThankYouNoteScreen';
import ProfileScreen            from '../screens/ProfileScreen';
import EditProfileScreen        from '../screens/EditProfileScreen';

import {HomeIcon, JournalIcon, CommunityIcon, SupportIcon, MessagesIcon} from '../components/icons/TabIcons';
import {Colors} from '../theme/colors';

// Every screen renders its own <ScreenHeader>, so every navigator here is headerless.
const NO_HEADER = {headerShown: false};

// ── Nested stack navigators ────────────────────────────────────────────────────

const Tab        = createBottomTabNavigator();
const JrnStack   = createNativeStackNavigator();
const MsgStack   = createNativeStackNavigator();
const GrtStack   = createNativeStackNavigator();
const PrfStack   = createNativeStackNavigator();
const SupStack   = createNativeStackNavigator();

function JournalNavigator() {
  return (
    <JrnStack.Navigator screenOptions={NO_HEADER}>
      <JrnStack.Screen name="JournalHome"       component={JournalScreen}/>
      <JrnStack.Screen name="JournalTypeSelect" component={JournalTypeSelectScreen}/>
      <JrnStack.Screen name="JournalEntry"      component={JournalEntryScreen}/>
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

function SupportNavigator() {
  return (
    <SupStack.Navigator screenOptions={{headerShown: false}}>
      <SupStack.Screen name="SupportHome"        component={SupportActionScreen}/>
      <SupStack.Screen name="CreateRequest"      component={CreateSupportRequestScreen}/>
      <SupStack.Screen name="RequestConfirmation" component={SupportRequestConfirmationScreen}/>
      <SupStack.Screen name="SubmittedRequests"  component={SubmittedRequestsScreen}/>
      <SupStack.Screen name="ResourceLibrary"    component={ResourceLibraryScreen}/>
    </SupStack.Navigator>
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
        const color = isFocused ? Colors.primary : Colors.tabInactive;
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
  indicator: {width: 16, height: 2, backgroundColor: Colors.primary, borderRadius: 2, marginTop: 2},
});

// ── Root navigator ─────────────────────────────────────────────────────────────

export default function AppNavigator() {
  return (
    <Tab.Navigator
      tabBar={(props: BottomTabBarProps) => <CustomTabBar {...props}/>}
      screenOptions={NO_HEADER}>

      <Tab.Screen name="Home"      component={HomeScreen}/>
      <Tab.Screen name="Journal"   component={JournalNavigator}/>
      <Tab.Screen name="Community" component={CommunityForumScreen}/>
      <Tab.Screen name="Support"   component={SupportNavigator}/>
      <Tab.Screen name="Messages"  component={MessagesNavigator}/>

      {/* Hidden tabs */}
      <Tab.Screen name="Mood"      component={MoodScreen}/>
      <Tab.Screen name="Gratitude" component={GratitudeNavigator}/>
      <Tab.Screen name="Profile"   component={ProfileNavigator}/>
    </Tab.Navigator>
  );
}
