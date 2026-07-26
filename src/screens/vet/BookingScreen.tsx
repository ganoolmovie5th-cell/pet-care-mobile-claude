import React, { useState, useContext, useEffect } from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet, Alert } from 'react-native';
import { AuthContext } from '../../context/AuthContext';
import { useBooking } from '../../hooks/useBooking';
import { useHealth } from '../../hooks/useHealth';

interface BookingScreenProps {
  vetId: string;
  vetName: string;
  onBookingComplete: (bookingId: string, petName: string) => void;
}

export const BookingScreen: React.FC<BookingScreenProps> = ({
  vetId,
  vetName,
  onBookingComplete,
}) => {
  const { user } = useContext(AuthContext);
  const { loading, error, createNewBooking } = useBooking();
  const { pets, fetchPets } = useHealth();
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [petId, setPetId] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (user) fetchPets(user.uid);
  }, [user, fetchPets]);

  const handleBook = async () => {
    if (!date || !time || !petId) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (!user) {
      Alert.alert('Error', 'You must be logged in to book');
      return;
    }

    const bookingId = await createNewBooking({
      ownerId: user.uid,
      petId,
      vetId,
      date,
      time,
      notes: notes || undefined,
      status: 'pending',
      payment_status: 'pending',
    });

    if (bookingId) {
      Alert.alert('Success', 'Appointment booked!');
      const petName = pets.find((p) => p.id === petId)?.name || 'Pet';
      onBookingComplete(bookingId, petName);
    } else {
      Alert.alert('Error', error || 'Failed to book appointment');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Book with {vetName}</Text>

      <View style={styles.section}>
        <Text style={styles.label}>Date (YYYY-MM-DD)</Text>
        <TextInput
          style={styles.input}
          placeholder="2024-01-15"
          value={date}
          onChangeText={setDate}
          editable={!loading}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Time (HH:MM)</Text>
        <TextInput
          style={styles.input}
          placeholder="14:30"
          value={time}
          onChangeText={setTime}
          editable={!loading}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Pet</Text>
        {pets.length === 0 ? (
          <Text style={styles.empty}>No pets yet. Add one in the Health tab first.</Text>
        ) : (
          // ponytail: plain tappable rows, not a picker lib. An owner has a
          // handful of pets, so a scrolling list buys nothing here.
          pets.map((pet) => (
            <TouchableOpacity
              key={pet.id}
              style={[styles.petRow, petId === pet.id && styles.petRowSelected]}
              onPress={() => setPetId(pet.id)}
              disabled={loading}
            >
              <Text style={styles.petName}>{pet.name}</Text>
              <Text style={styles.petBreed}>{pet.breed}</Text>
            </TouchableOpacity>
          ))
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Notes (optional)</Text>
        <TextInput
          style={[styles.input, styles.textarea]}
          placeholder="Any special requests?"
          value={notes}
          onChangeText={setNotes}
          multiline
          editable={!loading}
        />
      </View>

      {error && <Text style={styles.error}>{error}</Text>}

      <TouchableOpacity
        style={[styles.bookButton, loading && styles.bookButtonDisabled]}
        onPress={handleBook}
        disabled={loading}
      >
        <Text style={styles.bookButtonText}>
          {loading ? 'Booking...' : 'Confirm Booking'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
  },
  section: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 12,
    borderRadius: 8,
    fontSize: 14,
  },
  textarea: {
    height: 100,
    textAlignVertical: 'top',
  },
  empty: {
    fontSize: 14,
    color: '#666',
  },
  petRow: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  petRowSelected: {
    borderColor: '#0f5c4a',
    backgroundColor: '#e8f3f0',
  },
  petName: {
    fontSize: 14,
    fontWeight: '600',
  },
  petBreed: {
    fontSize: 12,
    color: '#666',
  },
  error: {
    color: 'red',
    marginBottom: 16,
    fontSize: 14,
  },
  bookButton: {
    backgroundColor: '#0f5c4a',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  bookButtonDisabled: {
    opacity: 0.6,
  },
  bookButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
