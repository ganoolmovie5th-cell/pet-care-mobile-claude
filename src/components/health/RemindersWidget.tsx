import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface RemindersWidgetProps {
  totalRecords: number;
  overduCount: number;
  upcomingCount: number;
}

export const RemindersWidget: React.FC<RemindersWidgetProps> = ({
  totalRecords,
  overduCount,
  upcomingCount,
}) => {
  return (
    <View style={styles.widget}>
      <View style={styles.badge}>
        <Text style={styles.badgeTitle}>Health Reminders</Text>
        <View style={styles.stats}>
          {overduCount > 0 && (
            <View style={styles.stat}>
              <Text style={styles.overdueBadge}>{overduCount}</Text>
              <Text style={styles.statLabel}>Overdue</Text>
            </View>
          )}
          {upcomingCount > 0 && (
            <View style={styles.stat}>
              <Text style={styles.upcomingBadge}>{upcomingCount}</Text>
              <Text style={styles.statLabel}>Due Soon</Text>
            </View>
          )}
          {overduCount === 0 && upcomingCount === 0 && (
            <Text style={styles.allClear}>✓ All caught up!</Text>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  widget: {
    marginBottom: 16,
  },
  badge: {
    backgroundColor: '#f0f8f6',
    borderRadius: 8,
    padding: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#0f5c4a',
  },
  badgeTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0f5c4a',
    marginBottom: 8,
  },
  stats: {
    flexDirection: 'row',
    gap: 16,
  },
  stat: {
    alignItems: 'center',
  },
  overdueBadge: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#d32f2f',
  },
  upcomingBadge: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ff9800',
  },
  statLabel: {
    fontSize: 11,
    color: '#666',
    marginTop: 4,
  },
  allClear: {
    fontSize: 14,
    color: '#0f5c4a',
    fontWeight: '600',
  },
});
