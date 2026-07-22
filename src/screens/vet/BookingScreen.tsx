import React, { useState, useContext } from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { AuthContext } from '../../context/AuthContext';
import { useBooking } from '../../hooks/useBooking';

interface BookingScreenProps {
  vetId: string;
  vetName: string;
  onBookingComplete: (bookingId: string) => void;
}

export const BookingScreen: React.FC<BookingScreenProps> = ({ vetId, vetName, onBookingComplete }) => {
  const { user } = useContext(AuthContext);
  const { loading, error, createNewBooking } = useBooking();
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [petId, setPetId] = useState('');
  const [notes, setNotes] = useState('');

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
      onBookingComplete(bookingId);
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
        <Text style={styles.label}>Pet ID</Text>
        <TextInput
          style={styles.input}
          placeholder="Your pet ID"
          value={petId}
          onChangeText={setPetId}
          editable={!loading}
        />
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
