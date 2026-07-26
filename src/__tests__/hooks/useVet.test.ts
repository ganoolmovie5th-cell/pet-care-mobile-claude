import { renderHook, act } from '@testing-library/react-native';
import { useVet } from '../../hooks/useVet';
import * as vetService from '../../services/vet';

jest.mock('../../services/vet');

const mockVets = [
  {
    id: 'vet_1',
    clinic_name: 'Klinik Sehat',
    city: 'Jakarta',
    rating: 4.5,
    consultation_fee: 150000,
  },
  {
    id: 'vet_2',
    clinic_name: 'Klinik Hewan Bahagia',
    city: 'Bandung',
    rating: 4.8,
    consultation_fee: 200000,
  },
] as any;

describe('useVet', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('starts empty and not loading', () => {
    const { result } = renderHook(() => useVet());

    expect(result.current.vets).toEqual([]);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('fetchAllVets fills vets', async () => {
    (vetService.getAllVets as jest.Mock).mockResolvedValue(mockVets);

    const { result } = renderHook(() => useVet());

    await act(async () => {
      await result.current.fetchAllVets();
    });

    expect(result.current.vets).toHaveLength(2);
    expect(result.current.vets[0].clinic_name).toBe('Klinik Sehat');
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('fetchAllVets surfaces the error message and leaves vets empty', async () => {
    (vetService.getAllVets as jest.Mock).mockRejectedValue(new Error('Network down'));

    const { result } = renderHook(() => useVet());

    await act(async () => {
      await result.current.fetchAllVets();
    });

    expect(result.current.error).toBe('Network down');
    expect(result.current.vets).toEqual([]);
    expect(result.current.loading).toBe(false);
  });

  it('fetchVetById returns the vet without touching the list', async () => {
    (vetService.getVetById as jest.Mock).mockResolvedValue(mockVets[0]);

    const { result } = renderHook(() => useVet());

    let vet;
    await act(async () => {
      vet = await result.current.fetchVetById('vet_1');
    });

    expect(vetService.getVetById).toHaveBeenCalledWith('vet_1');
    expect(vet).toEqual(mockVets[0]);
    expect(result.current.vets).toEqual([]);
  });

  it('fetchVetById returns null on failure', async () => {
    (vetService.getVetById as jest.Mock).mockRejectedValue(new Error('Not found'));

    const { result } = renderHook(() => useVet());

    let vet;
    await act(async () => {
      vet = await result.current.fetchVetById('vet_missing');
    });

    expect(vet).toBeNull();
    expect(result.current.error).toBe('Not found');
  });

  it('searchVetsByFilters passes the filters through and replaces the list', async () => {
    (vetService.searchVets as jest.Mock).mockResolvedValue([mockVets[1]]);

    const { result } = renderHook(() => useVet());

    const filters = { city: 'Bandung', minRating: 4.6 };
    await act(async () => {
      await result.current.searchVetsByFilters(filters);
    });

    expect(vetService.searchVets).toHaveBeenCalledWith(filters);
    expect(result.current.vets).toHaveLength(1);
    expect(result.current.vets[0].id).toBe('vet_2');
  });

  it('clears a previous error on the next successful call', async () => {
    (vetService.getAllVets as jest.Mock)
      .mockRejectedValueOnce(new Error('Timeout'))
      .mockResolvedValueOnce(mockVets);

    const { result } = renderHook(() => useVet());

    await act(async () => {
      await result.current.fetchAllVets();
    });
    expect(result.current.error).toBe('Timeout');

    await act(async () => {
      await result.current.fetchAllVets();
    });
    expect(result.current.error).toBeNull();
    expect(result.current.vets).toHaveLength(2);
  });
});
