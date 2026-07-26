import { renderHook, act, waitFor } from '@testing-library/react-native';
import { usePlaydateMatches } from '../../hooks/usePlaydateMatches';
import * as geoService from '../../services/geo-matching';

jest.mock('../../services/geo-matching');

const LAT = -6.2;
const LNG = 106.8;

const mockMatches = [
  {
    postId: 'post_1',
    ownerId: 'user_2',
    petName: 'Coklat',
    breed: 'Golden Retriever',
    distance_km: 1.8,
    location: { lat: LAT, lng: LNG, address: 'Jakarta Selatan' },
    date: '2026-08-10',
    description: 'Cari teman main sore',
  },
] as any;

describe('usePlaydateMatches', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('fetches matches with the default radius and sort', async () => {
    (geoService.getPlaydateMatches as jest.Mock).mockResolvedValue({
      matches: mockMatches,
    });

    const { result } = renderHook(() => usePlaydateMatches(LAT, LNG, 'pet_1'));

    await waitFor(() => expect(result.current.matches).toHaveLength(1));

    expect(geoService.getPlaydateMatches).toHaveBeenCalledWith(
      LAT,
      LNG,
      'pet_1',
      5,
      'score',
    );
    expect(result.current.matches[0].petName).toBe('Coklat');
    expect(result.current.loading).toBe(false);
  });

  it('passes a custom radius and sort through', async () => {
    (geoService.getPlaydateMatches as jest.Mock).mockResolvedValue({ matches: [] });

    renderHook(() => usePlaydateMatches(LAT, LNG, 'pet_1', 20, 'recent'));

    await waitFor(() =>
      expect(geoService.getPlaydateMatches).toHaveBeenCalledWith(
        LAT,
        LNG,
        'pet_1',
        20,
        'recent',
      ),
    );
  });

  it.each([
    ['lat null', null, LNG, 'pet_1'],
    ['lng null', LAT, null, 'pet_1'],
    ['petId null', LAT, LNG, null],
  ])('skips the request when %s', async (_label, lat, lng, petId) => {
    const { result } = renderHook(() =>
      usePlaydateMatches(lat as any, lng as any, petId as any),
    );

    await act(async () => {
      await result.current.refresh();
    });

    expect(geoService.getPlaydateMatches).not.toHaveBeenCalled();
    expect(result.current.matches).toEqual([]);
    expect(result.current.loading).toBe(false);
  });

  it('does not skip when lat/lng are zero', async () => {
    (geoService.getPlaydateMatches as jest.Mock).mockResolvedValue({ matches: [] });

    renderHook(() => usePlaydateMatches(0, 0, 'pet_1'));

    await waitFor(() => expect(geoService.getPlaydateMatches).toHaveBeenCalled());
  });

  it('clears the list and records the error on failure', async () => {
    (geoService.getPlaydateMatches as jest.Mock)
      .mockResolvedValueOnce({ matches: mockMatches })
      .mockRejectedValueOnce(new Error('Geo service mati'));

    const { result } = renderHook(() => usePlaydateMatches(LAT, LNG, 'pet_1'));
    await waitFor(() => expect(result.current.matches).toHaveLength(1));

    await act(async () => {
      await result.current.refresh();
    });

    expect(result.current.matches).toEqual([]);
    expect(result.current.error).toBe('Geo service mati');
  });
});
