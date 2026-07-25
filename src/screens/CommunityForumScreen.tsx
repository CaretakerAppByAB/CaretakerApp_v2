/**
 * CommunityForumScreen.tsx
 * Place at: src/screens/CommunityForumScreen.tsx
 *
 * DATA ARCHITECTURE NOTE:
 * ─────────────────────────────────────────────────────────────────
 * Currently uses static mock data. To connect a real backend:
 *
 * 1. Install Firebase:  npm install @react-native-firebase/app
 *                       npm install @react-native-firebase/firestore
 *
 * 2. Firestore structure:
 *    /posts/{postId}
 *      - authorId: string
 *      - authorName: string
 *      - authorHandle: string
 *      - content: string
 *      - likedBy: string[]   (array of userIds)
 *      - commentCount: number
 *      - timestamp: Timestamp
 *      - tab: 'Trending' | 'Events'
 *
 *    /posts/{postId}/comments/{commentId}
 *      - authorId: string
 *      - content: string
 *      - timestamp: Timestamp
 *
 * 3. Replace the MOCK_POSTS constant below with a Firestore query:
 *    const q = query(collection(db, 'posts'),
 *                    where('tab', '==', activeTab),
 *                    orderBy('timestamp', 'desc'));
 *    const snapshot = await getDocs(q);
 *
 * 'Following' tab: filter by posts where authorId is in
 * the current user's following array.
 * ─────────────────────────────────────────────────────────────────
 */

import React, {useState, useLayoutEffect} from 'react';import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import Svg, {Path, Circle} from 'react-native-svg';


const {width: SW} = Dimensions.get('window');

// ── Types ──────────────────────────────────────────────────────────────────────

type TabName = 'Trending' | 'Following' | 'Events';

interface Post {
  id: string;
  author: string;
  handle: string;
  content: string;
  likes: number;
  comments: number;
}

// ── Mock data — swap each array for a Firestore query later ───────────────────

const MOCK_POSTS: Record<TabName, Post[]> = {
  Trending: [
    {
      id: 't1',
      author: 'Diana Ambrose',
      handle: '@diana.A',
      content:
        'May we all find balance in our lives. Between the inner and outer, yin and yang.',
      likes: 20,
      comments: 5,
    },
    {
      id: 't2',
      author: 'Michael John',
      handle: '@John.M',
      content:
        'Your mental health is just as important as your physical health. Rest is not a reward — it is a requirement.',
      likes: 14,
      comments: 10,
    },
    {
      id: 't3',
      author: 'Christina Jacob',
      handle: '@Christina.J',
      content:
        'Taking care of your mental health is an act of self-love. You cannot pour from an empty cup.',
      likes: 19,
      comments: 8,
    },
    {
      id: 't4',
      author: 'Robert Nguyen',
      handle: '@robert.n',
      content:
        'Three years as a caregiver taught me that asking for help is one of the bravest things you can do.',
      likes: 37,
      comments: 14,
    },
  ],
  Following: [
    {
      id: 'f1',
      author: 'Sarah Chen',
      handle: '@sarah.c',
      content:
        'My mom recognised me today for the first time in months. Small victories matter more than anything.',
      likes: 45,
      comments: 23,
    },
    {
      id: 'f2',
      author: 'Alex Rivera',
      handle: '@alex.r',
      content:
        'Found a great respite care service in my area. Happy to share the details — just comment below.',
      likes: 8,
      comments: 12,
    },
    {
      id: 'f3',
      author: 'Priya Sharma',
      handle: '@priya.s',
      content:
        'Reminder that caregiver burnout is real. If you are exhausted, please reach out. This community is here for you.',
      likes: 31,
      comments: 9,
    },
  ],
  Events: [
    {
      id: 'e1',
      author: 'AlzApp Community',
      handle: '@alzapp',
      content:
        '📅 Virtual Support Group — Every Tuesday at 7 PM EST. A safe space to share and listen. Zoom link in comments.',
      likes: 12,
      comments: 6,
    },
    {
      id: 'e2',
      author: 'AlzApp Community',
      handle: '@alzapp',
      content:
        '🧠 Caregiver Wellness Workshop — July 30, 2026. Learn evidence-based strategies for managing stress. Free registration.',
      likes: 24,
      comments: 11,
    },
    {
      id: 'e3',
      author: 'AlzApp Community',
      handle: '@alzapp',
      content:
        '🚶 Memory Walk Fundraiser — August 15, 2026. Join our team and help raise awareness. Every step counts.',
      likes: 18,
      comments: 7,
    },
  ],
};

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

const ShareIcon: React.FC<{size?: number}> = ({size = 20}) => (
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

// ── Avatar ─────────────────────────────────────────────────────────────────────

const Avatar: React.FC<{name: string}> = ({name}) => {
  // Show initials for real users, person icon for @alzapp
  const initials = name
    .split(' ')
    .map(w => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <View style={s.avatar}>
      <Text style={s.avatarText}>{initials}</Text>
    </View>
  );
};

// ── Post card ──────────────────────────────────────────────────────────────────

interface PostCardProps {
  post: Post;
  liked: boolean;
  likeCount: number;
  onLike: () => void;
  onShare: () => void;
  onComment: () => void;
}

const PostCard: React.FC<PostCardProps> = ({
  post,
  liked,
  likeCount,
  onLike,
  onShare,
  onComment,
}) => (
  <View style={s.card}>
    {/* Header row */}
    <View style={s.cardHeader}>
      <Avatar name={post.author} />
      <View style={s.authorInfo}>
        <Text style={s.authorName}>{post.author}</Text>
        <Text style={s.authorHandle}>{post.handle}</Text>
      </View>
      <TouchableOpacity style={s.shareBtn} onPress={onShare} activeOpacity={0.7}>
        <View style={s.shareBtnInner}>
          <ShareIcon size={16} />
        </View>
      </TouchableOpacity>
    </View>

    {/* Content */}
    <Text style={s.content}>{post.content}</Text>

    {/* Footer row */}
    <View style={s.cardFooter}>
      <TouchableOpacity style={s.likeRow} onPress={onLike} activeOpacity={0.7}>
        <HeartIcon filled={liked} size={20} />
        <Text style={[s.likeCount, liked && s.likeCountActive]}>{likeCount}</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={onComment} activeOpacity={0.7}>
        <Text style={s.commentCount}>{post.comments} Comments</Text>
      </TouchableOpacity>
    </View>
  </View>
);

// ── Main screen ────────────────────────────────────────────────────────────────

const TABS: TabName[] = ['Trending', 'Following', 'Events'];

const CommunityForumScreen: React.FC = ({navigation}: any) => {
  const [activeTab, setActiveTab]   = useState<TabName>('Trending');

  // Increase header height via navigation options
  useLayoutEffect(() => {
    navigation.setOptions({
      headerStyle: {
        backgroundColor: '#8B7EEE', // Matches your purple theme
        height: 130,                // Increase this value to make it taller
      },
      headerTitleStyle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#FFFFFF',
      },
    });
  }, [navigation]);

  // Track liked state and live like counts separately
  const [likedPosts, setLikedPosts]   = useState<Set<string>>(new Set());
  const [likeCounts, setLikeCounts]   = useState<Record<string, number>>(() => {
    const counts: Record<string, number> = {};
    Object.values(MOCK_POSTS).flat().forEach(p => { counts[p.id] = p.likes; });
    return counts;
  });

  const handleLike = (postId: string) => {
    setLikedPosts(prev => {
      const next = new Set(prev);
      const isLiked = next.has(postId);
      if (isLiked) next.delete(postId);
      else next.add(postId);
      setLikeCounts(c => ({...c, [postId]: c[postId] + (isLiked ? -1 : 1)}));
      return next;
    });
  };

  const posts = MOCK_POSTS[activeTab];

  return (
    <View style={s.screen}>

      {/* ── Tab strip ── */}
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
            {activeTab === tab && <View style={s.tabIndicator} />}
          </TouchableOpacity>
        ))}
      </View>

      {/* Hairline below tabs */}
      <View style={s.tabDivider} />

      {/* ── Post feed ── */}
      <ScrollView
        style={s.feed}
        contentContainerStyle={s.feedContent}
        showsVerticalScrollIndicator={false}>
        {posts.map(post => (
          <PostCard
            key={post.id}
            post={post}
            liked={likedPosts.has(post.id)}
            likeCount={likeCounts[post.id] ?? post.likes}
            onLike={() => handleLike(post.id)}
            onShare={() => {/* wire up share sheet later */}}
            onComment={() => {/* wire up comment thread later */}}
          />
        ))}
        <View style={{height: 20}} />
      </ScrollView>
    </View>
  );
};

// ── Styles ─────────────────────────────────────────────────────────────────────

const AVATAR_SIZE = 42;

const s = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F5F3FF',
  },

  // Tab strip
  tabStrip: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    position: 'relative',
  },
  tabLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#7E7E7E',
  },
  tabLabelActive: {
    color: '#000000',
    fontWeight: '700',
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    width: '60%',
    height: 2,
    backgroundColor: '#000000',
    borderRadius: 1,
  },
  tabDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(0,0,0,0.15)',
  },

  // Feed
  feed: {flex: 1},
  feedContent: {
    paddingHorizontal: 16,
    paddingTop: 14,
  },

  // Post card
  card: {
    backgroundColor: '#E8E8E8',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },

  // Avatar
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    backgroundColor: '#9E9E9E',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  avatarText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Author
  authorInfo: {flex: 1},
  authorName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000000',
  },
  authorHandle: {
    fontSize: 12,
    fontWeight: '400',
    color: '#555555',
    marginTop: 1,
  },

  // Share button
  shareBtn: {marginLeft: 8},
  shareBtnInner: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#9E9E9E',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Content
  content: {
    fontSize: 13,
    lineHeight: 20,
    color: '#1A1A1A',
    marginBottom: 12,
  },

  // Footer
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  likeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  likeCount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#7E7E7E',
  },
  likeCountActive: {
    color: '#8B7EEE',
  },
  commentCount: {
    fontSize: 13,
    fontWeight: '500',
    color: '#555555',
  },
});

export default CommunityForumScreen;
