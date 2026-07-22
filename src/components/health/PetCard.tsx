import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface PetCardProps {
  name: string;
  breed: string;
  age: number;
  onPress: () => void;
}

export const PetCard: React.FC<PetCardProps> = ({ name, breed, age, onPress }) => {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <View style={styles.content}>
        <Text style={styles.name}>{name}</Text>
        <View style={styles.row}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{breed}</Text>
          </View>
          <Text style={styles.age}>{age} years</Text>
        </View>
      </View>
      <Text style={styles.arrow}>›</Text>
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
    borderLeftColor: '#0f5c4a',
  },
  content: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 6,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  badge: {
    backgroundColor: '#e4efe9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    color: '#0f5c4a',
    fontWeight: '500',
  },
  age: {
    fontSize: 12,
    color: '#666',
  },
  arrow: {
    fontSize: 24,
    color: '#0f5c4a',
    marginLeft: 8,
  },
});
