/**
 * PrivateMessagesScreen.tsx — Message Inbox
 * Place at: src/screens/PrivateMessagesScreen.tsx
 */

import React, {useState, useMemo} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Dimensions,
  Platform,
  StatusBar,
} from 'react-native';
import Svg, {Path, Circle} from 'react-native-svg';

const {width: SW} = Dimensions.get('window');

// ── Types ──────────────────────────────────────────────────────────────────────

type FilterType = 'All' | 'Unread' | 'Close friends';

interface Conversation {
  id: string;
  name: string;
  initials: string;
  lastMessage: string;
  timestamp: string;
  unread: number;
  online: boolean;
  closeFriend: boolean;
  isSupport?: boolean;
}

// ── Mock data — replace with Firestore query ───────────────────────────────────

const CONVERSATIONS: Conversation[] = [
  {
    id: '1',
    name: 'Sarah Thompson',
    initials: 'ST',
    lastMessage: 'I really enjoyed our walk today!',
    timestamp: '10:32 AM',
    unread: 2,
    online: true,
    closeFriend: true,
  },
  {
    id: '2',
    name: 'David Chen',
    initials: 'DC',
    lastMessage: 'Would Thursday afternoon work?',
    timestamp: 'Yesterday',
    unread: 0,
    online: false,
    closeFriend: false,
  },
  {
    id: '3',
    name: 'Emily Rodriguez',
    initials: 'ER',
    lastMessage: 'Thanks for checking in with me.',
    timestamp: 'Monday',
    unread: 0,
    online: true,
    closeFriend: true,
  },
  {
    id: '4',
    name: "Alzheimer's Buddies Support",
    initials: 'AB',
    lastMessage: 'Your weekly check-in is ready.',
    timestamp: 'Friday',
    unread: 0,
    online: false,
    closeFriend: false,
    isSupport: true,
  },
  {
    id: '5',
    name: 'Marcus Williams',
    initials: 'MW',
    lastMessage: 'The support group was really helpful.',
    timestamp: 'Last week',
    unread: 1,
    online: false,
    closeFriend: true,
  },
];

// ── Icons ──────────────────────────────────────────────────────────────────────

const SearchIcon = () => (
  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
    <Circle cx={11} cy={11} r={8} stroke="#9E9E9E" strokeWidth={1.8}/>
    <Path d="M21 21l-4.35-4.35" stroke="#9E9E9E" strokeWidth={1.8} strokeLinecap="round"/>
  </Svg>
);

const ChevronRight = () => (
  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
    <Path d="M9 18l6-6-6-6" stroke="#555555" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

const GroupIcon = () => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <Path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" stroke="#fff" strokeWidth={1.5} strokeLinecap="round"/>
    <Circle cx={9} cy={7} r={4} stroke="#fff" strokeWidth={1.5}/>
    <Path d="M23 21v-2a4 4 0 00-3-3.87" stroke="#fff" strokeWidth={1.5} strokeLinecap="round"/>
    <Path d="M16 3.13a4 4 0 010 7.75" stroke="#fff" strokeWidth={1.5} strokeLinecap="round"/>
  </Svg>
);

const HeartFilled = () => (
  <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
      fill="#8B7EEE"
    />
  </Svg>
);

// ── Avatar ─────────────────────────────────────────────────────────────────────

const Avatar: React.FC<{conv: Conversation}> = ({conv}) => (
  <View style={s.avatarWrap}>
    <View style={[s.avatar, conv.isSupport && s.avatarSupport]}>
      {conv.isSupport
        ? <GroupIcon />
        : <Text style={s.avatarText}>{conv.initials}</Text>
      }
    </View>
    {conv.online && <View style={s.onlineDot}/>}
  </View>
);

// ── Conversation row ───────────────────────────────────────────────────────────

interface ConvRowProps {
  conv: Conversation;
  onPress: () => void;
}

const ConversationRow: React.FC<ConvRowProps> = ({conv, onPress}) => (
  <TouchableOpacity style={s.convRow} onPress={onPress} activeOpacity={0.7}>
    <Avatar conv={conv}/>
    <View style={s.convMiddle}>
      <Text style={s.convName} numberOfLines={1}>{conv.name}</Text>
      <Text
        style={[s.convPreview, conv.unread > 0 && s.convPreviewUnread]}
        numberOfLines={1}>
        {conv.lastMessage}
      </Text>
    </View>
    <View style={s.convRight}>
      <Text style={s.convTime}>{conv.timestamp}</Text>
      {conv.unread > 0 && (
        <View style={s.unreadBadge}>
          <Text style={s.unreadText}>{conv.unread}</Text>
        </View>
      )}
    </View>
  </TouchableOpacity>
);

// ── Main screen ────────────────────────────────────────────────────────────────

const FILTERS: FilterType[] = ['All', 'Unread', 'Close friends'];

const PrivateMessagesScreen: React.FC<{navigation: any}> = ({navigation}) => {
  const [search,     setSearch]     = useState('');
  const [activeFilter, setFilter]   = useState<FilterType>('All');

  const filtered = useMemo(() => {
    return CONVERSATIONS
      .filter(c => {
        if (activeFilter === 'Unread')        return c.unread > 0;
        if (activeFilter === 'Close friends') return c.closeFriend;
        return true;
      })
      .filter(c => {
        if (!search) return true;
        const q = search.toLowerCase();
        return c.name.toLowerCase().includes(q) ||
               c.lastMessage.toLowerCase().includes(q);
      });
  }, [search, activeFilter]);

  const openChat = (conv: Conversation) => {
    navigation.navigate('Chat', {
      conversationId: conv.id,
      name:           conv.name,
      initials:       conv.initials,
      isSupport:      !!conv.isSupport,
      online:         conv.online,
    });
  };

  return (
    <View style={s.screen}>
      <StatusBar barStyle="light-content" backgroundColor="#8B7EEE" />

      {/* ── Custom Purple Header ── */}
      <View style={s.customHeader}>
        <Text style={s.headerTitle}>Messages</Text>
      </View>

      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.container}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">

        {/* ── Search ── */}
        <View style={s.searchBar}>
          <SearchIcon/>
          <TextInput
            style={s.searchInput}
            placeholder="Search conversations"
            placeholderTextColor="#9E9E9E"
            value={search}
            onChangeText={setSearch}
            returnKeyType="search"
          />
        </View>

        {/* ── Filter pills ── */}
        <View style={s.filterRow}>
          {FILTERS.map(f => (
            <TouchableOpacity
              key={f}
              style={[s.filterPill, activeFilter === f && s.filterPillActive]}
              onPress={() => setFilter(f)}
              activeOpacity={0.7}>
              <Text style={[s.filterLabel, activeFilter === f && s.filterLabelActive]}>
                {f}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Support banner ── */}
        <TouchableOpacity
          style={s.supportBanner}
          onPress={() => navigation.navigate('Support')}
          activeOpacity={0.8}>
          <HeartFilled/>
          <View style={s.supportText}>
            <Text style={s.supportTitle}>Need help?</Text>
            <Text style={s.supportSub}>Contact Alzheimer's Buddies Support</Text>
          </View>
          <ChevronRight/>
        </TouchableOpacity>

        {/* ── Recent Messages ── */}
        <View style={s.sectionHeader}>
          <Text style={s.sectionTitle}>Recent Messages</Text>
          <View style={s.sectionLine}/>
        </View>

        {filtered.length === 0 ? (
          <Text style={s.empty}>No conversations found.</Text>
        ) : (
          <View style={s.convList}>
            {filtered.map((conv, i) => (
              <React.Fragment key={conv.id}>
                <ConversationRow conv={conv} onPress={() => openChat(conv)}/>
                {i < filtered.length - 1 && <View style={s.divider}/>}
              </React.Fragment>
            ))}
          </View>
        )}

        <View style={{height: 20}}/>
      </ScrollView>
    </View>
  );
};

// ── Styles ─────────────────────────────────────────────────────────────────────

const AVATAR_SIZE = 48;

const s = StyleSheet.create({
  screen:    {flex: 1, backgroundColor: '#F5F3FF'},
  scroll:    {flex: 1},
  container: {paddingBottom: 24},

  // Custom Header Block
  customHeader: {
    backgroundColor: '#8B7EEE',
    height: 130, // Forces the exact height to match Community page
    paddingBottom: 24,
    alignItems: 'center',
    justifyContent: 'flex-end',
    // Removed border radiuses to make it completely flat
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Search
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#000000',
    padding: 0,
  },

  // Filter pills
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 8,
    marginBottom: 16,
  },
  filterPill: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  filterPillActive: {
    backgroundColor: '#000000',
  },
  filterLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#555555',
  },
  filterLabelActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },

  // Support banner
  supportBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    marginHorizontal: 20,
    marginBottom: 20,
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 12,
  },
  supportText: {flex: 1},
  supportTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000000',
  },
  supportSub: {
    fontSize: 12,
    fontWeight: '400',
    color: '#555555',
    marginTop: 2,
  },

  // Section header
  sectionHeader: {
    paddingHorizontal: 20,
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 10,
  },
  sectionLine: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(0,0,0,0.15)',
  },

  // Conversation list
  convList:  {backgroundColor: '#FFFFFF'},
  divider:   {height: StyleSheet.hairlineWidth, backgroundColor: '#E8E8E8', marginLeft: 80},
  empty:     {textAlign: 'center', color: '#9E9E9E', marginTop: 32, fontSize: 14},

  // Conversation row
  convRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
  },

  // Avatar
  avatarWrap: {position: 'relative', marginRight: 12},
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    backgroundColor: '#9E9E9E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarSupport: {backgroundColor: '#8B7EEE'},
  avatarText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  onlineDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 11,
    height: 11,
    borderRadius: 5.5,
    backgroundColor: '#2ECC71',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },

  // Conv content
  convMiddle: {flex: 1, marginRight: 8},
  convName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 3,
  },
  convPreview: {
    fontSize: 13,
    fontWeight: '400',
    color: '#7E7E7E',
  },
  convPreviewUnread: {
    fontWeight: '600',
    color: '#333333',
  },
  convRight: {alignItems: 'flex-end', gap: 6},
  convTime: {
    fontSize: 11,
    fontWeight: '400',
    color: '#7E7E7E',
  },
  unreadBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  unreadText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

export default PrivateMessagesScreen;