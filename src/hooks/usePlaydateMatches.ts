import { useState, useEffect, useCallback } from 'react';
import { getPlaydateMatches, PlaydateMatch } from '../services/geo-matching';

interface UsePlaydateMatchesReturn {
  matches: PlaydateMatch[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export const usePlaydateMatches = (
  lat: number | null,
  lng: number | null,
  petId: string | null,
  radiusKm: number = 5,
  sort: 'score' | 'recent' = 'score',
): UsePlaydateMatchesReturn => {
  const [matches, setMatches] = useState<PlaydateMatch[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (lat === null || lng === null || !petId) {
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await getPlaydateMatches(lat, lng, petId, radiusKm, sort);
      setMatches(response.matches);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch matches');
      setMatches([]);
    } finally {
      setLoading(false);
    }
  }, [lat, lng, petId, radiusKm, sort]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    matches,
    loading,
    error,
    refresh,
  };
};
