import { renderHook, act, waitFor } from '@testing-library/react-native';
import {
  useHealth,
  useVaccinationSchedule,
  useReminderPreferences,
  useBookingSuggestions,
} from '../../hooks/useHealth';
import * as healthService from '../../services/health';

jest.mock('../../services/health');

const newPet = {
  ownerId: 'user_1',
  name: 'Bimo',
  breed: 'Kucing Kampung',
  birthdate: '2023-04-01',
} as any;

const mockPets = [
  { ...newPet, id: 'pet_1', createdAt: '2026-07-01T00:00:00Z' },
  { ...newPet, id: 'pet_2', name: 'Coklat', createdAt: '2026-07-02T00:00:00Z' },
] as any;

const newRecord = {
  petId: 'pet_1',
  type: 'vaccine',
  date: '2026-07-01',
  note: 'Rabies dosis 1',
} as any;

const mockRecords = [
  { ...newRecord, id: 'rec_1', created_at: '2026-07-01T00:00:00Z' },
] as any;

const mockSchedule = {
  id: 'sch_1',
  petId: 'pet_1',
  petName: 'Bimo',
  vaccines: [{ id: 'vac_1', name: 'rabies', status: 'overdue' }],
} as any;

const mockPrefs = {
  id: 'pref_1',
  ownerId: 'user_1',
  smsEnabled: true,
  pushEnabled: false,
  reminderDaysBefore: 7,
  mutedVaccines: [],
  updatedAt: '2026-07-26T00:00:00Z',
} as any;

const mockSuggestions = [
  { suggestedDate: '2026-08-05', vetId: 'vet_1', overdueVaccines: ['rabies'] },
] as any;

describe('useHealth', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('starts empty', () => {
    const { result } = renderHook(() => useHealth());

    expect(result.current.pets).toEqual([]);
    expect(result.current.records).toEqual([]);
    expect(result.current.error).toBeNull();
  });

  it('createNewPet appends the pet optimistically with the returned id', async () => {
    (healthService.createPet as jest.Mock).mockResolvedValue('pet_9');

    const { result } = renderHook(() => useHealth());

    let id;
    await act(async () => {
      id = await result.current.createNewPet(newPet);
    });

    expect(id).toBe('pet_9');
    expect(result.current.pets).toHaveLength(1);
    expect(result.current.pets[0].id).toBe('pet_9');
    expect(result.current.pets[0].name).toBe('Bimo');
    expect(result.current.pets[0].createdAt).toBeTruthy();
  });

  it('createNewPet returns null and adds nothing on failure', async () => {
    (healthService.createPet as jest.Mock).mockRejectedValue(new Error('Quota penuh'));

    const { result } = renderHook(() => useHealth());

    let id;
    await act(async () => {
      id = await result.current.createNewPet(newPet);
    });

    expect(id).toBeNull();
    expect(result.current.pets).toEqual([]);
    expect(result.current.error).toBe('Quota penuh');
  });

  it('fetchPets replaces the list', async () => {
    (healthService.getPetsByOwner as jest.Mock).mockResolvedValue(mockPets);

    const { result } = renderHook(() => useHealth());

    await act(async () => {
      await result.current.fetchPets('user_1');
    });

    expect(healthService.getPetsByOwner).toHaveBeenCalledWith('user_1');
    expect(result.current.pets).toHaveLength(2);
  });

  it('addRecord returns the id but leaves records untouched', async () => {
    (healthService.addHealthRecord as jest.Mock).mockResolvedValue('rec_9');

    const { result } = renderHook(() => useHealth());

    let id;
    await act(async () => {
      id = await result.current.addRecord(newRecord);
    });

    expect(id).toBe('rec_9');
    expect(result.current.records).toEqual([]);
  });

  it('fetchRecords loads records for one pet', async () => {
    (healthService.getHealthRecordsByPet as jest.Mock).mockResolvedValue(mockRecords);

    const { result } = renderHook(() => useHealth());

    await act(async () => {
      await result.current.fetchRecords('pet_1');
    });

    expect(healthService.getHealthRecordsByPet).toHaveBeenCalledWith('pet_1');
    expect(result.current.records).toHaveLength(1);
  });

  it('getAllRecords loads every record', async () => {
    (healthService.getAllHealthRecords as jest.Mock).mockResolvedValue(mockRecords);

    const { result } = renderHook(() => useHealth());

    await act(async () => {
      await result.current.getAllRecords();
    });

    expect(result.current.records).toHaveLength(1);
    expect(result.current.error).toBeNull();
  });
});

describe('useVaccinationSchedule', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('auto-fetches on mount', async () => {
    (healthService.getVaccinationSchedule as jest.Mock).mockResolvedValue(mockSchedule);

    const { result } = renderHook(() => useVaccinationSchedule('pet_1'));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(healthService.getVaccinationSchedule).toHaveBeenCalledWith('pet_1');
    expect(result.current.schedule?.petName).toBe('Bimo');
    expect(result.current.error).toBeNull();
  });

  it('records the error and leaves schedule null', async () => {
    (healthService.getVaccinationSchedule as jest.Mock).mockRejectedValue(
      new Error('Pet tidak ditemukan'),
    );

    const { result } = renderHook(() => useVaccinationSchedule('pet_missing'));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.schedule).toBeNull();
    expect(result.current.error).toBe('Pet tidak ditemukan');
  });

  it('refetch hits the service again', async () => {
    (healthService.getVaccinationSchedule as jest.Mock).mockResolvedValue(mockSchedule);

    const { result } = renderHook(() => useVaccinationSchedule('pet_1'));
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.refetch();
    });

    expect(healthService.getVaccinationSchedule).toHaveBeenCalledTimes(2);
  });
});

describe('useReminderPreferences', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('auto-fetches prefs on mount', async () => {
    (healthService.getReminderPreferences as jest.Mock).mockResolvedValue(mockPrefs);

    const { result } = renderHook(() => useReminderPreferences());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.prefs?.smsEnabled).toBe(true);
    expect(result.current.prefs?.reminderDaysBefore).toBe(7);
  });

  it('updatePrefs merges the patch into local state', async () => {
    (healthService.getReminderPreferences as jest.Mock).mockResolvedValue(mockPrefs);
    (healthService.updateReminderPreferences as jest.Mock).mockResolvedValue(undefined);

    const { result } = renderHook(() => useReminderPreferences());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.updatePrefs({ pushEnabled: true });
    });

    expect(healthService.updateReminderPreferences).toHaveBeenCalledWith({
      pushEnabled: true,
    });
    expect(result.current.prefs?.pushEnabled).toBe(true);
    expect(result.current.prefs?.smsEnabled).toBe(true);
  });

  it('updatePrefs rethrows so the screen can react', async () => {
    (healthService.getReminderPreferences as jest.Mock).mockResolvedValue(mockPrefs);
    (healthService.updateReminderPreferences as jest.Mock).mockRejectedValue(
      new Error('Gagal simpan'),
    );

    const { result } = renderHook(() => useReminderPreferences());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await expect(result.current.updatePrefs({ pushEnabled: true })).rejects.toThrow(
        'Gagal simpan',
      );
    });

    expect(result.current.error).toBe('Gagal simpan');
    expect(result.current.prefs?.pushEnabled).toBe(false);
  });
});

describe('useBookingSuggestions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('auto-fetches suggestions on mount', async () => {
    (healthService.getBookingSuggestions as jest.Mock).mockResolvedValue(mockSuggestions);

    const { result } = renderHook(() => useBookingSuggestions('pet_1'));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(healthService.getBookingSuggestions).toHaveBeenCalledWith('pet_1');
    expect(result.current.suggestions).toHaveLength(1);
    expect(result.current.suggestions[0].overdueVaccines).toEqual(['rabies']);
  });

  it('keeps suggestions empty on failure', async () => {
    (healthService.getBookingSuggestions as jest.Mock).mockRejectedValue(
      new Error('Backend mati'),
    );

    const { result } = renderHook(() => useBookingSuggestions('pet_1'));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.suggestions).toEqual([]);
    expect(result.current.error).toBe('Backend mati');
  });
});
