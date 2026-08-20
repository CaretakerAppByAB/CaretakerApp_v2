/**
 * PrivateMessagesScreen.tsx — Message Inbox
 * Place at: src/screens/PrivateMessagesScreen.tsx
 *
 * Your original formatting is fully preserved.
 * Changes from your version:
 *  - Mock CONVERSATIONS replaced with real-time Firestore subscription
 *  - Compose (pencil) button added to the purple header
 *  - Compose modal lets you find a teammate by email and start a chat
 *  - openChat now marks conversation as read before navigating
 *  - Loading / error states added below the filter pills
 */

import React, {useState, useMemo, useEffect} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Dimensions,
  StatusBar,
  ActivityIndicator,
  Alert,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Svg, {Path, Circle} from 'react-native-svg';
import {useAuth} from '../context/AuthContext';
import {ensureKeyPair} from '../services/e2eService';
import {
  subscribeToConversations,
  getOrCreateConversation,
  findUserByEmail,
  markConversationRead,
  ConversationSummary,
} from '../services/messagingService';

const {width: SW} = Dimensions.get('window');

// ── Types ──────────────────────────────────────────────────────────────────────

type FilterType = 'All' | 'Unread' | 'Close friends';

// Internal display type — mapped from Firestore ConversationSummary
interface Conversation {
  id:          string;
  name:        string;
  initials:    string;
  lastMessage: string;
  timestamp:   string;
  unread:      number;
  online:      boolean;
  closeFriend: boolean;
  isSupport?:  boolean;
  receiverId:  string; // needed to send messages in ChatScreen
}

// ── Helpers ────────────────────────────────────────────────────────────────────

const getInitials = (name: string): string =>
  name.split(' ').map(w => w[0] ?? '').join('').slice(0, 2).toUpperCase() || '?';

const formatTime = (ms: number): string => {
  if (!ms) return '';
  const now  = Date.now();
  const diff = now - ms;
  const mins = Math.floor(diff / 60000);
  const hrs  = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1)   return 'Just now';
  if (mins < 60)  return `${mins}m ago`;
  if (hrs  < 24)  return new Date(ms).toLocaleTimeString([], {hour: 'numeric', minute: '2-digit'});
  if (days === 1) return 'Yesterday';
  if (days < 7)   return ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][new Date(ms).getDay()];
  return new Date(ms).toLocaleDateString([], {month: 'short', day: 'numeric'});
};

// Maps Firestore ConversationSummary → your Conversation display type
const mapConversation = (c: ConversationSummary): Conversation => ({
  id:          c.id,
  name:        c.otherUser.name,
  initials:    getInitials(c.otherUser.name),
  lastMessage: c.lastMessage,
  timestamp:   formatTime(c.lastMessageAt),
  unread:      c.unread,
  online:      false,  // not tracked in Firebase yet
  closeFriend: false,  // not tracked in Firebase yet
  isSupport:   false,
  receiverId:  c.otherUser.uid,
});

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

// Pencil / compose icon — added to the header
const ComposeIcon = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Path d="M12 20h9" stroke="#fff" strokeWidth={1.6} strokeLinecap="round"/>
    <Path
      d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"
      stroke="#fff" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round"
    />
  </Svg>
);

// ── Avatar ─────────────────────────────────────────────────────────────────────
// Unchanged from your version

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
// Unchanged from your version

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

// ── Compose modal ──────────────────────────────────────────────────────────────
// Lets you find a teammate by email and start a real conversation

interface ComposeModalProps {
  visible:     boolean;
  currentUser: any;
  onClose:     () => void;
  onStartChat: (conv: {id: string; name: string; initials: string; receiverId: string}) => void;
}

const ComposeModal: React.FC<ComposeModalProps> = ({visible, currentUser, onClose, onStartChat}) => {
  const [email,     setEmail]     = useState('');
  const [found,     setFound]     = useState<any>(null);
  const [searching, setSearching] = useState(false);
  const [notFound,  setNotFound]  = useState(false);
  const [starting,  setStarting]  = useState(false);

  const reset = () => { setEmail(''); setFound(null); setNotFound(false); };

  const handleSearch = async () => {
    if (!email.trim()) return;
    if (email.trim().toLowerCase() === currentUser?.email?.toLowerCase()) {
      Alert.alert("That's you!", "Enter a teammate's email address.");
      return;
    }
    setSearching(true); setFound(null); setNotFound(false);
    try {
      const result = await findUserByEmail(email.trim());
      result ? setFound(result) : setNotFound(true);
    } catch {
      Alert.alert('Error', 'Search failed. Check your connection.');
    } finally {
      setSearching(false);
    }
  };

  const handleStart = async () => {
    if (!found || !currentUser) return;
    setStarting(true);
    try {
      const convId = await getOrCreateConversation(currentUser, found);
      onStartChat({
        id:         convId,
        name:       found.name,
        initials:   getInitials(found.name),
        receiverId: found.uid,
      });
      reset();
    } catch {
      Alert.alert('Error', 'Could not start conversation. Check your connection.');
    } finally {
      setStarting(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <KeyboardAvoidingView
        style={s.modalOverlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={s.modalCard}>
          {/* Header */}
          <View style={s.modalHeader}>
            <TouchableOpacity onPress={() => { reset(); onClose(); }}>
              <Text style={s.modalCancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={s.modalTitle}>New Message</Text>
            <View style={{width: 56}}/>
          </View>

          <Text style={s.modalLabel}>Find teammate by email</Text>

          <View style={s.modalSearchRow}>
            <TextInput
              style={s.modalInput}
              placeholder="teammate@example.com"
              placeholderTextColor="#BBBBBB"
              value={email}
              onChangeText={t => { setEmail(t); setFound(null); setNotFound(false); }}
              autoCapitalize="none"
              keyboardType="email-address"
              returnKeyType="search"
              onSubmitEditing={handleSearch}
            />
            <TouchableOpacity
              style={[s.searchBtn, searching && s.btnDisabled]}
              onPress={handleSearch}
              disabled={searching}>
              {searching
                ? <ActivityIndicator color="#fff" size="small"/>
                : <Text style={s.searchBtnText}>Search</Text>
              }
            </TouchableOpacity>
          </View>

          {notFound && (
            <Text style={s.notFound}>
              No user found. Make sure they've created an AlzApp account.
            </Text>
          )}

          {found && (
            <View style={s.foundCard}>
              <View style={s.foundAvatar}>
                <Text style={s.foundAvatarText}>{getInitials(found.name)}</Text>
              </View>
              <View style={s.foundInfo}>
                <Text style={s.foundName}>{found.name}</Text>
                <Text style={s.foundHandle}>{found.handle}</Text>
              </View>
              <TouchableOpacity
                style={[s.startBtn, starting && s.btnDisabled]}
                onPress={handleStart}
                disabled={starting}>
                {starting
                  ? <ActivityIndicator color="#fff" size="small"/>
                  : <Text style={s.startBtnText}>Chat</Text>
                }
              </TouchableOpacity>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

// ── Main screen ────────────────────────────────────────────────────────────────

const FILTERS: FilterType[] = ['All', 'Unread', 'Close friends'];

const PrivateMessagesScreen: React.FC<{navigation: any}> = ({navigation}) => {
  const {user} = useAuth();

  // ── Firebase state ──
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState<string | null>(null);
  const [showCompose,   setShowCompose]   = useState(false);

  // ── Your original UI state ──
  const [search,       setSearch]  = useState('');
  const [activeFilter, setFilter]  = useState<FilterType>('All');

  // Subscribe to real-time conversations from Firestore
  // Make sure this device has an E2E keypair and that its public key is
  // published, so other users can send this user encrypted messages.
  useEffect(() => {
    if (user) ensureKeyPair(user.uid).catch(() => {});
  }, [user?.uid]);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    const unsubscribe = subscribeToConversations(
      user.uid,
      firebaseConvs => {
        setConversations(firebaseConvs.map(mapConversation));
        setLoading(false);
      },
      err => {
        setError(err.message);
        setLoading(false);
      },
    );
    return unsubscribe; // stops listening when screen unmounts
  }, [user?.uid]);

  // Your original filter logic — unchanged except data source is now Firebase
  const filtered = useMemo(() => {
    return conversations
      .filter(c => {
        if (activeFilter === 'Unread')        return c.unread > 0;
        if (activeFilter === 'Close friends') return true; // expandable later
        return true;
      })
      .filter(c => {
        if (!search) return true;
        const q = search.toLowerCase();
        return c.name.toLowerCase().includes(q) ||
               c.lastMessage.toLowerCase().includes(q);
      });
  }, [conversations, search, activeFilter]);

  const openChat = async (conv: Conversation) => {
    // Mark read in Firestore before opening so the badge clears
    if (user) await markConversationRead(conv.id, user.uid).catch(() => {});
    navigation.navigate('Chat', {
      conversationId: conv.id,
      name:           conv.name,
      initials:       conv.initials,
      receiverId:     conv.receiverId,
      online:         conv.online,
    });
  };

  const handleStartChat = (conv: {id: string; name: string; initials: string; receiverId: string}) => {
    setShowCompose(false);
    navigation.navigate('Chat', {
      conversationId: conv.id,
      name:           conv.name,
      initials:       conv.initials,
      receiverId:     conv.receiverId,
      online:         false,
    });
  };

  return (
    <View style={s.screen}>
      <StatusBar barStyle="light-content" backgroundColor="#8B7EEE" />

      {/* ── Custom Purple Header — your original, with compose button added ── */}
      <View style={s.customHeader}>
        <View style={s.headerRow}>
          {/* Invisible spacer keeps title perfectly centred */}
          <View style={s.headerSpacer}/>
          <Text style={s.headerTitle}>Messages</Text>
          <TouchableOpacity
            style={s.composeBtn}
            onPress={() => setShowCompose(true)}
            activeOpacity={0.7}>
            <ComposeIcon/>
          </TouchableOpacity>
        </View>
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

        {/* Loading / error / empty / list */}
        {loading ? (
          <ActivityIndicator color="#8B7EEE" style={{marginTop: 32}}/>
        ) : error ? (
          <Text style={[s.empty, {color: '#D87E7E'}]}>
            Could not load messages.{'\n'}Check your connection.
          </Text>
        ) : filtered.length === 0 ? (
          <Text style={s.empty}>
            {conversations.length === 0
              ? 'No conversations yet.\nTap the pencil icon to message a teammate.'
              : 'No conversations match your search.'}
          </Text>
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

      {/* Compose modal */}
      {user && (
        <ComposeModal
          visible={showCompose}
          currentUser={user}
          onClose={() => setShowCompose(false)}
          onStartChat={handleStartChat}
        />
      )}
    </View>
  );
};

// ── Styles ─────────────────────────────────────────────────────────────────────
// Your original styles are completely unchanged.
// New styles added at the bottom for the compose button and modal.

const AVATAR_SIZE = 48;

const s = StyleSheet.create({
  screen:    {flex: 1, backgroundColor: '#F5F3FF'},
  scroll:    {flex: 1},
  container: {paddingBottom: 24},

  // ── Your original header styles + headerRow/headerSpacer/composeBtn added ──
  customHeader: {
    backgroundColor: '#8B7EEE',
    height: 130,
    paddingBottom: 24,
    alignItems: 'center',
    justifyContent: 'flex-end',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  // Row that holds spacer | title | compose button
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 20,
  },
  headerSpacer: {width: 36},  // same width as composeBtn so title stays centred
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  composeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Your original search styles ──
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

  // ── Your original filter pill styles ──
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
  filterPillActive: {backgroundColor: '#000000'},
  filterLabel: {fontSize: 13, fontWeight: '500', color: '#555555'},
  filterLabelActive: {color: '#FFFFFF', fontWeight: '700'},

  // ── Your original support banner styles ──
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
  supportText:  {flex: 1},
  supportTitle: {fontSize: 14, fontWeight: '700', color: '#000000'},
  supportSub:   {fontSize: 12, fontWeight: '400', color: '#555555', marginTop: 2},

  // ── Your original section header styles ──
  sectionHeader: {paddingHorizontal: 20, marginBottom: 4},
  sectionTitle:  {fontSize: 16, fontWeight: '700', color: '#000000', marginBottom: 10},
  sectionLine:   {height: StyleSheet.hairlineWidth, backgroundColor: 'rgba(0,0,0,0.15)'},

  // ── Your original conversation list styles ──
  convList: {backgroundColor: '#FFFFFF'},
  divider:  {height: StyleSheet.hairlineWidth, backgroundColor: '#E8E8E8', marginLeft: 80},
  empty:    {textAlign: 'center', color: '#9E9E9E', marginTop: 32, fontSize: 14, lineHeight: 22},

  // ── Your original conversation row styles ──
  convRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
  },
  avatarWrap:    {position: 'relative', marginRight: 12},
  avatar:        {width: AVATAR_SIZE, height: AVATAR_SIZE, borderRadius: AVATAR_SIZE / 2, backgroundColor: '#9E9E9E', alignItems: 'center', justifyContent: 'center'},
  avatarSupport: {backgroundColor: '#8B7EEE'},
  avatarText:    {fontSize: 16, fontWeight: '700', color: '#FFFFFF'},
  onlineDot: {
    position: 'absolute', bottom: 2, right: 2,
    width: 11, height: 11, borderRadius: 5.5,
    backgroundColor: '#2ECC71', borderWidth: 2, borderColor: '#FFFFFF',
  },
  convMiddle: {flex: 1, marginRight: 8},
  convName:   {fontSize: 14, fontWeight: '700', color: '#000000', marginBottom: 3},
  convPreview:{fontSize: 13, fontWeight: '400', color: '#7E7E7E'},
  convPreviewUnread: {fontWeight: '600', color: '#333333'},
  convRight:  {alignItems: 'flex-end', gap: 6},
  convTime:   {fontSize: 11, fontWeight: '400', color: '#7E7E7E'},
  unreadBadge:{width: 20, height: 20, borderRadius: 10, backgroundColor: '#000000', alignItems: 'center', justifyContent: 'center'},
  unreadText: {fontSize: 11, fontWeight: '700', color: '#FFFFFF'},

  // ── New styles for compose modal ──
  modalOverlay: {flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end'},
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 36 : 20,
  },
  modalHeader: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20},
  modalCancel: {fontSize: 15, color: '#7E7E7E'},
  modalTitle:  {fontSize: 17, fontWeight: '700', color: '#000000'},
  modalLabel:  {fontSize: 13, fontWeight: '600', color: '#444444', marginBottom: 10},
  modalSearchRow: {flexDirection: 'row', gap: 10, marginBottom: 16},
  modalInput: {
    flex: 1, backgroundColor: '#F0F0F0', borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 14, color: '#000000',
  },
  searchBtn:     {backgroundColor: '#8B7EEE', borderRadius: 12, paddingHorizontal: 16, justifyContent: 'center'},
  searchBtnText: {color: '#FFFFFF', fontWeight: '700', fontSize: 13},
  btnDisabled:   {opacity: 0.6},
  notFound:      {fontSize: 13, color: '#D87E7E', textAlign: 'center', lineHeight: 20},
  foundCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#F5F3FF', borderRadius: 14,
    padding: 14, gap: 12, marginTop: 8,
  },
  foundAvatar:     {width: 44, height: 44, borderRadius: 22, backgroundColor: '#9E9E9E', alignItems: 'center', justifyContent: 'center'},
  foundAvatarText: {fontSize: 15, fontWeight: '700', color: '#FFFFFF'},
  foundInfo:       {flex: 1},
  foundName:       {fontSize: 15, fontWeight: '700', color: '#000000'},
  foundHandle:     {fontSize: 12, color: '#7E7E7E', marginTop: 2},
  startBtn:        {backgroundColor: '#8B7EEE', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8},
  startBtnText:    {color: '#FFFFFF', fontWeight: '700', fontSize: 13},
});

export default PrivateMessagesScreen;
