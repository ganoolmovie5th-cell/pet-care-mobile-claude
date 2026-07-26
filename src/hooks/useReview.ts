import { useState } from 'react';
import {
  createReview as createReviewAPI,
  getReviewsForTarget,
  markReviewHelpful,
} from '../services/review';

export const useReview = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createReview = async (data: {
    userId: string;
    vetId: string;
    rating: number;
    text?: string;
    bookingId?: string;
  }): Promise<string> => {
    try {
      setLoading(true);
      setError(null);
      const result = await createReviewAPI(
        data.userId,
        data.vetId,
        'vet',
        data.rating,
        data.text,
        data.bookingId,
      );
      return result.id;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to create review';
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getReviewsForVet = async (
    vetId: string,
    sort: 'recent' | 'helpful' | 'rating' = 'recent',
    limit: number = 10,
    offset: number = 0,
  ) => {
    try {
      setLoading(true);
      setError(null);
      return await getReviewsForTarget(vetId, 'vet', sort, limit, offset);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch reviews';
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const markHelpful = async (reviewId: string) => {
    try {
      await markReviewHelpful(reviewId);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to mark review helpful';
      setError(msg);
      throw err;
    }
  };

  return {
    createReview,
    getReviewsForTarget: getReviewsForVet,
    markReviewHelpful: markHelpful,
    loading,
    error,
  };
};
