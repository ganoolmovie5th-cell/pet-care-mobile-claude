import React, { useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { usePlaydate } from '../../hooks/usePlaydate';
import { PlaydatePost } from '../../services/playdate';

interface PlaydateDetailScreenProps {
  post: PlaydatePost;
  onChat: (ownerId: string) => void;
}

export const PlaydateDetailScreen: React.FC<PlaydateDetailScreenProps> = ({ post, onChat }) => {
  const { matches, loading, fetchMatches, acceptMatchHandler, rejectMatchHandler } = usePlaydate();

  useEffect(() => {
    const load = async () => {
      await fetchMatches(post.id);
    };
    load();
  }, [post.id]);

  const handleAccept = async (matchId: string) => {
    const success = await acceptMatchHandler(matchId);
    if (success) {
      await fetchMatches(post.id);
    }
  };

  const handleReject = async (matchId: string) => {
    const success = await rejectMatchHandler(matchId);
    if (success) {
      await fetchMatches(post.id);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.petName}>{post.petId}</Text>
        <Text style={styles.status}>{post.status.toUpperCase()}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Details</Text>
        <View style={styles.detail}>
          <Text style={styles.label}>Location:</Text>
          <Text style={styles.value}>
            {post.location.address}, {post.location.city}
          </Text>
        </View>
        <View style={styles.detail}>
          <Text style={styles.label}>Date & Time:</Text>
          <Text style={styles.value}>
            {post.date} at {post.time}
          </Text>
        </View>
        <View style={styles.detail}>
          <Text style={styles.label}>Description:</Text>
          <Text style={styles.value}>{post.description}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          Interested Owners ({matches.length})
        </Text>
        {loading ? (
          <ActivityIndicator size="large" color="#ff9800" />
        ) : matches.length === 0 ? (
          <Text style={styles.emptyText}>No interested owners yet</Text>
        ) : (
          <FlatList
            data={matches}
            keyExtractor={item => item.id}
            renderItem={({ item }) => (
              <View style={styles.matchCard}>
                <View style={styles.matchInfo}>
                  <Text style={styles.matchOwner}>Owner {item.ownerId.substring(0, 8)}</Text>
                  <Text style={styles.matchPet}>Pet: {item.petId}</Text>
                  <Text style={styles.matchStatus}>{item.status}</Text>
                </View>
                {item.status === 'pending' && (
                  <View style={styles.matchActions}>
                    <TouchableOpacity
                      style={styles.acceptBtn}
                      onPress={() => handleAccept(item.id)}
                    >
                      <Text style={styles.acceptBtnText}>✓</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.rejectBtn}
                      onPress={() => handleReject(item.id)}
                    >
                      <Text style={styles.rejectBtnText}>✗</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.chatBtn}
                      onPress={() => onChat(item.ownerId)}
                    >
                      <Text style={styles.chatBtnText}>💬</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )}
            scrollEnabled={false}
          />
        )}
      </View>
    </ScrollView>
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
    marginBottom: 20,
  },
  petName: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  status: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ff9800',
    backgroundColor: '#fff3e0',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  detail: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 6,
    marginBottom: 8,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  value: {
    fontSize: 14,
    color: '#333',
    marginTop: 4,
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    paddingVertical: 20,
  },
  matchCard: {
    backgroundColor: '#fff',
    borderRadius: 6,
    padding: 12,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  matchInfo: {
    flex: 1,
  },
  matchOwner: {
    fontSize: 14,
    fontWeight: '600',
  },
  matchPet: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  matchStatus: {
    fontSize: 11,
    color: '#ff9800',
    marginTop: 4,
    fontWeight: '500',
  },
  matchActions: {
    flexDirection: 'row',
    gap: 8,
  },
  acceptBtn: {
    backgroundColor: '#4caf50',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  acceptBtnText: {
    color: '#fff',
    fontSize: 18,
  },
  rejectBtn: {
    backgroundColor: '#f44336',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rejectBtnText: {
    color: '#fff',
    fontSize: 18,
  },
  chatBtn: {
    backgroundColor: '#2196f3',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chatBtnText: {
    fontSize: 18,
  },
});
