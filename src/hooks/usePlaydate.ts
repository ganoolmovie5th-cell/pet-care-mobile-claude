import { useState, useCallback } from 'react';
import {
  createPost,
  searchPostsNearby,
  getInterestedMatches,
  markInterest,
  acceptMatch,
  rejectMatch,
  PlaydatePost,
  PlaydateMatch,
} from '../services/playdate';

interface UsePlaydateReturn {
  posts: PlaydatePost[];
  matches: PlaydateMatch[];
  loading: boolean;
  error: string | null;
  createNewPost: (
    post: Omit<PlaydatePost, 'id' | 'created_at' | 'interested_owners'>
  ) => Promise<string | null>;
  searchNearby: (filters: {
    city: string;
    lat?: number;
    lng?: number;
    maxDistance?: number;
  }) => Promise<void>;
  fetchMatches: (postId: string) => Promise<void>;
  markInterested: (postId: string, ownerId: string, petId: string) => Promise<string | null>;
  acceptMatchHandler: (matchId: string) => Promise<boolean>;
  rejectMatchHandler: (matchId: string) => Promise<boolean>;
}

export const usePlaydate = (): UsePlaydateReturn => {
  const [posts, setPosts] = useState<PlaydatePost[]>([]);
  const [matches, setMatches] = useState<PlaydateMatch[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createNewPost = useCallback(
    async (post: Omit<PlaydatePost, 'id' | 'created_at' | 'interested_owners'>): Promise<string | null> => {
      try {
        setLoading(true);
        setError(null);
        const postId = await createPost(post);
        return postId;
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to create post';
        setError(msg);
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const searchNearby = useCallback(
    async (filters: {
      city: string;
      lat?: number;
      lng?: number;
      maxDistance?: number;
    }): Promise<void> => {
      try {
        setLoading(true);
        setError(null);
        const data = await searchPostsNearby(filters);
        setPosts(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to search posts');
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const fetchMatches = useCallback(async (postId: string): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      const data = await getInterestedMatches(postId);
      setMatches(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch matches');
    } finally {
      setLoading(false);
    }
  }, []);

  const markInterested = useCallback(
    async (postId: string, ownerId: string, petId: string): Promise<string | null> => {
      try {
        setLoading(true);
        setError(null);
        const matchId = await markInterest(postId, ownerId, petId);
        return matchId;
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to mark interest';
        setError(msg);
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const acceptMatchHandler = useCallback(async (matchId: string): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      await acceptMatch(matchId);
      setMatches(prev =>
        prev.map(m => (m.id === matchId ? { ...m, status: 'accepted' } : m))
      );
      return true;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to accept match';
      setError(msg);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const rejectMatchHandler = useCallback(async (matchId: string): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      await rejectMatch(matchId);
      setMatches(prev =>
        prev.map(m => (m.id === matchId ? { ...m, status: 'rejected' } : m))
      );
      return true;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to reject match';
      setError(msg);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    posts,
    matches,
    loading,
    error,
    createNewPost,
    searchNearby,
    fetchMatches,
    markInterested,
    acceptMatchHandler,
    rejectMatchHandler,
  };
};
