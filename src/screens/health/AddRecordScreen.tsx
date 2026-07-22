import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { useHealth } from '../../hooks/useHealth';

interface AddRecordScreenProps {
  petId: string;
  onSave: () => void;
}

export const AddRecordScreen: React.FC<AddRecordScreenProps> = ({
  petId,
  onSave,
}) => {
  const { addRecord, loading } = useHealth();
  const [type, setType] = useState<'vaksin' | 'checkup' | 'medication' | 'surgery'>('vaksin');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [note, setNote] = useState('');
  const [vetName, setVetName] = useState('');
  const [nextDueDate, setNextDueDate] = useState('');

  const handleSubmit = async () => {
    if (!date) {
      Alert.alert('Error', 'Please select a date');
      return;
    }

    const success = await addRecord({
      petId,
      type,
      date,
      note: note || (undefined as any),
      vet_name: vetName || (undefined as any),
      next_due_date: nextDueDate || (undefined as any),
    });

    if (success) {
      Alert.alert('Success', 'Record added');
      onSave();
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0f5c4a" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Add Health Record</Text>

      <View style={styles.section}>
        <Text style={styles.label}>Type</Text>
        <View style={styles.typeButtons}>
          {(['vaksin', 'checkup', 'medication', 'surgery'] as const).map((t) => (
            <TouchableOpacity
              key={t}
              style={[
                styles.typeButton,
                type === t && styles.typeButtonActive,
              ]}
              onPress={() => setType(t)}
            >
              <Text
                style={[
                  styles.typeButtonText,
                  type === t && styles.typeButtonTextActive,
                ]}
              >
                {t === 'vaksin' ? 'Vaccination' : t === 'checkup' ? 'Check-up' : t === 'medication' ? 'Medication' : 'Surgery'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Date (YYYY-MM-DD)</Text>
        <TextInput
          style={styles.input}
          placeholder="2026-07-22"
          value={date}
          onChangeText={setDate}
          placeholderTextColor="#aaa"
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Vet Name (Optional)</Text>
        <TextInput
          style={styles.input}
          placeholder="Dr. Smith"
          value={vetName}
          onChangeText={setVetName}
          placeholderTextColor="#aaa"
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Notes (Optional)</Text>
        <TextInput
          style={[styles.input, styles.textarea]}
          placeholder="Add any notes..."
          value={note}
          onChangeText={setNote}
          placeholderTextColor="#aaa"
          multiline
          numberOfLines={4}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Next Due Date (Optional, YYYY-MM-DD)</Text>
        <TextInput
          style={styles.input}
          placeholder="2026-10-22"
          value={nextDueDate}
          onChangeText={setNextDueDate}
          placeholderTextColor="#aaa"
        />
      </View>

      <TouchableOpacity
        style={styles.submitButton}
        onPress={handleSubmit}
        disabled={loading}
      >
        <Text style={styles.submitButtonText}>Save Record</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fafafa',
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
    marginBottom: 20,
  },
  section: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  textarea: {
    textAlignVertical: 'top',
    paddingVertical: 12,
  },
  typeButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  typeButton: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#f5f5f5',
    borderRadius: 6,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ddd',
  },
  typeButtonActive: {
    backgroundColor: '#0f5c4a',
    borderColor: '#0f5c4a',
  },
  typeButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
  },
  typeButtonTextActive: {
    color: '#fff',
  },
  submitButton: {
    backgroundColor: '#0f5c4a',
    paddingVertical: 14,
    borderRadius: 6,
    alignItems: 'center',
    marginBottom: 20,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
