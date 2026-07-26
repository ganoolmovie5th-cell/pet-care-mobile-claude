import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Pet,
  VaccinationSchedule,
  Reminder,
  ReminderPreferences,
  BookingSuggestion,
} from '../types/health';

export interface HealthRecord {
  id: string;
  petId: string;
  type: 'vaksin' | 'checkup' | 'medication' | 'surgery';
  date: string;
  note: string;
  vet_name?: string;
  next_due_date?: string;
  created_at: string;
}

const apiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:5000';

export const createPet = async (pet: Omit<Pet, 'id' | 'created_at'>): Promise<string> => {
  const response = await axios.post(`${apiBaseUrl}/health/pets`, pet);
  return response.data.id;
};

export const getPetsByOwner = async (ownerId: string): Promise<Pet[]> => {
  const response = await axios.get(`${apiBaseUrl}/health/pets/owner/${ownerId}`);
  return response.data;
};

export const addHealthRecord = async (record: Omit<HealthRecord, 'id' | 'created_at'>): Promise<string> => {
  const response = await axios.post(`${apiBaseUrl}/health/records`, record);
  return response.data.id;
};

export const getHealthRecordsByPet = async (petId: string): Promise<HealthRecord[]> => {
  const response = await axios.get(`${apiBaseUrl}/health/records/pet/${petId}`);
  return response.data;
};

export const getAllHealthRecords = async (): Promise<HealthRecord[]> => {
  const response = await axios.get(`${apiBaseUrl}/health/records`);
  return response.data;
};

// Pet Profile API + cache
export const getPetProfile = async (petId: string): Promise<Pet> => {
  const cached = await AsyncStorage.getItem(`pet_${petId}`).catch(() => null);
  if (cached) return JSON.parse(cached);
  const response = await axios.get(`${apiBaseUrl}/health/pets/${petId}`);
  const pet = response.data as Pet;
  await AsyncStorage.setItem(`pet_${petId}`, JSON.stringify(pet)).catch(() => {});
  return pet;
};

export const updatePetProfile = async (petId: string, updates: Partial<Pet>): Promise<void> => {
  await axios.patch(`${apiBaseUrl}/health/pets/${petId}`, updates);
  await AsyncStorage.removeItem(`pet_${petId}`).catch(() => {});
};

// Vaccination Schedule API + cache
export const getVaccinationSchedule = async (petId: string): Promise<VaccinationSchedule> => {
  const cached = await AsyncStorage.getItem(`schedule_${petId}`).catch(() => null);
  if (cached) return JSON.parse(cached);
  const response = await axios.get(`${apiBaseUrl}/health/pets/${petId}/vaccination-schedule`);
  const schedule = response.data as VaccinationSchedule;
  await AsyncStorage.setItem(`schedule_${petId}`, JSON.stringify(schedule)).catch(() => {});
  return schedule;
};

// Reminders
export const getReminderPreferences = async (): Promise<ReminderPreferences> => {
  const response = await axios.get(`${apiBaseUrl}/health/reminders/preferences`);
  return response.data as ReminderPreferences;
};

export const updateReminderPreferences = async (prefs: Partial<ReminderPreferences>): Promise<void> => {
  await axios.patch(`${apiBaseUrl}/health/reminders/preferences`, prefs);
};

export const getReminders = async (): Promise<Reminder[]> => {
  const response = await axios.get(`${apiBaseUrl}/health/reminders`);
  return response.data as Reminder[];
};

export const dismissReminder = async (reminderId: string): Promise<void> => {
  await axios.post(`${apiBaseUrl}/health/reminders/${reminderId}/dismiss`);
};

// Booking Suggestions
export const getBookingSuggestions = async (petId: string): Promise<BookingSuggestion[]> => {
  const response = await axios.get(`${apiBaseUrl}/health/pets/${petId}/booking-suggestions`);
  return response.data as BookingSuggestion[];
};

// Vaccine Complete
export const markVaccineComplete = async (
  scheduleId: string,
  vaccineId: string,
  date: string,
  vetName: string,
  notes: string
): Promise<void> => {
  await axios.patch(`${apiBaseUrl}/health/vaccination-schedules/${scheduleId}/vaccines/${vaccineId}`, {
    lastDate: date,
    vetName,
    notes,
  });
  await AsyncStorage.removeItem(`schedule_${scheduleId}`).catch(() => {});
};
