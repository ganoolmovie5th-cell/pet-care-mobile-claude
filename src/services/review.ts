import { api } from './api';

export interface Review {
  id: string;
  reviewerId: string;
  targetId: string;
  type: 'vet' | 'owner';
  bookingId?: string;
  rating: number;
  text?: string;
  verified: boolean;
  helpful_count: number;
  created_at: string;
}

export interface ReviewsResponse {
  reviews: Review[];
  total: number;
}

export interface VetRatingSummary {
  rating: number;
  review_count: number;
  rating_distribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
}

export const createReview = async (
  reviewerId: string,
  targetId: string,
  type: 'vet' | 'owner',
  rating: number,
  text?: string,
  bookingId?: string
): Promise<{ id: string; verified: boolean }> => {
  const response = await api.post('/reviews', {
    reviewerId,
    targetId,
    type,
    rating,
    text,
    bookingId,
  });
  return response.data;
};

export const getReviewsForTarget = async (
  targetId: string,
  type: 'vet' | 'owner' = 'vet',
  sort: 'recent' | 'helpful' | 'rating' = 'recent',
  limit: number = 10,
  offset: number = 0
): Promise<ReviewsResponse> => {
  const response = await api.get(`/reviews/${targetId}`, {
    params: { type, sort, limit, offset },
  });
  return response.data;
};

export const getVetRatingSummary = async (vetId: string): Promise<VetRatingSummary> => {
  const response = await api.get(`/reviews/vets/${vetId}/summary`);
  return response.data;
};

export const markReviewHelpful = async (reviewId: string): Promise<void> => {
  await api.post(`/reviews/${reviewId}/helpful`);
};
