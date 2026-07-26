import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useBookingSuggestions } from '../../hooks/useHealth';
import { getPetProfile } from '../../services/health';
import { Pet } from '../../types/health';

type HealthStackParamList = {
  BookingSuggestion: { petId: string };
};

type Props = NativeStackScreenProps<HealthStackParamList, 'BookingSuggestion'>;

const VACCINE_NAMES: Record<string, string> = {
  rabies: 'Rabies',
  dhpp: 'DHPP (Distemper, Hepatitis, Parvo, Parainfluenza)',
  dhlpp: 'DHLPP (Rabies included)',
  leptospirosis: 'Leptospirosis',
  bordatella: 'Bordetella',
  lyme: 'Lyme Disease',
  feline_viral: 'Feline Viral Rhinotracheitis',
  calicivirus: 'Calicivirus',
  panleukopenia: 'Panleukopenia',
  feline_leukemia: 'Feline Leukemia',
  fiv: 'FIV',
};

export default function BookingSuggestionScreen({ route, navigation }: Props) {
  const { petId } = route.params;
  const { suggestions, loading, error } = useBookingSuggestions(petId);
  const [pet, setPet] = useState<Pet | null>(null);
  const [petLoading, setPetLoading] = useState(true);

  useEffect(() => {
    const loadPet = async () => {
      try {
        setPetLoading(true);
        const petData = await getPetProfile(petId);
        setPet(petData);
      } catch (err) {
        Alert.alert('Error', 'Failed to load pet information');
      } finally {
        setPetLoading(false);
      }
    };
    loadPet();
  }, [petId]);

  if (loading || petLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0f5c4a" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>{error}</Text>
      </View>
    );
  }

  if (!suggestions || suggestions.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No Booking Suggestions</Text>
          <Text style={styles.emptySubtext}>
            {pet?.name}&apos;s vaccines are up to date. Great job keeping them healthy!
          </Text>
        </View>
      </View>
    );
  }

  const suggestion = suggestions[0];
  const vaccineNames = suggestion.overdueVaccines
    .map((id) => VACCINE_NAMES[id] || id)
    .join(', ');

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const handleCreateBooking = () => {
    navigation.navigate('Booking' as any, {
      petId,
      vaccineIds: suggestion.overdueVaccines,
      date: suggestion.suggestedDate,
      vetId: suggestion.vetId,
      notes: `Overdue vaccines: ${vaccineNames}`,
    });
  };

  const handleDismiss = () => {
    Alert.alert(
      'Dismiss Suggestion',
      'Are you sure you want to dismiss this booking suggestion?',
      [
        { text: 'Cancel', onPress: () => {} },
        {
          text: 'Dismiss',
          onPress: () => {
            navigation.goBack();
          },
        },
      ],
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.petName}>{pet?.name || 'Your Pet'}</Text>
        <Text style={styles.subtitle}>Vaccination Booking Suggestion</Text>
      </View>

      <View style={styles.suggestionCard}>
        <View style={styles.cardSectionBordered}>
          <Text style={styles.sectionTitle}>Overdue Vaccines</Text>
          <Text style={styles.vaccineList}>{vaccineNames}</Text>
        </View>

        <View style={suggestion.vetId ? styles.cardSectionBordered : styles.cardSection}>
          <Text style={styles.sectionTitle}>Suggested Booking Date</Text>
          <Text style={styles.dateText}>{formatDate(suggestion.suggestedDate)}</Text>
        </View>

        {suggestion.vetId && (
          <View style={styles.cardSection}>
            <Text style={styles.sectionTitle}>Preferred Vet</Text>
            <Text style={styles.vetText}>{suggestion.vetId}</Text>
          </View>
        )}
      </View>

      <View style={styles.actionContainer}>
        <TouchableOpacity style={styles.primaryButton} onPress={handleCreateBooking}>
          <Text style={styles.primaryButtonText}>Create Booking</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryButton} onPress={handleDismiss}>
          <Text style={styles.secondaryButtonText}>Dismiss</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fafafa',
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    marginBottom: 24,
  },
  petName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#0f5c4a',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  suggestionCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardSection: {
    marginBottom: 0,
  },
  cardSectionBordered: {
    paddingBottom: 16,
    borderBottomColor: '#eee',
    borderBottomWidth: 1,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0f5c4a',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  vaccineList: {
    fontSize: 15,
    color: '#333',
    lineHeight: 22,
  },
  dateText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#0f5c4a',
  },
  vetText: {
    fontSize: 15,
    color: '#333',
  },
  actionContainer: {
    gap: 12,
    marginBottom: 16,
  },
  primaryButton: {
    backgroundColor: '#0f5c4a',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: '#e8e8e8',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    minHeight: 300,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  error: {
    color: '#f44336',
    fontSize: 16,
    textAlign: 'center',
    paddingHorizontal: 16,
  },
});
