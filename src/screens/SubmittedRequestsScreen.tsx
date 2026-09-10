/**
 * SubmittedRequestsScreen.tsx — every support request this user has submitted.
 * Lets them mark a request resolved once they're satisfied with the outcome.
 */

import React, {useState, useEffect} from 'react';
import {View, Text, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator, Alert} from 'react-native';
import ScreenHeader from '../components/ScreenHeader';
import CommentsModal from '../components/CommentsModal';
import {Colors} from '../theme/colors';
import {useAuth} from '../context/AuthContext';
import {subscribeToMyRequests, resolveSupportRequest, SupportRequest} from '../services/supportService';

const timeAgo = (ms: number): string => {
  const diff = Date.now() - ms;
  const days = Math.floor(diff / 86400000);
  const hrs  = Math.floor(diff / 3600000);
  const mins = Math.floor(diff / 60000);
  if (days > 0) return `${days}d ago`;
  if (hrs  > 0) return `${hrs}h ago`;
  if (mins > 0) return `${mins}m ago`;
  return 'just now';
};

const RequestCard: React.FC<{
  request: SupportRequest;
  onResolve: () => void;
  onViewAdvice: () => void;
}> = ({request, onResolve, onViewAdvice}) => {
  const resolved = request.status === 'resolved';
  return (
    <View style={s.card}>
      <View style={s.cardHeader}>
        <Text style={s.cardTitle} numberOfLines={2}>{request.title}</Text>
        <View style={[s.statusBadge, resolved && s.statusBadgeResolved]}>
          <Text style={[s.statusText, resolved && s.statusTextResolved]}>
            {resolved ? 'Resolved' : 'Open'}
          </Text>
        </View>
      </View>

      {!!request.description && (
        <Text style={s.cardDesc} numberOfLines={3}>{request.description}</Text>
      )}

      <View style={s.tagRow}>
        {request.categories.map(cat => (
          <View key={cat} style={s.tagPill}>
            <Text style={s.tagText}>{cat}</Text>
          </View>
        ))}
      </View>

      <View style={s.cardFooter}>
        <Text style={s.metaText}>{timeAgo(request.createdAt)}</Text>
        <View style={s.cardActions}>
          <TouchableOpacity style={s.adviceBtn} onPress={onViewAdvice} activeOpacity={0.8}>
            <Text style={s.adviceBtnText}>View Advice</Text>
          </TouchableOpacity>
          {!resolved && (
            <TouchableOpacity style={s.resolveBtn} onPress={onResolve} activeOpacity={0.8}>
              <Text style={s.resolveBtnText}>Mark as Resolved</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
};

const SubmittedRequestsScreen: React.FC<{navigation: any}> = ({navigation}) => {
  const {user} = useAuth();
  const authorName = user?.name ?? user?.email?.split('@')[0] ?? 'Anonymous';
  const [requests, setRequests] = useState<SupportRequest[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState<string | null>(null);
  const [commentsPostId, setCommentsPostId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    const unsubscribe = subscribeToMyRequests(
      user.uid,
      rs => { setRequests(rs); setLoading(false); },
      err => { setError(err?.message ?? 'Could not load your requests.'); setLoading(false); },
    );
    return unsubscribe;
  }, [user?.uid]);

  const handleResolve = (request: SupportRequest) => {
    Alert.alert(
      'Mark as Resolved',
      `Mark "${request.title}" as resolved? You can still view it here afterward.`,
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Resolve',
          onPress: async () => {
            try {
              await resolveSupportRequest(request.id, request.postId);
            } catch {
              Alert.alert('Error', 'Could not update this request. Check your connection.');
            }
          },
        },
      ],
    );
  };

  return (
    <View style={s.screen}>
      <ScreenHeader title="Submitted Requests" onBack={() => navigation.goBack()}/>

      {loading ? (
        <View style={s.centred}><ActivityIndicator size="large" color={Colors.primary}/></View>
      ) : error ? (
        <View style={s.centred}><Text style={s.errorText}>{error}</Text></View>
      ) : requests.length === 0 ? (
        <View style={s.centred}>
          <Text style={s.emptyText}>You haven't submitted any requests yet.</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={s.container} showsVerticalScrollIndicator={false}>
          {requests.map(r => (
            <RequestCard
              key={r.id}
              request={r}
              onResolve={() => handleResolve(r)}
              onViewAdvice={() => setCommentsPostId(r.postId)}
            />
          ))}
          <View style={{height: 24}}/>
        </ScrollView>
      )}

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

const s = StyleSheet.create({
  screen: {flex: 1, backgroundColor: Colors.white},
  container: {padding: 16, paddingBottom: 8},

  centred: {flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24},
  errorText: {fontSize: 14, color: Colors.error, textAlign: 'center', lineHeight: 22},
  emptyText: {fontSize: 14, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22},

  card: {
    backgroundColor: Colors.primaryLight,
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
  },
  cardHeader: {flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, marginBottom: 6},
  cardTitle: {flex: 1, fontSize: 15, fontWeight: '700', color: Colors.text},
  statusBadge: {backgroundColor: Colors.primaryMedium, borderRadius: 10, paddingHorizontal: 9, paddingVertical: 3},
  statusBadgeResolved: {backgroundColor: '#D9D9D9'},
  statusText: {fontSize: 10, fontWeight: '700', color: Colors.white},
  statusTextResolved: {color: '#555555'},

  cardDesc: {fontSize: 13, color: Colors.textSecondary, lineHeight: 18, marginBottom: 8},

  tagRow: {flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10},
  tagPill: {backgroundColor: Colors.white, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3},
  tagText: {fontSize: 10, fontWeight: '600', color: Colors.text},

  cardFooter: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'},
  metaText: {fontSize: 11, color: Colors.textSecondary},
  cardActions: {flexDirection: 'row', alignItems: 'center', gap: 8},
  adviceBtn: {backgroundColor: Colors.white, borderRadius: 14, paddingHorizontal: 12, paddingVertical: 6},
  adviceBtnText: {fontSize: 11, fontWeight: '700', color: Colors.primary},
  resolveBtn: {backgroundColor: Colors.primary, borderRadius: 14, paddingHorizontal: 12, paddingVertical: 6},
  resolveBtnText: {fontSize: 11, fontWeight: '700', color: Colors.white},
});

export default SubmittedRequestsScreen;
