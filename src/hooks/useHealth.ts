import { useState, useCallback, useEffect } from 'react';
import {
  createPet,
  getPetsByOwner,
  addHealthRecord,
  getHealthRecordsByPet,
  getAllHealthRecords,
  HealthRecord,
  getVaccinationSchedule,
  getReminderPreferences,
  getBookingSuggestions,
  updateReminderPreferences as updateReminderPreferencesAPI,
} from '../services/health';
import {
  Pet,
  VaccinationSchedule,
  ReminderPreferences,
  BookingSuggestion,
} from '../types/health';

interface UseHealthReturn {
  pets: Pet[];
  records: HealthRecord[];
  loading: boolean;
  error: string | null;
  createNewPet: (pet: Omit<Pet, 'id' | 'createdAt'>) => Promise<string | null>;
  fetchPets: (ownerId: string) => Promise<void>;
  addRecord: (record: Omit<HealthRecord, 'id' | 'created_at'>) => Promise<string | null>;
  fetchRecords: (petId: string) => Promise<void>;
  getAllRecords: () => Promise<void>;
}

export const useHealth = (): UseHealthReturn => {
  const [pets, setPets] = useState<Pet[]>([]);
  const [records, setRecords] = useState<HealthRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createNewPet = useCallback(
    async (pet: Omit<Pet, 'id' | 'createdAt'>): Promise<string | null> => {
      try {
        setLoading(true);
        setError(null);
        const petId = await createPet(pet);
        setPets((prev) => [
          ...prev,
          { id: petId, ...pet, createdAt: new Date().toISOString() },
        ]);
        return petId;
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to create pet';
        setError(msg);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const fetchPets = useCallback(async (ownerId: string) => {
    try {
      setLoading(true);
      setError(null);
      const data = await getPetsByOwner(ownerId);
      setPets(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch pets');
    } finally {
      setLoading(false);
    }
  }, []);

  const addRecord = useCallback(
    async (record: Omit<HealthRecord, 'id' | 'created_at'>): Promise<string | null> => {
      try {
        setLoading(true);
        setError(null);
        const recordId = await addHealthRecord(record);
        return recordId;
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to add record';
        setError(msg);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const fetchRecords = useCallback(async (petId: string) => {
    try {
      setLoading(true);
      setError(null);
      const data = await getHealthRecordsByPet(petId);
      setRecords(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch records');
    } finally {
      setLoading(false);
    }
  }, []);

  const getAllRecords = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getAllHealthRecords();
      setRecords(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch records');
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    pets,
    records,
    loading,
    error,
    createNewPet,
    fetchPets,
    addRecord,
    fetchRecords,
    getAllRecords,
  };
};

export function useVaccinationSchedule(petId: string) {
  const [schedule, setSchedule] = useState<VaccinationSchedule | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getVaccinationSchedule(petId);
      setSchedule(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to fetch vaccination schedule',
      );
    } finally {
      setLoading(false);
    }
  }, [petId]);

  useEffect(() => {
    refetch();
  }, [petId, refetch]);

  return { schedule, loading, error, refetch };
}

export function useReminderPreferences() {
  const [prefs, setPrefs] = useState<ReminderPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getReminderPreferences();
      setPrefs(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to fetch reminder preferences',
      );
    } finally {
      setLoading(false);
    }
  }, []);

  const updatePrefs = useCallback(async (updates: Partial<ReminderPreferences>) => {
    try {
      await updateReminderPreferencesAPI(updates);
      setPrefs((prev) => (prev ? { ...prev, ...updates } : null));
    } catch (err) {
      const errMsg =
        err instanceof Error ? err.message : 'Failed to update reminder preferences';
      setError(errMsg);
      throw err;
    }
  }, []);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { prefs, loading, error, updatePrefs, refetch: fetch };
}

export function useBookingSuggestions(petId: string) {
  const [suggestions, setSuggestions] = useState<BookingSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getBookingSuggestions(petId);
      setSuggestions(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to fetch booking suggestions',
      );
    } finally {
      setLoading(false);
    }
  }, [petId]);

  useEffect(() => {
    refetch();
  }, [petId, refetch]);

  return { suggestions, loading, error, refetch };
}
