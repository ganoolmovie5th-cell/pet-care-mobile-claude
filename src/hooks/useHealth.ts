import { useState, useCallback } from 'react';
import { createPet, getPetsByOwner, addHealthRecord, getHealthRecordsByPet, getAllHealthRecords, Pet, HealthRecord } from '../services/health';

interface UseHealthReturn {
  pets: Pet[];
  records: HealthRecord[];
  loading: boolean;
  error: string | null;
  createNewPet: (pet: Omit<Pet, 'id' | 'created_at'>) => Promise<string | null>;
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

  const createNewPet = useCallback(async (pet: Omit<Pet, 'id' | 'created_at'>): Promise<string | null> => {
    try {
      setLoading(true);
      setError(null);
      const petId = await createPet(pet);
      setPets(prev => [...prev, { id: petId, ...pet, created_at: new Date().toISOString() }]);
      return petId;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to create pet';
      setError(msg);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

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

  const addRecord = useCallback(async (record: Omit<HealthRecord, 'id' | 'created_at'>): Promise<string | null> => {
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
  }, []);

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
