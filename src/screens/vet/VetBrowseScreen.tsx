import React, { useEffect, useState } from 'react';
import { View, FlatList, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { useVet } from '../../hooks/useVet';

interface VetBrowseScreenProps {
  onVetSelect: (vetId: string) => void;
}

export const VetBrowseScreen: React.FC<VetBrowseScreenProps> = ({ onVetSelect }) => {
  const { vets, loading, error, fetchAllVets } = useVet();
  const [city, setCity] = useState('');

  useEffect(() => {
    if (city) {
      const searchByCity = async () => {
        const { searchVetsByFilters } = useVet();
        await searchVetsByFilters({ city });
      };
      searchByCity();
    } else {
      fetchAllVets();
    }
  }, [city]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0f5c4a" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Find a Vet</Text>
      <View style={styles.filterRow}>
        <TouchableOpacity
          style={[styles.filterBtn, city === 'Jakarta' && styles.filterBtnActive]}
          onPress={() => setCity(city === 'Jakarta' ? '' : 'Jakarta')}
        >
          <Text style={styles.filterBtnText}>Jakarta</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterBtn, city === 'Surabaya' && styles.filterBtnActive]}
          onPress={() => setCity(city === 'Surabaya' ? '' : 'Surabaya')}
        >
          <Text style={styles.filterBtnText}>Surabaya</Text>
        </TouchableOpacity>
      </View>

      {error && <Text style={styles.error}>{error}</Text>}

      <FlatList
        data={vets}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.vetCard}
            onPress={() => onVetSelect(item.id)}
          >
            <Text style={styles.vetName}>{item.clinic_name}</Text>
            <Text style={styles.vetInfo}>{item.location.city}</Text>
            <View style={styles.ratingRow}>
              <Text style={styles.rating}>⭐ {item.rating.toFixed(1)}</Text>
              <Text style={styles.fee}>Rp {item.consultation_fee.toLocaleString()}</Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  filterBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  filterBtnActive: {
    backgroundColor: '#0f5c4a',
    borderColor: '#0f5c4a',
  },
  filterBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
  },
  vetCard: {
    backgroundColor: '#fff',
    padding: 12,
    marginBottom: 8,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#0f5c4a',
  },
  vetName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  vetInfo: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  ratingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  rating: {
    fontSize: 12,
    fontWeight: '600',
  },
  fee: {
    fontSize: 12,
    color: '#0f5c4a',
    fontWeight: '600',
  },
  error: {
    color: 'red',
    marginBottom: 16,
  },
});
