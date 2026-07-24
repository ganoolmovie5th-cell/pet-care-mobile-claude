import React, { useContext, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { AuthContext } from '../../context/AuthContext';
import { PlaydatePost } from '../../types/playdate';
import { createPlaydateChat } from '../../services/playdate';

interface PlaydateDetailScreenProps {
  post: PlaydatePost;
  onChat: (chatId: string) => void;
}

export const PlaydateDetailScreen: React.FC<PlaydateDetailScreenProps> = ({ post, onChat }) => {
  const { user } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);

  const handleStartChat = async (interestedOwnerId: string) => {
    if (!user?.uid) {
      Alert.alert('Error', 'User not authenticated');
      return;
    }

    try {
      setLoading(true);
      const chat = await createPlaydateChat(post.id, interestedOwnerId, `Hi! I'm interested in your playdate!`);
      onChat(chat.id);
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to start chat');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.petName}>{post.petName || post.petId}</Text>
        <Text style={styles.status}>{post.status.toUpperCase()}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Details</Text>
        <View style={styles.detail}>
          <Text style={styles.label}>Location:</Text>
          <Text style={styles.value}>
            {post.location.address || 'Not specified'}
          </Text>
        </View>
        <View style={styles.detail}>
          <Text style={styles.label}>Date:</Text>
          <Text style={styles.value}>
            {new Date(post.date).toLocaleDateString('id-ID')}
          </Text>
        </View>
        {post.breed && (
          <View style={styles.detail}>
            <Text style={styles.label}>Breed:</Text>
            <Text style={styles.value}>{post.breed}</Text>
          </View>
        )}
        <View style={styles.detail}>
          <Text style={styles.label}>Description:</Text>
          <Text style={styles.value}>{post.description}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          Interested Owners ({post.interested_owners.length})
        </Text>
        {post.interested_owners.length === 0 ? (
          <Text style={styles.emptyText}>No interested owners yet</Text>
        ) : (
          post.interested_owners.map((ownerId) => (
            <TouchableOpacity
              key={ownerId}
              style={styles.matchCard}
              onPress={() => handleStartChat(ownerId)}
              disabled={loading}
            >
              <Text style={styles.matchOwner}>{ownerId}</Text>
              {loading ? (
                <ActivityIndicator size="small" color="#ff9800" />
              ) : (
                <Text style={styles.chatBtnText}>→</Text>
              )}
            </TouchableOpacity>
          ))
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
  matchOwner: {
    fontSize: 14,
    fontWeight: '600',
  },
  chatBtnText: {
    fontSize: 18,
    color: '#ff9800',
  },
});
