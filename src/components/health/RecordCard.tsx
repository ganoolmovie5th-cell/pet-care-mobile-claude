import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface RecordCardProps {
  type: 'vaksin' | 'checkup' | 'medication' | 'surgery';
  date: string;
  note?: string;
  vetName?: string;
  nextDueDate?: string;
}

const typeIcons: Record<string, string> = {
  vaksin: '💉',
  checkup: '🩺',
  medication: '💊',
  surgery: '🏥',
};

const typeLabels: Record<string, string> = {
  vaksin: 'Vaccination',
  checkup: 'Check-up',
  medication: 'Medication',
  surgery: 'Surgery',
};

export const RecordCard: React.FC<RecordCardProps> = ({
  type,
  date,
  note,
  vetName,
  nextDueDate,
}) => {
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const isOverdue = nextDueDate && new Date(nextDueDate) <= new Date();

  return (
    <View style={isOverdue ? [styles.card, styles.overdue] : styles.card}>
      <View style={styles.header}>
        <Text style={styles.icon}>{typeIcons[type]}</Text>
        <View style={styles.titleSection}>
          <Text style={styles.type}>{typeLabels[type]}</Text>
          <Text style={styles.date}>{formatDate(date)}</Text>
        </View>
      </View>

      {note && <Text style={styles.note}>{note}</Text>}

      <View style={styles.footer}>
        {vetName && <Text style={styles.vet}>Vet: {vetName}</Text>}
        {nextDueDate && (
          <Text style={isOverdue ? [styles.nextDue, styles.overdueBadge] : styles.nextDue}>
            Next: {formatDate(nextDueDate)}
          </Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#0f5c4a',
  },
  overdue: {
    borderLeftColor: '#d32f2f',
    backgroundColor: '#ffebee',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  icon: {
    fontSize: 20,
  },
  titleSection: {
    flex: 1,
  },
  type: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  date: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  note: {
    fontSize: 12,
    color: '#555',
    marginBottom: 8,
    fontStyle: 'italic',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  vet: {
    fontSize: 11,
    color: '#0f5c4a',
    fontWeight: '500',
  },
  nextDue: {
    fontSize: 11,
    color: '#0f5c4a',
    fontWeight: '500',
  },
  overdueBadge: {
    color: '#d32f2f',
    fontWeight: '600',
  },
});
