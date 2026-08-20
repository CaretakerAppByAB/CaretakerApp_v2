/**
 * src/screens/NotificationSettingsScreen.tsx
 * Toggle notification preferences — saved to Firestore.
 * NOTE: Actual push notifications require Firebase Cloud Messaging (FCM) setup.
 * See: https://rnfirebase.io/messaging/usage
 */

import React, {useState} from 'react';
import {View, Text, Switch, StyleSheet, SafeAreaView, TouchableOpacity, Alert} from 'react-native';
import {useAuth} from '../context/AuthContext';
import {updateUserProfile} from '../services/userService';

const Row: React.FC<{title: string; sub: string; value: boolean; onChange: (v: boolean) => void}> =
  ({title, sub, value, onChange}) => (
  <View style={ns.row}>
    <View style={{flex: 1}}>
      <Text style={ns.rowTitle}>{title}</Text>
      <Text style={ns.rowSub}>{sub}</Text>
    </View>
    <Switch
      value={value}
      onValueChange={onChange}
      trackColor={{false: '#E8E8E8', true: '#8B7EEE'}}
      thumbColor="#FFFFFF"
    />
  </View>
);

const NotificationSettingsScreen: React.FC<{navigation: any}> = ({navigation}) => {
  const {user, refreshUser} = useAuth();

  const [master,    setMaster]    = useState(user?.notificationsEnabled ?? false);
  const [messages,  setMessages]  = useState(true);
  const [community, setCommunity] = useState(true);
  const [mood,      setMood]      = useState(true);

  const handleSave = async () => {
    if (!user) return;
    try {
      await updateUserProfile(user.uid, {notificationsEnabled: master});
      await refreshUser();
      navigation.goBack();
    } catch {
      Alert.alert('Error', 'Could not save notification settings.');
    }
  };

  return (
    <SafeAreaView style={ns.safe}>
      <View style={ns.container}>
        <Text style={ns.hint}>
          Notification preferences are saved to your profile.
          {'\n'}Full push notifications require additional setup.
        </Text>

        <View style={ns.card}>
          <Row
            title="All Notifications"
            sub="Master toggle for all alerts"
            value={master}
            onChange={setMaster}
          />
          <View style={ns.divider}/>
          <Row
            title="Messages"
            sub="New message alerts"
            value={master && messages}
            onChange={v => { setMessages(v); if (v && !master) setMaster(true); }}
          />
          <View style={ns.divider}/>
          <Row
            title="Community"
            sub="New posts and replies"
            value={master && community}
            onChange={v => { setCommunity(v); if (v && !master) setMaster(true); }}
          />
          <View style={ns.divider}/>
          <Row
            title="Mood Reminders"
            sub="Daily check-in prompts"
            value={master && mood}
            onChange={v => { setMood(v); if (v && !master) setMaster(true); }}
          />
        </View>

        <TouchableOpacity style={ns.saveBtn} onPress={handleSave} activeOpacity={0.85}>
          <Text style={ns.saveBtnText}>Save</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const ns = StyleSheet.create({
  safe:      {flex: 1, backgroundColor: '#F5F3FF'},
  container: {padding: 20},
  hint:      {fontSize: 12, color: '#9E9E9E', textAlign: 'center', lineHeight: 18, marginBottom: 20},

  card: {backgroundColor:'#FFFFFF', borderRadius:14, padding:4, shadowColor:'#000', shadowOffset:{width:0,height:1}, shadowOpacity:0.06, shadowRadius:4, elevation:2},
  row:  {flexDirection:'row', alignItems:'center', padding:14},
  rowTitle: {fontSize:15, fontWeight:'600', color:'#000'},
  rowSub:   {fontSize:12, color:'#7E7E7E', marginTop:2},
  divider:  {height:StyleSheet.hairlineWidth, backgroundColor:'#F0F0F0', marginHorizontal:14},

  saveBtn:     {backgroundColor:'#8B7EEE', borderRadius:14, paddingVertical:16, alignItems:'center', marginTop:20},
  saveBtnText: {color:'#FFFFFF', fontSize:16, fontWeight:'700'},
});

export default NotificationSettingsScreen;
