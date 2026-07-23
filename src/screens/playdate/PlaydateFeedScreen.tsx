import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { usePlaydate } from '../../hooks/usePlaydate';
import { PostCard } from '../../components/playdate/PostCard';

interface PlaydateFeedScreenProps {
  onSelectPost: (postId: string) => void;
  onCreatePost: () => void;
}

export const PlaydateFeedScreen: React.FC<PlaydateFeedScreenProps> = ({
  onSelectPost,
  onCreatePost,
}) => {
  const { posts, loading, error, searchNearby } = usePlaydate();
  const [selectedCity, setSelectedCity] = useState('Jakarta');

  useEffect(() => {
    const load = async () => {
      await searchNearby({ city: selectedCity });
    };
    load();
  }, [selectedCity]);

  if (loading && posts.length === 0) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0f5c4a" />
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

      <View style={styles.cityFilter}>
        {['Jakarta', 'Surabaya'].map(city => (
          <TouchableOpacity
            key={city}
            style={[
              styles.cityButton,
              selectedCity === city && styles.cityButtonActive,
            ]}
            onPress={() => setSelectedCity(city)}
          >
            <Text
              style={[
                styles.cityButtonText,
                selectedCity === city && styles.cityButtonTextActive,
              ]}
            >
              {city}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {posts.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No playdates</Text>
          <Text style={styles.emptySubtext}>Be the first to post</Text>
        </View>
      ) : (
        <FlatList
          data={posts}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <PostCard
              petName={item.petId}
              city={item.location.city}
              date={item.date}
              time={item.time}
              interestedCount={item.interested_owners.length}
              onPress={() => onSelectPost(item.id)}
            />
          )}
          scrollEnabled={false}
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
});
