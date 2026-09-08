/**
 * SupportRequestConfirmationScreen.tsx — shown right after a support request
 * is sent (or edited). Lets the caregiver manage the request they just posted.
 */

import React, {useState} from 'react';
import {View, Text, TouchableOpacity, StyleSheet, Switch, Alert} from 'react-native';
import Svg, {Path} from 'react-native-svg';
import ScreenHeader from '../components/ScreenHeader';
import {Colors} from '../theme/colors';
import {setExpandedReach, deleteSupportRequest, SupportRequest} from '../services/supportService';

const HeartIcon = () => (
  <Svg width={40} height={40} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
      fill={Colors.primary}
    />
  </Svg>
);

const ChevronRight = () => (
  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
    <Path d="M9 18l6-6-6-6" stroke="#999999" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

const TrashIcon = () => (
  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
    <Path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0l-1 14a2 2 0 01-2 2H7a2 2 0 01-2-2L4 6h16z"
      stroke={Colors.error} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

const SCOPE_TEXT: Record<SupportRequest['scope'], string> = {
  circle: 'been sent to your circle',
  local:  'been shared with your local community',
  public: 'been posted to the public AlzApp community',
};

const SupportRequestConfirmationScreen: React.FC<{navigation: any; route: any}> = ({navigation, route}) => {
  const initialRequest: SupportRequest = route?.params?.request;
  const [request, setRequest] = useState(initialRequest);
  const [updatingReach, setUpdatingReach] = useState(false);

  const handleToggleReach = async (value: boolean) => {
    setRequest(prev => ({...prev, expandedReach: value}));
    setUpdatingReach(true);
    try {
      await setExpandedReach(request.id, value);
    } catch {
      setRequest(prev => ({...prev, expandedReach: !value}));
      Alert.alert('Error', 'Could not update reach. Check your connection.');
    } finally {
      setUpdatingReach(false);
    }
  };

  const handleEdit = () => {
    navigation.navigate('CreateRequest', {editRequest: request});
  };

  const handleRemove = () => {
    Alert.alert(
      'Remove Request',
      'This will delete your support request. This can\'t be undone.',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Remove', style: 'destructive',
          onPress: async () => {
            try {
              await deleteSupportRequest(request.id);
              navigation.navigate('Home');
            } catch {
              Alert.alert('Error', 'Could not remove your request. Check your connection.');
            }
          },
        },
      ],
    );
  };

  return (
    <View style={s.screen}>
      <ScreenHeader title="Request Sent" onBack={() => navigation.navigate('SupportHome')}/>
      <View style={s.body}>
        <View style={s.iconCircle}>
          <HeartIcon/>
        </View>
        <Text style={s.title}>Request Sent!</Text>
        <Text style={s.subtitle}>
          Your request for support has {SCOPE_TEXT[request.scope]}.{'\n\n'}
          Check your messages for support from your community.
        </Text>

        <Text style={s.sectionLabel}>Other Actions</Text>
        <View style={s.listCard}>
          <TouchableOpacity style={s.listRow} onPress={handleEdit} activeOpacity={0.7}>
            <Text style={s.listLabel}>Edit post</Text>
            <ChevronRight/>
          </TouchableOpacity>
          <View style={s.divider}/>

          <View style={s.listRow}>
            <Text style={s.listLabel}>Expand post reach after two hours</Text>
            <Switch
              value={request.expandedReach}
              onValueChange={handleToggleReach}
              disabled={updatingReach}
              trackColor={{false: '#E0E0E0', true: Colors.primaryMedium}}
              thumbColor={Colors.white}
            />
          </View>
          <View style={s.divider}/>

          <TouchableOpacity style={s.listRow} onPress={handleRemove} activeOpacity={0.7}>
            <Text style={[s.listLabel, {color: Colors.error}]}>Remove post</Text>
            <TrashIcon/>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={s.homeBtn}
          onPress={() => navigation.navigate('Home')}
          activeOpacity={0.85}>
          <Text style={s.homeBtnText}>Return to Homepage</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const s = StyleSheet.create({
  screen: {flex: 1, backgroundColor: Colors.white},
  body:   {flex: 1, paddingHorizontal: 24, paddingTop: 24},

  iconCircle: {
    width: 88, height: 88, borderRadius: 44,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center', justifyContent: 'center',
    alignSelf: 'center', marginBottom: 20,
  },
  title:    {fontSize: 22, fontWeight: '800', color: Colors.primary, textAlign: 'center', marginBottom: 10},
  subtitle: {fontSize: 14, color: Colors.textSecondary, textAlign: 'center', lineHeight: 21, marginBottom: 32},

  sectionLabel: {fontSize: 14, fontWeight: '700', color: Colors.text, marginBottom: 10},
  listCard: {
    backgroundColor: Colors.white,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#DDDDDD',
    marginBottom: 28,
    overflow: 'hidden',
  },
  listRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 15,
  },
  listLabel: {fontSize: 14, fontWeight: '500', color: Colors.text, flexShrink: 1, marginRight: 12},
  divider: {height: StyleSheet.hairlineWidth, backgroundColor: '#E5E5E5'},

  homeBtn: {
    backgroundColor: Colors.primary, borderRadius: 20,
    paddingVertical: 16, alignItems: 'center',
  },
  homeBtnText: {color: Colors.white, fontSize: 15, fontWeight: '700'},
});

export default SupportRequestConfirmationScreen;
