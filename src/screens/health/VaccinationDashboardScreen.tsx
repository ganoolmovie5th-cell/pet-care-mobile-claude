import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useVaccinationSchedule } from '../../hooks/useHealth';
import { Vaccine } from '../../types/health';
import { VaccineCard } from '../../components/health/VaccineCard';

type HealthStackParamList = {
  VaccinationDashboard: { petId: string };
};

type Props = NativeStackScreenProps<HealthStackParamList, 'VaccinationDashboard'>;

interface GroupedVaccines {
  upToDate: Vaccine[];
  dueSoon: Vaccine[];
  overdue: Vaccine[];
  upcoming: Vaccine[];
}

const groupVaccinesByStatus = (vaccines: Vaccine[]): GroupedVaccines => {
  return {
    upToDate: vaccines.filter(
      (v) => v.status === 'completed' && v.lastDate
    ),
    dueSoon: vaccines.filter((v) => v.status === 'due_soon'),
    overdue: vaccines.filter((v) => v.status === 'overdue'),
    upcoming: vaccines.filter((v) => v.status === 'upcoming'),
  };
};

interface SectionData {
  title: string;
  vaccines: Vaccine[];
  isEmpty: boolean;
}

export default function VaccinationDashboardScreen({ route }: Props) {
  const { petId } = route.params;
  const { schedule, loading, error, refetch } = useVaccinationSchedule(petId);

  const sections = useMemo<SectionData[]>(() => {
    if (!schedule) return [];

    const grouped = groupVaccinesByStatus(schedule.vaccines);

    return [
      { title: 'Up-to-Date', vaccines: grouped.upToDate, isEmpty: false },
      { title: 'Due Soon', vaccines: grouped.dueSoon, isEmpty: false },
      { title: 'Overdue', vaccines: grouped.overdue, isEmpty: false },
      { title: 'Upcoming', vaccines: grouped.upcoming, isEmpty: false },
    ];
  }, [schedule]);

  const handleMarkComplete = () => {
    refetch();
  };

  const renderSection = (section: SectionData) => {
    if (section.vaccines.length === 0) {
      return null;
    }

    return (
      <View key={section.title} style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{section.title}</Text>
          <Text style={styles.sectionCount}>{section.vaccines.length}</Text>
        </View>

        {section.vaccines.map((vaccine) => (
          <VaccineCard
            key={vaccine.id}
            vaccine={vaccine}
            petId={petId}
            scheduleId={schedule?.id || ''}
            onMarkComplete={handleMarkComplete}
          />
        ))}
      </View>
    );
  };

  if (loading && !schedule) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0f5c4a" />
      </View>
    );
  }

  if (error && !schedule) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>{error}</Text>
      </View>
    );
  }

  const activeSections = sections.filter((s) => s.vaccines.length > 0);
  const emptyState = activeSections.length === 0;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.petName}>{schedule?.petName || 'Pet'}</Text>
        <Text style={styles.headerSubtitle}>Vaccination Status</Text>
      </View>

      <FlatList
        data={activeSections}
        keyExtractor={(item) => item.title}
        renderItem={({ item }) => renderSection(item)}
        scrollEnabled
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={refetch}
            tintColor="#0f5c4a"
          />
        }
        contentContainerStyle={emptyState ? styles.emptyContainer : undefined}
        ListEmptyComponent={
          emptyState ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No vaccines found</Text>
              <Text style={styles.emptySubtext}>
                Add vaccination records to track {schedule?.petName}&apos;s health
              </Text>
            </View>
          ) : null
        }
        style={styles.list}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fafafa',
  },
  header: {
    backgroundColor: '#0f5c4a',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  petName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
  },
  section: {
    paddingHorizontal: 16,
    marginVertical: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#0f5c4a',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  sectionCount: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.9)',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  list: {
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  error: {
    color: '#f44336',
    fontSize: 16,
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  emptyContainer: {
    flexGrow: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});
