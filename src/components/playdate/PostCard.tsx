import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface PostCardProps {
  petName: string;
  city: string;
  date: string;
  time: string;
  interestedCount: number;
  onPress: () => void;
}

export const PostCard: React.FC<PostCardProps> = ({
  petName,
  city,
  date,
  time,
  interestedCount,
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
        <View style={styles.meta}>
          <Text style={styles.city}>📍 {city}</Text>
          <Text style={styles.datetime}>
            {formatDate(date)} at {time}
          </Text>
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
    marginBottom: 6,
  },
  meta: {
    gap: 4,
  },
  city: {
    fontSize: 12,
    color: '#666',
  },
  datetime: {
    fontSize: 12,
    color: '#999',
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
