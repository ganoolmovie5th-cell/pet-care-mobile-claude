import React, { useEffect, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { useHealth } from '../../hooks/useHealth';
import { HealthRecord } from '../../services/health';
import { RecordCard } from '../../components/health/RecordCard';
import { RemindersWidget } from '../../components/health/RemindersWidget';

export const RemindersScreen: React.FC = () => {
  const { records, loading, error, getAllRecords } = useHealth();

  useEffect(() => {
    const loadRecords = async () => {
      await getAllRecords();
    };
    loadRecords();
  }, []);

  const upcomingRecords = useMemo(() => {
    const today = new Date();
    const sevenDaysFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

    return records
      .filter((r) => r.next_due_date)
      .filter((r) => {
        const dueDate = new Date(r.next_due_date!);
        return dueDate >= today && dueDate <= sevenDaysFromNow;
      })
      .sort((a, b) => {
        const dateA = new Date(a.next_due_date!);
        const dateB = new Date(b.next_due_date!);
        return dateA.getTime() - dateB.getTime();
      });
  }, [records]);

  const overdueRecords = useMemo(() => {
    const today = new Date();

    return records
      .filter((r) => r.next_due_date)
      .filter((r) => new Date(r.next_due_date!) < today)
      .sort((a, b) => {
        const dateA = new Date(a.next_due_date!);
        const dateB = new Date(b.next_due_date!);
        return dateB.getTime() - dateA.getTime();
      });
  }, [records]);

  const allReminders = [...overdueRecords, ...upcomingRecords];

  if (loading && records.length === 0) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0f5c4a" />
      </View>
    );
  }

  if (error && records.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Health Reminders</Text>

      <RemindersWidget
        totalRecords={records.filter((r) => r.next_due_date).length}
        overduCount={overdueRecords.length}
        upcomingCount={upcomingRecords.length}
      />

      {allReminders.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No reminders</Text>
          <Text style={styles.emptySubtext}>All health records are up to date</Text>
        </View>
      ) : (
        <FlatList
          data={allReminders}
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
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
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
  },
});
