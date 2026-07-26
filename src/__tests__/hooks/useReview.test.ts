import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useReview } from '../../hooks/useReview';
import * as reviewService from '../../services/review';

jest.mock('../../services/review');

describe('useReview Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createReview', () => {
    it('creates review and returns success', async () => {
      (reviewService.createReview as jest.Mock).mockResolvedValue({
        id: 'review-123',
        verified: true,
      });

      const { result } = renderHook(() => useReview());

      let reviewId: string | null = null;
      await act(async () => {
        reviewId = await result.current.createReview({
          userId: 'user-123',
          vetId: 'vet-456',
          rating: 5,
          text: 'Great!',
          bookingId: 'booking-789',
        });
      });

      expect(reviewId).toBe('review-123');
      expect(reviewService.createReview).toHaveBeenCalled();
    });

    it('handles errors during review creation', async () => {
      (reviewService.createReview as jest.Mock).mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useReview());

      await expect(
        act(async () => {
          await result.current.createReview({
            userId: 'user-123',
            vetId: 'vet-456',
            rating: 5,
            text: 'Great!',
          });
        })
      ).rejects.toThrow('Network error');
    });
  });

  describe('getReviewsForTarget', () => {
    it('fetches reviews for vet', async () => {
      const mockReviews = [
        { id: '1', rating: 5, text: 'Excellent' },
        { id: '2', rating: 4, text: 'Good' },
      ];
      (reviewService.getReviewsForTarget as jest.Mock).mockResolvedValue(mockReviews);

      const { result } = renderHook(() => useReview());

      let reviews: any;
      await act(async () => {
        reviews = await result.current.getReviewsForTarget('vet-456', 'recent', 10);
      });

      expect(reviews).toEqual(mockReviews);
      expect(reviewService.getReviewsForTarget).toHaveBeenCalledWith('vet-456', 'vet', 'recent', 10, 0);
    });

    it('returns empty array when no reviews', async () => {
      (reviewService.getReviewsForTarget as jest.Mock).mockResolvedValue([]);

      const { result } = renderHook(() => useReview());

      let reviews: any;
      await act(async () => {
        reviews = await result.current.getReviewsForTarget('vet-unknown');
      });

      expect(reviews).toEqual([]);
    });
  });

  describe('markReviewHelpful', () => {
    it('increments helpful count', async () => {
      (reviewService.markReviewHelpful as jest.Mock).mockResolvedValue(undefined);

      const { result } = renderHook(() => useReview());

      await act(async () => {
        await result.current.markReviewHelpful('review-123');
      });

      expect(reviewService.markReviewHelpful).toHaveBeenCalledWith('review-123');
    });
  });
});
