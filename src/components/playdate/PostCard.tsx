import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface PostCardProps {
  petName: string;
  breed?: string;
  location: string;
  date: string;
  interestedCount: number;
  description?: string;
  onPress: () => void;
}

export const PostCard: React.FC<PostCardProps> = ({
  petName,
  breed,
  location,
  date,
  interestedCount,
  description,
  onPress,
}) => {
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('id-ID', {
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <View style={styles.content}>
        <Text style={styles.petName}>{petName}</Text>
        {breed && <Text style={styles.breed}>{breed}</Text>}
        <View style={styles.meta}>
          <Text style={styles.location}>📍 {location}</Text>
          <Text style={styles.date}>📅 {formatDate(date)}</Text>
          {description && <Text style={styles.description} numberOfLines={1}>{description}</Text>}
        </View>
      </View>
      <View style={styles.badge}>
        <Text style={styles.badgeCount}>{interestedCount}</Text>
        <Text style={styles.badgeLabel}>Interested</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderLeftWidth: 4,
    borderLeftColor: '#ff9800',
  },
  content: {
    flex: 1,
  },
  petName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  breed: {
    fontSize: 12,
    color: '#888',
    marginBottom: 6,
  },
  meta: {
    gap: 4,
  },
  location: {
    fontSize: 12,
    color: '#666',
  },
  date: {
    fontSize: 12,
    color: '#999',
  },
  description: {
    fontSize: 11,
    color: '#aaa',
    marginTop: 4,
  },
  badge: {
    backgroundColor: '#ff9800',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    alignItems: 'center',
    marginLeft: 12,
  },
  badgeCount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  badgeLabel: {
    fontSize: 10,
    color: '#fff',
    marginTop: 2,
  },
});
