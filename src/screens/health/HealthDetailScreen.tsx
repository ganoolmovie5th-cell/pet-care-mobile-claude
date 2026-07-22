import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { useHealth } from '../../hooks/useHealth';
import { HealthRecord } from '../../services/health';
import { RecordCard } from '../../components/health/RecordCard';

interface HealthDetailScreenProps {
  petId: string;
  petName: string;
  onAddRecord: (petId: string) => void;
}

export const HealthDetailScreen: React.FC<HealthDetailScreenProps> = ({
  petId,
  petName,
  onAddRecord,
}) => {
  const { records, loading, error, fetchRecords } = useHealth();
  const [petRecords, setPetRecords] = useState<HealthRecord[]>([]);

  useEffect(() => {
    const loadRecords = async () => {
      await fetchRecords(petId);
    };
    loadRecords();
  }, [petId]);

  useEffect(() => {
    setPetRecords(records.filter((r) => r.petId === petId));
  }, [records, petId]);

  if (loading && petRecords.length === 0) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0f5c4a" />
      </View>
    );
  }

  if (error && petRecords.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{petName}</Text>
        <Text style={styles.subtitle}>Health Records</Text>
      </View>

      <TouchableOpacity
        style={styles.addButton}
        onPress={() => onAddRecord(petId)}
      >
        <Text style={styles.addButtonText}>+ Add Record</Text>
      </TouchableOpacity>

      {petRecords.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No records yet</Text>
          <Text style={styles.emptySubtext}>
            Start tracking {petName}'s health with a record
          </Text>
        </View>
      ) : (
        <FlatList
          data={petRecords}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <RecordCard
              type={item.type}
              date={item.date}
              note={item.note}
              vetName={item.vet_name}
              nextDueDate={item.next_due_date}
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
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  addButton: {
    backgroundColor: '#0f5c4a',
    paddingVertical: 12,
    borderRadius: 6,
    alignItems: 'center',
    marginBottom: 16,
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
    textAlign: 'center',
  },
});
