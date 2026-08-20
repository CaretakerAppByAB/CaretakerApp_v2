/**
 * src/screens/ProfileScreen.tsx — matches Image 3
 */

import React from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, SafeAreaView, StatusBar, Alert,
} from 'react-native';
import Svg, {Path, Circle, Bell, Settings} from 'react-native-svg';
import {useAuth} from '../context/AuthContext';

// ── Icons ──────────────────────────────────────────────────────────────────────

const MenuIcon: React.FC<{d: string}> = ({d}) => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Path d={d} stroke="#555555" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

const ChevronRight = () => (
  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
    <Path d="M9 18l6-6-6-6" stroke="#BBBBBB" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

const getInitials = (name: string) =>
  name.split(' ').map(w => w[0] ?? '').join('').slice(0, 2).toUpperCase() || '?';

// ── Menu item ──────────────────────────────────────────────────────────────────

interface MenuItemProps {
  icon:     string;
  label:    string;
  red?:     boolean;
  onPress?: () => void;
}

const MenuItem: React.FC<MenuItemProps> = ({icon, label, red, onPress}) => (
  <TouchableOpacity style={ps.menuItem} onPress={onPress} activeOpacity={0.7}>
    <View style={ps.menuLeft}>
      <MenuIcon d={icon}/>
      <Text style={[ps.menuLabel, red && ps.menuLabelRed]}>{label}</Text>
    </View>
    <ChevronRight/>
  </TouchableOpacity>
);

// ── Main screen ────────────────────────────────────────────────────────────────

const ProfileScreen: React.FC<{navigation: any}> = ({navigation}) => {
  const {user, logout} = useAuth();

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      {text: 'Cancel', style: 'cancel'},
      {text: 'Sign Out', style: 'destructive', onPress: logout},
    ]);
  };

  const MENU_ITEMS: MenuItemProps[] = [
    {
      icon: 'M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z',
      label: 'Edit Profile',
      onPress: () => navigation.navigate('EditProfile'),
    },
    {
      icon: 'M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0',
      label: 'Notifications',
      onPress: () => navigation.navigate('NotificationSettings'),
    },
    {
      icon: 'M12 20a8 8 0 100-16 8 8 0 000 16zM12 8v4M12 16h.01',
      label: 'Settings',
      onPress: () => Alert.alert('Coming soon', 'Settings will be available in a future update.'),
    },
    {
      icon: 'M9 9h6M9 12h6M9 15h6M5 3h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2z',
      label: 'Q&A',
      onPress: () => Alert.alert('Coming soon', 'Q&A will be available in a future update.'),
    },
    {
      icon: 'M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9',
      label: 'Sign Out',
      red: true,
      onPress: handleSignOut,
    },
  ];

  return (
    <SafeAreaView style={ps.safe}>
      <StatusBar barStyle="light-content" backgroundColor="#8B7EEE"/>
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* ── Cover banner ── */}
        <View style={ps.coverBanner}>
          <TouchableOpacity
            style={ps.coverBtn}
            onPress={() => Alert.alert('Coming soon', 'Cover photo upload coming in a future update.')}
            activeOpacity={0.8}>
            <Text style={ps.coverBtnText}>Add Cover Page</Text>
          </TouchableOpacity>
        </View>

        {/* ── Avatar (overlapping the banner) ── */}
        <View style={ps.avatarWrap}>
          <View style={ps.avatarCircle}>
            {user?.profilePhotoURL ? null : (
              <Text style={ps.avatarInitials}>
                {getInitials(user?.name ?? 'U')}
              </Text>
            )}
          </View>
        </View>

        {/* ── Name + email ── */}
        <View style={ps.identity}>
          <Text style={ps.displayName}>{user?.name ?? 'User'}</Text>
          {!!user?.pronouns && <Text style={ps.pronouns}>{user.pronouns}</Text>}
          <Text style={ps.email}>{user?.email ?? ''}</Text>
        </View>

        {/* ── Stats row (goals + responsibilities) ── */}
        {(user?.goals?.length || user?.responsibilities?.length) ? (
          <View style={ps.statsRow}>
            <View style={ps.statItem}>
              <Text style={ps.statNum}>{user?.goals?.length ?? 0}</Text>
              <Text style={ps.statLabel}>Goals</Text>
            </View>
            <View style={ps.statDivider}/>
            <View style={ps.statItem}>
              <Text style={ps.statNum}>{user?.responsibilities?.length ?? 0}</Text>
              <Text style={ps.statLabel}>Responsibilities</Text>
            </View>
          </View>
        ) : null}

        {/* ── Divider ── */}
        <View style={ps.sectionLine}/>

        {/* ── Menu items ── */}
        <View style={ps.menuList}>
          {MENU_ITEMS.map((item, i) => (
            <MenuItem key={i} {...item}/>
          ))}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
};

// ── Styles ─────────────────────────────────────────────────────────────────────

const AVATAR_SIZE = 86;

const ps = StyleSheet.create({
  safe:  {flex: 1, backgroundColor: '#FFFFFF'},

  coverBanner: {
    height: 150,
    backgroundColor: '#8B7EEE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  coverBtn:     {backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8},
  coverBtnText: {color: '#FFFFFF', fontSize: 13, fontWeight: '600'},

  avatarWrap:   {alignItems: 'center', marginTop: -(AVATAR_SIZE / 2)},
  avatarCircle: {
    width: AVATAR_SIZE, height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    backgroundColor: '#FFFFFF',
    borderWidth: 4, borderColor: '#FFFFFF',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: {width:0,height:2}, shadowOpacity:0.12, shadowRadius:8, elevation:4,
    overflow: 'hidden',
  },
  avatarInitials: {fontSize: 28, fontWeight: '800', color: '#8B7EEE'},

  identity:    {alignItems: 'center', paddingTop: 12, paddingBottom: 16},
  displayName: {fontSize: 20, fontWeight: '800', color: '#000000'},
  pronouns:    {fontSize: 13, color: '#8B7EEE', marginTop: 2},
  email:       {fontSize: 13, color: '#7E7E7E', marginTop: 4},

  statsRow:    {flexDirection: 'row', justifyContent: 'center', paddingBottom: 16},
  statItem:    {alignItems: 'center', paddingHorizontal: 24},
  statNum:     {fontSize: 20, fontWeight: '800', color: '#8B7EEE'},
  statLabel:   {fontSize: 12, color: '#7E7E7E', marginTop: 2},
  statDivider: {width: 1, backgroundColor: '#E8E8E8'},

  sectionLine: {height: StyleSheet.hairlineWidth, backgroundColor: '#E8E8E8', marginHorizontal: 20},

  menuList: {paddingHorizontal: 20, paddingTop: 8},
  menuItem: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#F0F0F0',
  },
  menuLeft:     {flexDirection: 'row', alignItems: 'center', gap: 14},
  menuLabel:    {fontSize: 15, fontWeight: '500', color: '#1A1A1A'},
  menuLabelRed: {color: '#E05252', fontWeight: '600'},
});

export default ProfileScreen;
