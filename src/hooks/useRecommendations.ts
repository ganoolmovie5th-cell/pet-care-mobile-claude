import { useState, useEffect, useCallback } from 'react';
import { getRecommendedVets, RecommendedVet } from '../services/recommendations';

interface UseRecommendationsReturn {
  recommendations: RecommendedVet[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export const useRecommendations = (
  ownerId: string | null,
  lat: number | null,
  lng: number | null,
  petId: string | null,
  limit: number = 10
): UseRecommendationsReturn => {
  const [recommendations, setRecommendations] = useState<RecommendedVet[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!ownerId || lat === null || lng === null || !petId) {
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await getRecommendedVets(ownerId, lat, lng, petId, limit);
      setRecommendations(response.recommended_vets);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch recommendations');
      setRecommendations([]);
    } finally {
      setLoading(false);
    }
  }, [ownerId, lat, lng, petId, limit]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    recommendations,
    loading,
    error,
    refresh,
  };
};
