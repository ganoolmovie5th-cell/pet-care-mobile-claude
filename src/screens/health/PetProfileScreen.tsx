import React, { useEffect, useContext } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { AuthContext } from '../../context/AuthContext';
import { useHealth } from '../../hooks/useHealth';
import { PetCard } from '../../components/health/PetCard';

interface PetProfileScreenProps {
  onSelectPet: (petId: string) => void;
  onAddPet: () => void;
}

export const PetProfileScreen: React.FC<PetProfileScreenProps> = ({
  onSelectPet,
  onAddPet,
}) => {
  const { user } = useContext(AuthContext);
  const { pets, loading, error, fetchPets } = useHealth();

  useEffect(() => {
    const load = async () => {
      if (user?.uid) {
        await fetchPets(user.uid);
      }
    };
    load();
  }, [user?.uid]);

  if (loading && pets.length === 0) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0f5c4a" />
      </View>
    );
  }

  if (error && pets.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Pets</Text>
        <TouchableOpacity style={styles.addButton} onPress={onAddPet}>
          <Text style={styles.addButtonText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      {pets.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No pets yet</Text>
          <Text style={styles.emptySubtext}>Add your first pet to start tracking health</Text>
          <TouchableOpacity style={styles.emptyButton} onPress={onAddPet}>
            <Text style={styles.emptyButtonText}>Add Pet</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={pets}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <PetCard
              name={item.name}
              breed={item.breed}
              age={item.age}
              onPress={() => onSelectPet(item.id)}
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
  addButton: {
    backgroundColor: '#0f5c4a',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
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
    marginBottom: 16,
    textAlign: 'center',
  },
  emptyButton: {
    backgroundColor: '#0f5c4a',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 6,
  },
  emptyButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
