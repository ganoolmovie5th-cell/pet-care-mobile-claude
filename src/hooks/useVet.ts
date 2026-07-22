import { useState, useCallback } from 'react';
import { getAllVets, getVetById, searchVets, Vet } from '../services/vet';

interface UseVetReturn {
  vets: Vet[];
  loading: boolean;
  error: string | null;
  fetchAllVets: () => Promise<void>;
  fetchVetById: (vetId: string) => Promise<Vet | null>;
  searchVetsByFilters: (filters: {
    city?: string;
    specialty?: string;
    minRating?: number;
    maxDistance?: number;
    lat?: number;
    lng?: number;
  }) => Promise<void>;
}

export const useVet = (): UseVetReturn => {
  const [vets, setVets] = useState<Vet[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAllVets = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getAllVets();
      setVets(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch vets');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchVetById = useCallback(async (vetId: string): Promise<Vet | null> => {
    try {
      setLoading(true);
      setError(null);
      const vet = await getVetById(vetId);
      return vet;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch vet');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const searchVetsByFilters = useCallback(
    async (filters: {
      city?: string;
      specialty?: string;
      minRating?: number;
      maxDistance?: number;
      lat?: number;
      lng?: number;
    }) => {
      try {
        setLoading(true);
        setError(null);
        const data = await searchVets(filters);
        setVets(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to search vets');
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return {
    vets,
    loading,
    error,
    fetchAllVets,
    fetchVetById,
    searchVetsByFilters,
  };
};
