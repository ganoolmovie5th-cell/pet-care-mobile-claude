import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { useVet, Vet } from '../../services/vet';

interface VetDetailScreenProps {
  vetId: string;
  onBooking: (vetId: string) => void;
}

export const VetDetailScreen: React.FC<VetDetailScreenProps> = ({ vetId, onBooking }) => {
  const { loading, error, fetchVetById } = useVet();
  const [vet, setVet] = useState<Vet | null>(null);

  useEffect(() => {
    const loadVet = async () => {
      const data = await fetchVetById(vetId);
      setVet(data);
    };
    loadVet();
  }, [vetId]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0f5c4a" />
      </View>
    );
  }

  if (!vet || error) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>{error || 'Vet not found'}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{vet.clinic_name}</Text>
        <View style={styles.ratingRow}>
          <Text style={styles.rating}>⭐ {vet.rating.toFixed(1)}</Text>
          <Text style={styles.reviews}>({vet.review_count} reviews)</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Location</Text>
        <Text style={styles.text}>{vet.location.address}</Text>
        <Text style={styles.text}>{vet.location.city}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Specialties</Text>
        <View style={styles.specialties}>
          {vet.specialties.map((spec, idx) => (
            <View key={idx} style={styles.badge}>
              <Text style={styles.badgeText}>{spec}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Hours</Text>
        <Text style={styles.text}>{vet.hours.open} - {vet.hours.close}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Consultation Fee</Text>
        <Text style={styles.fee}>Rp {vet.consultation_fee.toLocaleString()}</Text>
      </View>

      <TouchableOpacity
        style={styles.bookButton}
        onPress={() => onBooking(vetId)}
      >
        <Text style={styles.bookButtonText}>Book Appointment</Text>
      </TouchableOpacity>
    </ScrollView>
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
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rating: {
    fontSize: 16,
    fontWeight: '600',
  },
  reviews: {
    fontSize: 14,
    color: '#666',
  },
  section: {
    marginBottom: 20,
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  text: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },
  fee: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0f5c4a',
  },
  specialties: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  badge: {
    backgroundColor: '#e4efe9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0f5c4a',
  },
  bookButton: {
    backgroundColor: '#0f5c4a',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  bookButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  error: {
    color: 'red',
    fontSize: 16,
  },
});
