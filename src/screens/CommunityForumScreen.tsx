/**
 * CommunityForumScreen.tsx
 * Place at: src/screens/CommunityForumScreen.tsx
 *
 * Connected to Firebase Firestore.
 * Posts are real — everyone on the same Firebase project sees them instantly.
 */

import React, {useState, useEffect, useRef} from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
} from 'react-native';
import Svg, {Path, Circle} from 'react-native-svg';
import {useAuth} from '../context/AuthContext';
import {
  subscribeToPosts,
  createPost,
  toggleLike,
  getDeviceId,
  Post,
  TabName,
} from '../services/communityService';

const {width: SW} = Dimensions.get('window');

// ── Icons ──────────────────────────────────────────────────────────────────────

const HeartIcon: React.FC<{filled: boolean; size?: number}> = ({filled, size = 20}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
      fill={filled ? '#8B7EEE' : 'none'}
      stroke={filled ? '#8B7EEE' : '#7E7E7E'}
      strokeWidth={1.5}
    />
  </Svg>
);

const ShareIcon: React.FC<{size?: number}> = ({size = 18}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1M16 8l-4-4-4 4M12 4v12"
      stroke="#7E7E7E"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const PlusIcon: React.FC = () => (
  <Svg width={28} height={28} viewBox="0 0 24 24" fill="none">
    <Path d="M12 5v14M5 12h14" stroke="#FFFFFF" strokeWidth={2.5} strokeLinecap="round"/>
  </Svg>
);

// ── Avatar ─────────────────────────────────────────────────────────────────────

const Avatar: React.FC<{name: string}> = ({name}) => {
  const initials = name
    .split(' ')
    .map(w => w[0] ?? '')
    .join('')
    .slice(0, 2)
    .toUpperCase() || '?';

  return (
    <View style={s.avatar}>
      <Text style={s.avatarText}>{initials}</Text>
    </View>
  );
};

// ── Post card ──────────────────────────────────────────────────────────────────

interface PostCardProps {
  post:    Post;
  liked:   boolean;
  onLike:  () => void;
}

const PostCard: React.FC<PostCardProps> = ({post, liked, onLike}) => (
  <View style={s.card}>
    <View style={s.cardHeader}>
      <Avatar name={post.authorName}/>
      <View style={s.authorInfo}>
        <Text style={s.authorName}>{post.authorName}</Text>
        <Text style={s.authorHandle}>{post.authorHandle}</Text>
      </View>
      {post.tab === 'Events' && (
        <View style={s.eventBadge}>
          <Text style={s.eventBadgeText}>Event</Text>
        </View>
      )}
      <View style={s.shareBtn}>
        <View style={s.shareBtnInner}>
          <ShareIcon size={15}/>
        </View>
      </View>
    </View>

    <Text style={s.content}>{post.content}</Text>

    <View style={s.cardFooter}>
      <TouchableOpacity style={s.likeRow} onPress={onLike} activeOpacity={0.7}>
        <HeartIcon filled={liked} size={20}/>
        <Text style={[s.likeCount, liked && s.likeCountActive]}>
          {post.likeCount}
        </Text>
      </TouchableOpacity>
      <Text style={s.commentCount}>{post.commentCount} Comments</Text>
    </View>
  </View>
);

// ── New-post modal ─────────────────────────────────────────────────────────────

interface NewPostModalProps {
  visible:    boolean;
  authorName: string;
  onClose:    () => void;
  onPosted:   (tab: TabName) => void;
}

const NewPostModal: React.FC<NewPostModalProps> = ({
  visible, authorName, onClose, onPosted,
}) => {
  const [content,  setContent]  = useState('');
  const [tab,      setTab]      = useState<TabName>('Trending');
  const [posting,  setPosting]  = useState(false);
  const inputRef = useRef<TextInput>(null);

  // Clear fields when modal opens
  useEffect(() => {
    if (visible) {
      setContent('');
      setTab('Trending');
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [visible]);

  const submit = async () => {
    if (!content.trim()) {
      Alert.alert('Empty post', 'Please write something before posting.');
      return;
    }
    setPosting(true);
    try {
      await createPost(authorName, content, tab);
      onPosted(tab);
    } catch (err: any) {
      const msg = err?.message ?? '';
      if (msg.includes('400') || msg.includes('projectId')) {
        Alert.alert(
          'Firebase not configured',
          'Open src/config/firebase.ts and paste your Firebase project config values.',
        );
      } else {
        Alert.alert('Error', 'Could not post. Check your internet connection.');
      }
    } finally {
      setPosting(false);
    }
  };

  const TAB_OPTIONS: TabName[] = ['Trending', 'Following', 'Events'];

  return (
    <Modal visible={visible} transparent animationType="slide">
      <KeyboardAvoidingView
        style={s.modalOverlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={s.modalCard}>

          {/* Header */}
          <View style={s.modalHeader}>
            <TouchableOpacity onPress={onClose} disabled={posting}>
              <Text style={s.modalCancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={s.modalTitle}>New Post</Text>
            <TouchableOpacity
              style={[s.postBtn, posting && s.postBtnDisabled]}
              onPress={submit}
              disabled={posting || !content.trim()}>
              {posting
                ? <ActivityIndicator color="#fff" size="small"/>
                : <Text style={s.postBtnText}>Post</Text>
              }
            </TouchableOpacity>
          </View>

          {/* Author preview */}
          <View style={s.modalAuthorRow}>
            <Avatar name={authorName}/>
            <View>
              <Text style={s.modalAuthorName}>{authorName}</Text>
              <Text style={s.modalAuthorSub}>Sharing with the community</Text>
            </View>
          </View>

          {/* Text input */}
          <TextInput
            ref={inputRef}
            style={s.modalInput}
            placeholder="What's on your mind?"
            placeholderTextColor="#BBBBBB"
            value={content}
            onChangeText={setContent}
            multiline
            maxLength={1000}
            textAlignVertical="top"
          />

          {/* Character counter */}
          <Text style={s.charCount}>{content.length}/1000</Text>

          {/* Tab selector */}
          <Text style={s.tabSelectorLabel}>Post to:</Text>
          <View style={s.tabSelector}>
            {TAB_OPTIONS.map(t => (
              <TouchableOpacity
                key={t}
                style={[s.tabOption, tab === t && s.tabOptionActive]}
                onPress={() => setTab(t)}>
                <Text style={[s.tabOptionText, tab === t && s.tabOptionTextActive]}>
                  {t}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

// ── Main screen ────────────────────────────────────────────────────────────────

const TABS: TabName[] = ['Trending', 'Following', 'Events'];

const CommunityForumScreen: React.FC = () => {
  const {user}              = useAuth();
  const authorName          = user?.name ?? user?.email?.split('@')[0] ?? 'Anonymous';

  const [activeTab,   setActiveTab]   = useState<TabName>('Trending');
  const [posts,       setPosts]       = useState<Post[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState<string | null>(null);
  const [deviceId,    setDeviceId]    = useState('');
  const [showNewPost, setShowNewPost] = useState(false);

  // Load this device's unique ID
  useEffect(() => {
    getDeviceId().then(setDeviceId).catch(() => {});
  }, []);

  // Subscribe to posts — re-subscribes automatically when the tab changes
  useEffect(() => {
    setLoading(true);
    setError(null);

    const unsubscribe = subscribeToPosts(
      activeTab,
      newPosts => {
        setPosts(newPosts);
        setLoading(false);
      },
      err => {
        console.error('Firestore error:', err);
        const msg = err.message ?? '';
        if (
          msg.includes('400') ||
          msg.includes('projectId') ||
          msg.includes('PASTE_')
        ) {
          setError(
            'Firebase is not configured yet.\n\n' +
            'Open src/config/firebase.ts and replace the placeholder values ' +
            'with your Firebase project config.',
          );
        } else {
          setError('Could not load posts. Check your internet connection.');
        }
        setLoading(false);
      },
    );

    // When the tab changes (or the component unmounts), stop the listener
    return unsubscribe;
  }, [activeTab]);

  // Optimistic like: update local state immediately, then tell Firestore.
  // If Firestore fails, revert the change.
  const handleLike = async (post: Post) => {
    if (!deviceId) return;
    const isLiked = post.likedBy.includes(deviceId);

    // Immediate local update so the UI feels instant
    setPosts(prev =>
      prev.map(p => {
        if (p.id !== post.id) return p;
        return {
          ...p,
          likedBy:   isLiked
            ? p.likedBy.filter(id => id !== deviceId)
            : [...p.likedBy, deviceId],
          likeCount: p.likeCount + (isLiked ? -1 : 1),
        };
      }),
    );

    try {
      await toggleLike(post.id, isLiked);
    } catch (_) {
      // Revert on failure
      setPosts(prev =>
        prev.map(p => {
          if (p.id !== post.id) return p;
          return {
            ...p,
            likedBy:   isLiked
              ? [...p.likedBy, deviceId]
              : p.likedBy.filter(id => id !== deviceId),
            likeCount: p.likeCount + (isLiked ? 1 : -1),
          };
        }),
      );
      Alert.alert('Error', 'Could not update like. Check your connection.');
    }
  };

  const handlePosted = (tab: TabName) => {
    setShowNewPost(false);
    setActiveTab(tab);
  };

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <View style={s.screen}>

      {/* Tab strip */}
      <View style={s.tabStrip}>
        {TABS.map(tab => (
          <TouchableOpacity
            key={tab}
            style={s.tabItem}
            onPress={() => setActiveTab(tab)}
            activeOpacity={0.7}>
            <Text style={[s.tabLabel, activeTab === tab && s.tabLabelActive]}>
              {tab}
            </Text>
            {activeTab === tab && <View style={s.tabIndicator}/>}
          </TouchableOpacity>
        ))}
      </View>
      <View style={s.tabDivider}/>

      {/* Content */}
      {loading ? (
        <View style={s.centred}>
          <ActivityIndicator size="large" color="#8B7EEE"/>
          <Text style={s.loadingText}>Loading posts…</Text>
        </View>
      ) : error ? (
        <View style={s.centred}>
          <Text style={s.errorText}>{error}</Text>
        </View>
      ) : (
        <ScrollView
          style={s.feed}
          contentContainerStyle={s.feedContent}
          showsVerticalScrollIndicator={false}>
          {posts.length === 0 && (
            <Text style={s.emptyText}>
              No posts yet. Be the first to share something! 👆
            </Text>
          )}
          {posts.map(post => (
            <PostCard
              key={post.id}
              post={post}
              liked={deviceId ? post.likedBy.includes(deviceId) : false}
              onLike={() => handleLike(post)}
            />
          ))}
          <View style={{height: 100}}/>
        </ScrollView>
      )}

      {/* Floating action button — opens new post modal */}
      <TouchableOpacity
        style={s.fab}
        onPress={() => setShowNewPost(true)}
        activeOpacity={0.85}>
        <PlusIcon/>
      </TouchableOpacity>

      {/* New post modal */}
      <NewPostModal
        visible={showNewPost}
        authorName={authorName}
        onClose={() => setShowNewPost(false)}
        onPosted={handlePosted}
      />
    </View>
  );
};

// ── Styles ─────────────────────────────────────────────────────────────────────

const AVATAR_SIZE = 42;

const s = StyleSheet.create({
  screen: {flex: 1, backgroundColor: '#F5F3FF'},

  // Tab strip
  tabStrip: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
  },
  tabItem: {
    flex: 1, alignItems: 'center', paddingVertical: 12, position: 'relative',
  },
  tabLabel: {fontSize: 14, fontWeight: '500', color: '#7E7E7E'},
  tabLabelActive: {color: '#000000', fontWeight: '700'},
  tabIndicator: {
    position: 'absolute', bottom: 0, width: '60%',
    height: 2, backgroundColor: '#000000', borderRadius: 1,
  },
  tabDivider: {
    height: StyleSheet.hairlineWidth, backgroundColor: 'rgba(0,0,0,0.15)',
  },

  // Feed
  feed: {flex: 1},
  feedContent: {paddingHorizontal: 16, paddingTop: 14},

  // States
  centred: {flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24},
  loadingText: {marginTop: 12, fontSize: 14, color: '#7E7E7E'},
  errorText: {fontSize: 14, color: '#D87E7E', textAlign: 'center', lineHeight: 22},
  emptyText: {textAlign: 'center', color: '#9E9E9E', fontSize: 14, marginTop: 40, lineHeight: 22},

  // Post card
  card: {
    backgroundColor: '#E8E8E8', borderRadius: 14,
    padding: 14, marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row', alignItems: 'center', marginBottom: 10,
  },
  avatar: {
    width: AVATAR_SIZE, height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2, backgroundColor: '#9E9E9E',
    alignItems: 'center', justifyContent: 'center', marginRight: 10,
  },
  avatarText: {fontSize: 16, fontWeight: '700', color: '#FFFFFF'},
  authorInfo: {flex: 1},
  authorName: {fontSize: 14, fontWeight: '700', color: '#000000'},
  authorHandle: {fontSize: 12, color: '#555555', marginTop: 1},
  eventBadge: {
    backgroundColor: '#8B7EEE', borderRadius: 8,
    paddingHorizontal: 8, paddingVertical: 2, marginRight: 6,
  },
  eventBadgeText: {fontSize: 10, fontWeight: '700', color: '#FFFFFF'},
  shareBtn: {marginLeft: 4},
  shareBtnInner: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: '#9E9E9E', alignItems: 'center', justifyContent: 'center',
  },
  content: {fontSize: 13, lineHeight: 20, color: '#1A1A1A', marginBottom: 12},
  cardFooter: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  likeRow: {flexDirection: 'row', alignItems: 'center', gap: 6},
  likeCount: {fontSize: 14, fontWeight: '600', color: '#7E7E7E'},
  likeCountActive: {color: '#8B7EEE'},
  commentCount: {fontSize: 13, fontWeight: '500', color: '#555555'},

  // FAB
  fab: {
    position: 'absolute', bottom: 90, right: 20,
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: '#8B7EEE',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.25, shadowRadius: 8, elevation: 8,
  },

  // New post modal
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 36 : 20,
    minHeight: 400,
  },
  modalHeader: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: 20,
  },
  modalCancel: {fontSize: 15, color: '#7E7E7E'},
  modalTitle: {fontSize: 17, fontWeight: '700', color: '#000000'},
  postBtn: {
    backgroundColor: '#8B7EEE', borderRadius: 20,
    paddingHorizontal: 16, paddingVertical: 7,
    minWidth: 56, alignItems: 'center',
  },
  postBtnDisabled: {opacity: 0.5},
  postBtnText: {fontSize: 14, fontWeight: '700', color: '#FFFFFF'},
  modalAuthorRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16,
  },
  modalAuthorName: {fontSize: 14, fontWeight: '700', color: '#000000'},
  modalAuthorSub: {fontSize: 12, color: '#7E7E7E', marginTop: 2},
  modalInput: {
    fontSize: 15, color: '#000000', lineHeight: 22,
    minHeight: 120, textAlignVertical: 'top',
  },
  charCount: {
    textAlign: 'right', fontSize: 11, color: '#BBBBBB', marginTop: 6,
  },
  tabSelectorLabel: {
    fontSize: 13, fontWeight: '600', color: '#555555',
    marginTop: 16, marginBottom: 8,
  },
  tabSelector: {flexDirection: 'row', gap: 8},
  tabOption: {
    paddingHorizontal: 16, paddingVertical: 7,
    borderRadius: 20, backgroundColor: '#F0F0F0',
  },
  tabOptionActive: {backgroundColor: '#8B7EEE'},
  tabOptionText: {fontSize: 13, fontWeight: '500', color: '#555555'},
  tabOptionTextActive: {color: '#FFFFFF', fontWeight: '700'},
});

export default CommunityForumScreen;
