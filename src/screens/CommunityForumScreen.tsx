/**
 * CommunityForumScreen.tsx
 * Place at: src/screens/CommunityForumScreen.tsx
 *
 * Connected to Firebase Firestore.
 * Posts are real — everyone on the same Firebase project sees them instantly.
 */

import React, {useState, useEffect, useRef, useMemo} from 'react';
import {
  View,
  Text,
  Image,
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
import Svg, {Path} from 'react-native-svg';
import {useAuth} from '../context/AuthContext';
import {detectPHI, redactPHI} from '../services/phiDetection';
import PHIWarningBanner from '../components/PHIWarningBanner';
import ScreenHeader from '../components/ScreenHeader';
import CommentsModal from '../components/CommentsModal';
import Avatar from '../components/Avatar';
import {Colors} from '../theme/colors';
import {pickImageWithPrompt, uploadImage, PickedImage} from '../services/mediaService';
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
      fill={filled ? Colors.primary : 'none'}
      stroke={filled ? Colors.primary : Colors.textSecondary}
      strokeWidth={1.5}
    />
  </Svg>
);

const PlusIcon: React.FC = () => (
  <Svg width={28} height={28} viewBox="0 0 24 24" fill="none">
    <Path d="M12 5v14M5 12h14" stroke="#FFFFFF" strokeWidth={2.5} strokeLinecap="round"/>
  </Svg>
);

// ── Post card ──────────────────────────────────────────────────────────────────

interface PostCardProps {
  post:        Post;
  liked:       boolean;
  onLike:      () => void;
  onComment:   () => void;
}

const PostCard: React.FC<PostCardProps> = ({post, liked, onLike, onComment}) => (
  <View style={s.card}>
    <View style={s.cardHeader}>
      <Avatar name={post.authorName} size={AVATAR_SIZE} photoURL={post.authorPhotoURL}/>
      <View style={s.authorInfo}>
        <Text style={s.authorName}>{post.authorName}</Text>
        <Text style={s.authorHandle}>{post.authorHandle}</Text>
      </View>
      {post.tab === 'Help/Advice' && (
        <View style={[s.eventBadge, post.resolved && s.resolvedBadge]}>
          <Text style={s.eventBadgeText}>{post.resolved ? 'Resolved' : 'Help/Advice'}</Text>
        </View>
      )}
    </View>

    {!!post.content && <Text style={s.content}>{post.content}</Text>}
    {!!post.imageUrl && (
      <Image source={{uri: post.imageUrl}} style={s.postImage} resizeMode="cover"/>
    )}

    <View style={s.cardFooter}>
      <TouchableOpacity style={s.likeRow} onPress={onLike} activeOpacity={0.7}>
        <HeartIcon filled={liked} size={20}/>
        <Text style={[s.likeCount, liked && s.likeCountActive]}>
          {post.likeCount}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={onComment} activeOpacity={0.7}>
        <Text style={s.commentCount}>{post.commentCount} Comments</Text>
      </TouchableOpacity>
    </View>
  </View>
);

// ── New-post modal ─────────────────────────────────────────────────────────────

interface NewPostModalProps {
  visible:        boolean;
  authorName:     string;
  authorPhotoURL?: string;
  onClose:    () => void;
  onPosted:   (tab: TabName) => void;
}

const NewPostModal: React.FC<NewPostModalProps> = ({
  visible, authorName, authorPhotoURL, onClose, onPosted,
}) => {
  const [content,  setContent]  = useState('');
  const [tab,      setTab]      = useState<TabName>('Trending');
  const [posting,  setPosting]  = useState(false);
  const [image,    setImage]    = useState<PickedImage | null>(null);

  // Community posts are PUBLIC and cannot be encrypted.
  // PHI here is BLOCKING, not advisory.
  const phiMatches = useMemo(
    () => (content.length < 4 ? [] : detectPHI(content)),
    [content],
  );
  const hasPHI = phiMatches.length > 0;

  const handleRedact = () => setContent(prev => redactPHI(prev));
  const inputRef = useRef<TextInput>(null);

  // Clear fields when modal opens
  useEffect(() => {
    if (visible) {
      setContent('');
      setTab('Trending');
      setImage(null);
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [visible]);

  const handlePickImage = async () => {
    const picked = await pickImageWithPrompt();
    if (picked) setImage(picked);
  };

  const submit = async () => {
    if (!content.trim() && !image) {
      Alert.alert('Empty post', 'Please write something or attach a photo before posting.');
      return;
    }
    if (hasPHI) {
      Alert.alert(
        'Private information detected',
        'Community posts are visible to every user and cannot be encrypted. '
        + 'Please remove names, phone numbers, and other identifying details first.',
      );
      return;
    }
    setPosting(true);
    try {
      const imageUrl = image ? await uploadImage(image, 'postImages') : undefined;
      await createPost(authorName, content, tab, imageUrl, authorPhotoURL);
      onPosted(tab);
    } catch (err: any) {
      console.error('[CommunityForumScreen] post failed:', err);
      const msg = err?.message ?? '';
      if (msg.includes('400') || msg.includes('projectId')) {
        Alert.alert(
          'Firebase not configured',
          'Open src/config/firebase.ts and paste your Firebase project config values.',
        );
      } else {
        Alert.alert('Could not post', msg || 'Check your internet connection.');
      }
    } finally {
      setPosting(false);
    }
  };

  const TAB_OPTIONS: TabName[] = ['Trending', 'Help/Advice'];

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
              style={[s.postBtn, (posting || hasPHI) && s.postBtnDisabled]}
              onPress={submit}
              disabled={posting || (!content.trim() && !image) || hasPHI}>
              {posting
                ? <ActivityIndicator color="#fff" size="small"/>
                : <Text style={s.postBtnText}>Post</Text>
              }
            </TouchableOpacity>
          </View>

          {/* Author preview */}
          <View style={s.modalAuthorRow}>
            <Avatar name={authorName} size={AVATAR_SIZE} photoURL={authorPhotoURL}/>
            <View>
              <Text style={s.modalAuthorName}>{authorName}</Text>
              <Text style={s.modalAuthorSub}>Sharing with the community</Text>
            </View>
          </View>

          {/* PUBLIC POST WARNING — blocking variant */}
          <PHIWarningBanner
            matches={phiMatches}
            onRedact={handleRedact}
            variant="block"
          />

          {/* Public visibility notice */}
          <View style={s.publicNotice}>
            <Text style={s.publicNoticeText}>
              🌐 Public post — visible to all AlzApp users. Never include patient names or details.
            </Text>
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

          {/* Photo attachment */}
          {image ? (
            <View style={s.imagePreviewWrap}>
              <Image source={{uri: image.uri}} style={s.imagePreview} resizeMode="cover"/>
              <TouchableOpacity style={s.removeImageBtn} onPress={() => setImage(null)} activeOpacity={0.8}>
                <Text style={s.removeImageBtnText}>✕</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={s.photoBtn} onPress={handlePickImage} activeOpacity={0.75}>
              <Text style={s.photoBtnText}>📷 Add Photo</Text>
            </TouchableOpacity>
          )}

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

const TABS: TabName[] = ['Trending', 'Help/Advice'];

const CommunityForumScreen: React.FC<{navigation: any}> = ({navigation}) => {
  const {user}              = useAuth();
  const authorName          = user?.name ?? user?.email?.split('@')[0] ?? 'Anonymous';

  const [activeTab,   setActiveTab]   = useState<TabName>('Trending');
  const [posts,       setPosts]       = useState<Post[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState<string | null>(null);
  const [deviceId,    setDeviceId]    = useState('');
  const [showNewPost, setShowNewPost] = useState(false);
  const [commentsPostId, setCommentsPostId] = useState<string | null>(null);

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
      <ScreenHeader title="Community" onBack={() => navigation.navigate('Home')}/>

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
          <ActivityIndicator size="large" color={Colors.primary}/>
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
              onComment={() => setCommentsPostId(post.id)}
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
        authorPhotoURL={user?.profilePhotoURL}
        onClose={() => setShowNewPost(false)}
        onPosted={handlePosted}
      />

      {/* Comments modal */}
      <CommentsModal
        visible={!!commentsPostId}
        postId={commentsPostId}
        authorName={authorName}
        authorPhotoURL={user?.profilePhotoURL}
        onClose={() => setCommentsPostId(null)}
      />
    </View>
  );
};

// ── Styles ─────────────────────────────────────────────────────────────────────

const AVATAR_SIZE = 42;

const s = StyleSheet.create({
  screen: {flex: 1, backgroundColor: Colors.backgroundLight},

  // Tab strip
  tabStrip: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    paddingHorizontal: 16,
  },
  tabItem: {
    flex: 1, alignItems: 'center', paddingVertical: 12, position: 'relative',
  },
  tabLabel: {fontSize: 14, fontWeight: '500', color: Colors.textSecondary},
  tabLabelActive: {color: Colors.primary, fontWeight: '700'},
  tabIndicator: {
    position: 'absolute', bottom: 0, width: '60%',
    height: 2, backgroundColor: Colors.primary, borderRadius: 1,
  },
  tabDivider: {
    height: StyleSheet.hairlineWidth, backgroundColor: Colors.border,
  },

  // Feed
  feed: {flex: 1},
  feedContent: {paddingHorizontal: 16, paddingTop: 14},

  // States
  centred: {flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24},
  loadingText: {marginTop: 12, fontSize: 14, color: Colors.textSecondary},
  errorText: {fontSize: 14, color: Colors.error, textAlign: 'center', lineHeight: 22},
  emptyText: {textAlign: 'center', color: Colors.textSecondary, fontSize: 14, marginTop: 40, lineHeight: 22},

  // Post card
  card: {
    backgroundColor: Colors.cardBackground, borderRadius: 14,
    padding: 14, marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row', alignItems: 'center', marginBottom: 10,
  },
  authorInfo: {flex: 1, marginLeft: 10},
  authorName: {fontSize: 14, fontWeight: '700', color: Colors.text},
  authorHandle: {fontSize: 12, color: Colors.textSecondary, marginTop: 1},
  eventBadge: {
    backgroundColor: Colors.primary, borderRadius: 8,
    paddingHorizontal: 8, paddingVertical: 2, marginRight: 6,
  },
  resolvedBadge: {backgroundColor: '#9E9E9E'},
  eventBadgeText: {fontSize: 10, fontWeight: '700', color: Colors.white},
  content: {fontSize: 13, lineHeight: 20, color: Colors.text, marginBottom: 12},
  postImage: {width: '100%', height: 200, borderRadius: 10, marginBottom: 12, backgroundColor: '#E8E8E8'},
  cardFooter: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  likeRow: {flexDirection: 'row', alignItems: 'center', gap: 6},
  likeCount: {fontSize: 14, fontWeight: '600', color: Colors.textSecondary},
  likeCountActive: {color: Colors.primary},
  commentCount: {fontSize: 13, fontWeight: '500', color: Colors.textSecondary},

  // FAB
  fab: {
    position: 'absolute', bottom: 90, right: 20,
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: Colors.primary,
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
    backgroundColor: Colors.white,
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 36 : 20,
    minHeight: 400,
  },
  modalHeader: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: 20,
  },
  modalCancel: {fontSize: 15, color: Colors.textSecondary},
  modalTitle: {fontSize: 17, fontWeight: '700', color: Colors.text},
  postBtn: {
    backgroundColor: Colors.primary, borderRadius: 20,
    paddingHorizontal: 16, paddingVertical: 7,
    minWidth: 56, alignItems: 'center',
  },
  postBtnDisabled: {opacity: 0.5},
  postBtnText: {fontSize: 14, fontWeight: '700', color: Colors.white},
  modalAuthorRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16,
  },
  modalAuthorName: {fontSize: 14, fontWeight: '700', color: Colors.text},
  modalAuthorSub: {fontSize: 12, color: Colors.textSecondary, marginTop: 2},
  modalInput: {
    fontSize: 15, color: Colors.text, lineHeight: 22,
    minHeight: 120, textAlignVertical: 'top',
  },
  charCount: {
    textAlign: 'right', fontSize: 11, color: '#BBBBBB', marginTop: 6,
  },
  photoBtn: {
    backgroundColor: Colors.primaryLight, borderRadius: 12,
    paddingVertical: 12, alignItems: 'center', marginTop: 12,
  },
  photoBtnText: {fontSize: 13, fontWeight: '600', color: Colors.text},
  imagePreviewWrap: {marginTop: 12, position: 'relative'},
  imagePreview: {width: '100%', height: 180, borderRadius: 12, backgroundColor: '#E8E8E8'},
  removeImageBtn: {
    position: 'absolute', top: 8, right: 8,
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center',
  },
  removeImageBtnText: {color: Colors.white, fontSize: 13, fontWeight: '700'},
  publicNotice: {
    backgroundColor: '#EEF4FD', borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 9, marginBottom: 12,
  },
  publicNoticeText: {fontSize: 11, color: '#2C5A8F', lineHeight: 16},
  tabSelectorLabel: {
    fontSize: 13, fontWeight: '600', color: Colors.textSecondary,
    marginTop: 16, marginBottom: 8,
  },
  tabSelector: {flexDirection: 'row', gap: 8},
  tabOption: {
    paddingHorizontal: 16, paddingVertical: 7,
    borderRadius: 20, backgroundColor: Colors.primaryLight,
  },
  tabOptionActive: {backgroundColor: Colors.primary},
  tabOptionText: {fontSize: 13, fontWeight: '500', color: Colors.textSecondary},
  tabOptionTextActive: {color: Colors.white, fontWeight: '700'},
});

export default CommunityForumScreen;
