import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Switch,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useReminderPreferences } from '../../hooks/useHealth';
import { HealthStackParamList } from '../../navigation/HealthStack';

type Props = NativeStackScreenProps<HealthStackParamList, 'ReminderPreferences'>;

const VACCINES = [
  { id: 'rabies', name: 'Rabies' },
  { id: 'dhpp', name: 'DHPP' },
  { id: 'bordetella', name: 'Bordetella' },
  { id: 'lepto', name: 'Leptospirosis' },
  { id: 'lyme', name: 'Lyme' },
];

export default function ReminderPreferencesScreen({ navigation }: Props) {
  const { prefs, loading, error: prefError, updatePrefs } = useReminderPreferences();
  const [smsEnabled, setSmsEnabled] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(false);
  const [reminderDays, setReminderDays] = useState(7);
  const [mutedVaccines, setMutedVaccines] = useState<string[]>([]);
  const [updating, setUpdating] = useState(false);

  // Initialize state from prefs when loaded
  React.useEffect(() => {
    if (prefs) {
      setSmsEnabled(prefs.smsEnabled);
      setPushEnabled(prefs.pushEnabled);
      setReminderDays(prefs.reminderDaysBefore);
      setMutedVaccines(prefs.mutedVaccines || []);
    }
  }, [prefs]);

  const handleToggleSMS = async (value: boolean) => {
    setSmsEnabled(value);
    await handleSave({ smsEnabled: value });
  };

  const handleTogglePush = async (value: boolean) => {
    setPushEnabled(value);
    await handleSave({ pushEnabled: value });
  };

  const handleChangeDays = async (days: number) => {
    setReminderDays(days);
    await handleSave({ reminderDaysBefore: days });
  };

  const handleToggleVaccine = async (vaccineId: string) => {
    const updated = mutedVaccines.includes(vaccineId)
      ? mutedVaccines.filter((id) => id !== vaccineId)
      : [...mutedVaccines, vaccineId];
    setMutedVaccines(updated);
    await handleSave({ mutedVaccines: updated });
  };

  const handleSave = async (updates: Record<string, any>) => {
    try {
      setUpdating(true);
      await updatePrefs(updates);
    } catch (err) {
      Alert.alert(
        'Error',
        err instanceof Error ? err.message : 'Failed to save preferences'
      );
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0f5c4a" />
      </View>
    );
  }

  if (prefError && !prefs) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>{prefError}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Reminder Preferences</Text>

      {/* Notifications Section */}
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionHeader}>Notifications</Text>

        <View style={styles.toggleRow}>
          <Text style={styles.toggleLabel}>SMS Notifications</Text>
          <Switch
            value={smsEnabled}
            onValueChange={handleToggleSMS}
            trackColor={{ false: '#ddd', true: '#81c784' }}
            thumbColor={smsEnabled ? '#4caf50' : '#f4f3f4'}
            disabled={updating}
          />
        </View>

        <View style={styles.toggleRow}>
          <Text style={styles.toggleLabel}>Push Notifications</Text>
          <Switch
            value={pushEnabled}
            onValueChange={handleTogglePush}
            trackColor={{ false: '#ddd', true: '#81c784' }}
            thumbColor={pushEnabled ? '#4caf50' : '#f4f3f4'}
            disabled={updating}
          />
        </View>
      </View>

      {/* Timing Section */}
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionHeader}>Reminder Timing</Text>

        <Text style={styles.sliderLabel}>
          Remind me {reminderDays} day{reminderDays !== 1 ? 's' : ''} before due date
        </Text>

        <View style={styles.sliderContainer}>
          <Text style={styles.sliderMin}>1 day</Text>
          <View style={styles.sliderTrack}>
            <View
              style={[
                styles.sliderFill,
                { width: `${((reminderDays - 1) / 29) * 100}%` },
              ]}
            />
          </View>
          <Text style={styles.sliderMax}>30 days</Text>
        </View>

        <View style={styles.sliderButtonsContainer}>
          {[1, 7, 14, 21, 30].map((day) => (
            <TouchableOpacity
              key={day}
              style={[
                styles.dayButton,
                reminderDays === day && styles.dayButtonActive,
              ]}
              onPress={() => handleChangeDays(day)}
              disabled={updating}
            >
              <Text
                style={[
                  styles.dayButtonText,
                  reminderDays === day && styles.dayButtonTextActive,
                ]}
              >
                {day}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Muted Vaccines Section */}
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionHeader}>Muted Vaccines</Text>
        <Text style={styles.sectionDescription}>
          Disable reminders for specific vaccines
        </Text>

        {VACCINES.map((vaccine, index) => (
          <View
            key={vaccine.id}
            style={[
              styles.vaccineRow,
              index < VACCINES.length - 1 && styles.vaccineRowWithBorder,
            ]}
          >
            <TouchableOpacity
              style={styles.vaccineCheckbox}
              onPress={() => handleToggleVaccine(vaccine.id)}
              disabled={updating}
            >
              <View
                style={[
                  styles.checkbox,
                  mutedVaccines.includes(vaccine.id) &&
                    styles.checkboxActive,
                ]}
              >
                {mutedVaccines.includes(vaccine.id) && (
                  <Text style={styles.checkmark}>✓</Text>
                )}
              </View>
              <Text style={styles.vaccineLabel}>{vaccine.name}</Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>

      <View style={styles.spacer} />
    </ScrollView>
  );
}

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
    marginBottom: 24,
    color: '#333',
  },
  sectionContainer: {
    marginBottom: 24,
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingTop: 12,
    overflow: 'hidden',
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: 'bold',
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: '#666',
  },
  sectionDescription: {
    fontSize: 12,
    color: '#999',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  toggleLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  sliderLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    paddingHorizontal: 16,
    paddingTop: 12,
    marginBottom: 12,
  },
  sliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 16,
    gap: 8,
  },
  sliderMin: {
    fontSize: 12,
    color: '#999',
    width: 40,
  },
  sliderTrack: {
    flex: 1,
    height: 4,
    backgroundColor: '#ddd',
    borderRadius: 2,
    overflow: 'hidden',
  },
  sliderFill: {
    height: '100%',
    backgroundColor: '#0f5c4a',
  },
  sliderMax: {
    fontSize: 12,
    color: '#999',
    width: 40,
    textAlign: 'right',
  },
  sliderButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 8,
  },
  dayButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  dayButtonActive: {
    backgroundColor: '#0f5c4a',
    borderColor: '#0f5c4a',
  },
  dayButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  dayButtonTextActive: {
    color: '#fff',
  },
  vaccineRow: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  vaccineRowWithBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  vaccineCheckbox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#ddd',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  checkboxActive: {
    backgroundColor: '#0f5c4a',
    borderColor: '#0f5c4a',
  },
  checkmark: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  vaccineLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  error: {
    color: '#d32f2f',
    fontSize: 16,
    textAlign: 'center',
  },
  spacer: {
    height: 20,
  },
});
