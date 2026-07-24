import { useState } from 'react';
import { createReview as createReviewAPI, getReviewsForTarget, markReviewHelpful } from '../services/review';

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
      const id = await createReviewAPI({
        reviewerId: data.userId,
        targetId: data.vetId,
        type: 'vet',
        rating: data.rating,
        text: data.text,
        bookingId: data.bookingId,
        verified: true,
      });
      return id;
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
    offset: number = 0
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
