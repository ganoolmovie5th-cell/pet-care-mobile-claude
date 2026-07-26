import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  ActivityIndicator,
  Alert,
  TextInput,
} from 'react-native';
import { format } from 'date-fns';
import { Vaccine } from '../../types/health';
import { markVaccineComplete } from '../../services/health';

interface VaccineCardProps {
  vaccine: Vaccine;
  petId: string;
  scheduleId: string;
  onMarkComplete: () => void;
}

export const VaccineCard: React.FC<VaccineCardProps> = ({
  vaccine,
  petId: _petId,
  scheduleId,
  onMarkComplete,
}) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState(
    vaccine.nextDueDate ? format(new Date(vaccine.nextDueDate), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd')
  );
  const [vetName, setVetName] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleMarkComplete = async () => {
    if (!vetName.trim()) {
      Alert.alert('Error', 'Please enter vet name');
      return;
    }

    try {
      setSubmitting(true);
      await markVaccineComplete(
        scheduleId,
        vaccine.id,
        selectedDate,
        vetName,
        notes
      );

      setModalVisible(false);
      setVetName('');
      setNotes('');
      onMarkComplete();

      Alert.alert('Success', `${vaccine.name} marked as completed`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to mark vaccine complete';
      Alert.alert('Error', message);
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (): string => {
    switch (vaccine.status) {
      case 'completed':
        return '#4caf50';
      case 'due_soon':
        return '#ff9800';
      case 'overdue':
        return '#f44336';
      default:
        return '#9e9e9e';
    }
  };

  const getStatusLabel = (): string => {
    switch (vaccine.status) {
      case 'completed':
        return 'Completed';
      case 'due_soon':
        return 'Due Soon';
      case 'overdue':
        return 'Overdue';
      default:
        return 'Upcoming';
    }
  };

  const formatDateDisplay = (dateStr: string): string => {
    try {
      return format(new Date(dateStr), 'MMM dd, yyyy');
    } catch {
      return dateStr;
    }
  };

  return (
    <>
      <View style={styles.card}>
        <View style={styles.content}>
          <Text style={styles.vaccineName}>{vaccine.name}</Text>

          <View style={styles.detailsContainer}>
            <View style={styles.detail}>
              <Text style={styles.label}>Last Date</Text>
              <Text style={styles.value}>
                {vaccine.lastDate ? formatDateDisplay(vaccine.lastDate) : 'Not completed'}
              </Text>
            </View>

            <View style={styles.detail}>
              <Text style={styles.label}>Next Due</Text>
              <Text style={styles.value}>{formatDateDisplay(vaccine.nextDueDate)}</Text>
            </View>
          </View>

          <View
            style={[
              styles.badge,
              { backgroundColor: getStatusColor() },
            ]}
          >
            <Text style={styles.badgeText}>{getStatusLabel()}</Text>
          </View>
        </View>

        {vaccine.status !== 'completed' && (
          <TouchableOpacity
            style={styles.scheduleButton}
            onPress={() => setModalVisible(true)}
          >
            <Text style={styles.scheduleButtonText}>Schedule Vet</Text>
          </TouchableOpacity>
        )}
      </View>

      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Mark {vaccine.name} Complete</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <Text style={styles.fieldLabel}>Date Completed (YYYY-MM-DD)</Text>
              <TextInput
                style={styles.textInput}
                placeholder="yyyy-MM-dd"
                value={selectedDate}
                onChangeText={setSelectedDate}
                placeholderTextColor="#999"
              />

              <Text style={styles.fieldLabel}>Vet Name</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Enter vet name"
                value={vetName}
                onChangeText={setVetName}
                placeholderTextColor="#999"
              />

              <Text style={styles.fieldLabel}>Notes (Optional)</Text>
              <TextInput
                style={[styles.textInput, styles.notesInput]}
                placeholder="Add any notes"
                value={notes}
                onChangeText={setNotes}
                multiline
                placeholderTextColor="#999"
              />
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.submitButton]}
                onPress={handleMarkComplete}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.submitButtonText}>Mark Complete</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  content: {
    marginBottom: 12,
  },
  vaccineName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  detailsContainer: {
    marginBottom: 12,
  },
  detail: {
    marginBottom: 8,
  },
  label: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  value: {
    fontSize: 14,
    color: '#333',
    marginTop: 2,
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 8,
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  scheduleButton: {
    backgroundColor: '#0f5c4a',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  scheduleButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  closeButton: {
    fontSize: 20,
    color: '#999',
  },
  modalBody: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    marginTop: 12,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 16,
    minHeight: 44,
    fontSize: 14,
    color: '#333',
  },
  notesInput: {
    minHeight: 100,
    paddingTop: 12,
    textAlignVertical: 'top',
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#eee',
  },
  cancelButtonText: {
    color: '#333',
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: '#0f5c4a',
  },
  submitButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
});
