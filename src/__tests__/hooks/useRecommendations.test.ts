import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useRecommendations } from '../../hooks/useRecommendations';
import * as recService from '../../services/recommendations';

jest.mock('../../services/recommendations');

const LAT = -6.2;
const LNG = 106.8;

const mockRecommended = [
  {
    id: 'vet_1',
    clinic_name: 'Klinik Sehat',
    consultation_fee: 150000,
    rating: 4.5,
    distance_km: 2.3,
    rank_reason: 'Dekat & rating tinggi',
    recommendation_score: 0.92,
  },
] as any;

describe('useRecommendations', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('fetches once every argument is present', async () => {
    (recService.getRecommendedVets as jest.Mock).mockResolvedValue({
      recommended_vets: mockRecommended,
    });

    const { result } = renderHook(() =>
      useRecommendations('user_1', LAT, LNG, 'pet_1', 5),
    );

    await waitFor(() => expect(result.current.recommendations).toHaveLength(1));

    expect(recService.getRecommendedVets).toHaveBeenCalledWith(
      'user_1',
      LAT,
      LNG,
      'pet_1',
      5,
    );
    expect(result.current.recommendations[0].rank_reason).toBe('Dekat & rating tinggi');
    expect(result.current.loading).toBe(false);
  });

  it.each([
    ['ownerId null', null, LAT, LNG, 'pet_1'],
    ['lat null', 'user_1', null, LNG, 'pet_1'],
    ['lng null', 'user_1', LAT, null, 'pet_1'],
    ['petId null', 'user_1', LAT, LNG, null],
  ])('skips the request when %s', async (_label, ownerId, lat, lng, petId) => {
    const { result } = renderHook(() =>
      useRecommendations(ownerId as any, lat as any, lng as any, petId as any),
    );

    await act(async () => {
      await result.current.refresh();
    });

    expect(recService.getRecommendedVets).not.toHaveBeenCalled();
    expect(result.current.recommendations).toEqual([]);
    expect(result.current.loading).toBe(false);
  });

  it('does not skip when lat/lng are zero', async () => {
    (recService.getRecommendedVets as jest.Mock).mockResolvedValue({
      recommended_vets: [],
    });

    renderHook(() => useRecommendations('user_1', 0, 0, 'pet_1'));

    await waitFor(() => expect(recService.getRecommendedVets).toHaveBeenCalled());
  });

  it('clears the list and records the error on failure', async () => {
    (recService.getRecommendedVets as jest.Mock)
      .mockResolvedValueOnce({ recommended_vets: mockRecommended })
      .mockRejectedValueOnce(new Error('Rekomendasi tidak tersedia'));

    const { result } = renderHook(() => useRecommendations('user_1', LAT, LNG, 'pet_1'));
    await waitFor(() => expect(result.current.recommendations).toHaveLength(1));

    await act(async () => {
      await result.current.refresh();
    });

    expect(result.current.recommendations).toEqual([]);
    expect(result.current.error).toBe('Rekomendasi tidak tersedia');
  });

  it('defaults the limit to 10', async () => {
    (recService.getRecommendedVets as jest.Mock).mockResolvedValue({
      recommended_vets: [],
    });

    renderHook(() => useRecommendations('user_1', LAT, LNG, 'pet_1'));

    await waitFor(() =>
      expect(recService.getRecommendedVets).toHaveBeenCalledWith(
        'user_1',
        LAT,
        LNG,
        'pet_1',
        10,
      ),
    );
  });
});
