export interface PlaydateReview {
  id: string;
  postId: string;
  reviewerId: string;
  revieweeId: string;
  rating: 1 | 2 | 3 | 4 | 5;
  text?: string;
  created_at: string;
}

export interface OwnerRating {
  userId: string;
  avgRating: number;
  totalReviews: number;
  lastReviewDate?: string;
}
