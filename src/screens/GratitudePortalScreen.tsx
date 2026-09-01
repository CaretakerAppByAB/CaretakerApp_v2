/**
 * GratitudePortalScreen.tsx  — fixed + navigates to ThankYouNoteScreen
 * Place at: src/screens/GratitudePortalScreen.tsx
 */

import React, {useState, useEffect, useMemo} from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  StyleSheet, ActivityIndicator,
} from 'react-native';
import Svg, {Path, Circle} from 'react-native-svg';
import {collection, query, where, getDocs} from 'firebase/firestore';
import {db} from '../config/firebase';
import {useAuth} from '../context/AuthContext';
import ScreenHeader from '../components/ScreenHeader';
import Avatar from '../components/Avatar';
import {Colors} from '../theme/colors';

interface Friend {uid: string; name: string; handle: string}

const SearchIcon = () => (
  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
    <Circle cx={11} cy={11} r={8} stroke="#9E9E9E" strokeWidth={1.8}/>
    <Path d="M21 21l-4.35-4.35" stroke="#9E9E9E" strokeWidth={1.8} strokeLinecap="round"/>
  </Svg>
);

const GratitudePortalScreen: React.FC<{navigation: any}> = ({navigation}) => {
  const {user}                 = useAuth();
  const [friends,  setFriends] = useState<Friend[]>([]);
  const [loading,  setLoading] = useState(true);
  const [error,    setError]   = useState<string | null>(null);
  const [search,   setSearch]  = useState('');

  useEffect(() => {
    if (!user) return;
    load();
  }, [user?.uid]);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const map = new Map<string, Friend>();

      // Primary source: conversation partners (people you've messaged)
      const convSnap = await getDocs(
        query(collection(db, 'conversations'), where('participants', 'array-contains', user.uid)),
      );
      convSnap.docs.forEach(d => {
        const data     = d.data();
        const otherUid = (data.participants as string[]).find(p => p !== user.uid);
        if (otherUid && data.participantData?.[otherUid]) {
          const other = data.participantData[otherUid];
          map.set(otherUid, {uid: otherUid, name: other.name, handle: other.handle ?? ''});
        }
      });

      // Fallback: all registered users (if no conversations yet)
      if (map.size === 0) {
        const usersSnap = await getDocs(collection(db, 'users'));
        usersSnap.docs.forEach(d => {
          const u = d.data() as any;
          if (u.uid && u.uid !== user.uid) {
            map.set(u.uid, {uid: u.uid, name: u.name, handle: u.handle ?? ''});
          }
        });
      }

      setFriends(Array.from(map.values()));
    } catch (e: any) {
      setError('Could not load users. Check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => {
    if (!search.trim()) return friends;
    const q = search.toLowerCase();
    return friends.filter(f =>
      f.name.toLowerCase().includes(q) || f.handle.toLowerCase().includes(q),
    );
  }, [friends, search]);

  return (
    <View style={s.safe}>
      <ScreenHeader
        title="Send Gratitude"
        onBack={() => navigation.goBack()}
      />

      {/* Search */}
      <View style={s.searchWrap}>
        <SearchIcon/>
        <TextInput
          style={s.searchInput}
          placeholder="Search users"
          placeholderTextColor="#9E9E9E"
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {loading ? (
        <ActivityIndicator color={Colors.primary} style={{marginTop: 40}}/>
      ) : error ? (
        <View style={s.centred}>
          <Text style={s.errorText}>{error}</Text>
          <TouchableOpacity style={s.retryBtn} onPress={load}>
            <Text style={s.retryBtnText}>Try again</Text>
          </TouchableOpacity>
        </View>
      ) : filtered.length === 0 ? (
        <Text style={s.emptyText}>
          {friends.length === 0
            ? 'Start a conversation in Messages first,\nor wait for teammates to register.'
            : 'No users match your search.'}
        </Text>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => item.uid}
          renderItem={({item}) => (
            <TouchableOpacity
              style={s.row}
              activeOpacity={0.7}
              onPress={() =>
                navigation.navigate('ThankYouNote', {
                  receiverId:     item.uid,
                  receiverName:   item.name,
                  receiverHandle: item.handle,
                })
              }>
              <Avatar name={item.name} size={AVATAR_SIZE}/>
              <View style={s.rowInfo}>
                <Text style={s.rowName}>{item.name}</Text>
                <Text style={s.rowHandle}>{item.handle}</Text>
              </View>
              <View style={s.sendTag}>
                <Text style={s.sendTagText}>Send ♥</Text>
              </View>
            </TouchableOpacity>
          )}
          ItemSeparatorComponent={() => <View style={{height: 8}}/>}
          contentContainerStyle={s.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
};

const AVATAR_SIZE = 52;
const s = StyleSheet.create({
  safe: {flex: 1, backgroundColor: Colors.backgroundLight},

  searchWrap: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.white,
    borderRadius: 24, marginHorizontal: 16, marginTop: 16, marginBottom: 8,
    paddingHorizontal: 14, paddingVertical: 10, gap: 8,
    shadowColor: '#000', shadowOffset: {width:0,height:1}, shadowOpacity: 0.06, shadowRadius: 3, elevation: 2,
  },
  searchInput: {flex: 1, fontSize: 14, color: Colors.text, padding: 0},

  listContent: {paddingHorizontal: 16, paddingTop: 8, paddingBottom: 24},

  row: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.white, borderRadius: 14, padding: 12, gap: 12,
    shadowColor: '#000', shadowOffset:{width:0,height:1}, shadowOpacity:0.05, shadowRadius:3, elevation:1,
  },
  rowInfo:    {flex:1},
  rowName:    {fontSize:15, fontWeight:'700', color: Colors.text},
  rowHandle:  {fontSize:12, color: Colors.textSecondary, marginTop:2},
  sendTag:    {backgroundColor: Colors.primaryLight, borderRadius:20, paddingHorizontal:12, paddingVertical:6},
  sendTagText:{fontSize:12, fontWeight:'700', color: Colors.primaryDark},

  centred:      {flex:1, alignItems:'center', justifyContent:'center', padding:24},
  errorText:    {textAlign:'center', color: Colors.error, marginBottom:16, lineHeight:22},
  retryBtn:     {backgroundColor: Colors.primary, borderRadius:12, paddingHorizontal:24, paddingVertical:10},
  retryBtnText: {color: Colors.white, fontWeight:'700'},
  emptyText:    {textAlign:'center', color: Colors.textSecondary, margin:32, lineHeight:22, fontSize:14},
});

export default GratitudePortalScreen;
