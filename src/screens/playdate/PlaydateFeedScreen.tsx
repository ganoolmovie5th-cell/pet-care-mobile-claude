import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { usePlaydatePosts } from '../../hooks/usePlaydate';
import { PostCard } from '../../components/playdate/PostCard';

interface PlaydateFeedScreenProps {
  onSelectPost: (postId: string) => void;
  onCreatePost: () => void;
}

export const PlaydateFeedScreen: React.FC<PlaydateFeedScreenProps> = ({
  onSelectPost,
  onCreatePost,
}) => {
  const { user } = useAuth();
  const { location } = useLocation();
  const [showMatches, setShowMatches] = useState(true);

  // Use geo-matching if location available, else fallback to all posts
  const { matches, loading: matchLoading, refresh: refreshMatches } = usePlaydateMatches(
    location?.lat || null,
    location?.lng || null,
    null,
    5,
    'score'
  );
  const { posts, loading: postsLoading, error: postsError, refetch } = usePlaydatePosts();

  const displayPosts = showMatches && location && matches.length > 0 ? matches : posts;
  const loading = showMatches && location ? matchLoading : postsLoading;
  const error = showMatches && location ? null : postsError;

  if (loading && posts.length === 0) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#ff9800" />
      </View>
    );
  }

  if (error && posts.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Playdates</Text>
        <TouchableOpacity style={styles.createButton} onPress={onCreatePost}>
          <Text style={styles.createButtonText}>+ Create</Text>
        </TouchableOpacity>
      </View>

      {location && (
        <View style={styles.filterRow}>
          <TouchableOpacity
            style={[styles.filterBtn, showMatches && styles.filterBtnActive]}
            onPress={() => setShowMatches(true)}
          >
            <Text style={styles.filterBtnText}>Matched</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterBtn, !showMatches && styles.filterBtnActive]}
            onPress={() => setShowMatches(false)}
          >
            <Text style={styles.filterBtnText}>All</Text>
          </TouchableOpacity>
        </View>
      )}

      {displayPosts.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No playdates</Text>
          <Text style={styles.emptySubtext}>Be the first to post</Text>
        </View>
      ) : (
        <FlatList
          data={displayPosts}
          keyExtractor={item => item.id || item.postId}
          renderItem={({ item }) => (
            <View>
              <PostCard
                petName={item.petName || item.petId}
                breed={item.breed}
                location={item.location.address || 'Unknown'}
                date={item.date}
                interestedCount={item.interested_owners?.length || 0}
                description={item.description}
                onPress={() => onSelectPost(item.id || item.postId)}
              />
              {showMatches && 'match_score' in item && (
                <Text style={styles.matchScore}>Match: {(item as any).match_score}%</Text>
              )}
            </View>
          )}
          refreshControl={
            <RefreshControl
              refreshing={loading}
              onRefresh={showMatches && location ? refreshMatches : refetch}
              tintColor="#ff9800"
            />
          }
          style={styles.list}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fafafa',
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  createButton: {
    backgroundColor: '#ff9800',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  cityFilter: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  cityButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  cityButtonActive: {
    backgroundColor: '#ff9800',
    borderColor: '#ff9800',
  },
  cityButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
  },
  cityButtonTextActive: {
    color: '#fff',
  },
  list: {
    marginTop: 8,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  error: {
    color: 'red',
    fontSize: 16,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  filterBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  filterBtnActive: {
    backgroundColor: '#ff9800',
    borderColor: '#ff9800',
  },
  filterBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
  },
  matchScore: {
    fontSize: 12,
    color: '#ff9800',
    fontWeight: '600',
    marginLeft: 16,
    marginBottom: 8,
  },
});
