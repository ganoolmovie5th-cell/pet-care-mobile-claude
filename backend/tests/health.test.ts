// Mock firebase-admin before any imports that touch db
const mockBatch = { update: jest.fn(), commit: jest.fn().mockResolvedValue(undefined) };
const mockCollection = jest.fn();
const mockDb = { collection: mockCollection, batch: jest.fn().mockReturnValue(mockBatch) };

jest.mock('firebase-admin', () => ({
  apps: [true], // pretend already initialized
  initializeApp: jest.fn(),
  firestore: jest.fn(() => mockDb),
}));

// Mock vaccine-calculator so tests don't depend on date-fns
jest.mock('../src/services/vaccine-calculator', () => ({
  calculateVaccineSchedule: jest.fn().mockResolvedValue([
    { id: 'rabies', name: 'Rabies', nextDueDate: '2027-01-01', status: 'upcoming', frequency: 'annual' },
  ]),
}));

import {
  getPetProfile,
  updatePetProfile,
  recalculateSchedule,
  getVaccinationSchedule,
  markVaccineComplete,
} from '../src/services/health';
import { Pet, VaccinationSchedule } from '../src/types/health';

const basePet: Pet = {
  id: 'pet_1',
  ownerId: 'user_1',
  name: 'Bella',
  breed: 'Golden Retriever',
  birthdate: '2022-01-15',
  createdAt: '2026-01-01T00:00:00Z',
};

const baseSchedule: VaccinationSchedule & { id: string } = {
  id: 'sched_1',
  petId: 'pet_1',
  petName: 'Bella',
  breed: 'Golden Retriever',
  vaccines: [
    { id: 'rabies', name: 'Rabies', nextDueDate: '2027-01-01', status: 'upcoming', frequency: 'annual' },
  ],
  calculatedAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
};

function makeDocSnap(data: object | null) {
  return { exists: data !== null, data: () => data, id: (data as any)?.id ?? 'doc_id', ref: { update: jest.fn() } };
}

function makeQuerySnap(docs: object[]) {
  return { empty: docs.length === 0, docs: docs.map(d => makeDocSnap(d)) };
}

beforeEach(() => {
  jest.clearAllMocks();
  mockBatch.update.mockClear();
  mockBatch.commit.mockClear();
});

describe('getPetProfile', () => {
  it('returns pet when found', async () => {
    const docRef = { get: jest.fn().mockResolvedValue(makeDocSnap(basePet)) };
    mockCollection.mockReturnValue({ doc: jest.fn().mockReturnValue(docRef) });

    const pet = await getPetProfile('pet_1');
    expect(pet?.name).toBe('Bella');
  });

  it('returns null when not found', async () => {
    const docRef = { get: jest.fn().mockResolvedValue(makeDocSnap(null)) };
    mockCollection.mockReturnValue({ doc: jest.fn().mockReturnValue(docRef) });

    const pet = await getPetProfile('missing');
    expect(pet).toBeNull();
  });
});

describe('updatePetProfile', () => {
  it('updates pet and triggers recalculation when breed changes', async () => {
    const docGet = jest.fn().mockResolvedValue(makeDocSnap(basePet));
    const docUpdate = jest.fn().mockResolvedValue(undefined);
    const docRef = { get: docGet, update: docUpdate };

    const schedQuerySnap = makeQuerySnap([baseSchedule]);
    const schedDocRef = { update: jest.fn().mockResolvedValue(undefined) };

    // collection('pets') → doc('pet_1') for getPetProfile + update
    // collection('pets') → doc() for recalculateSchedule getPetProfile
    // collection('vaccination_schedules') → where → limit → get
    // collection('audit_logs') → add (x2)
    const petDoc = jest.fn().mockReturnValue(docRef);
    const schedWhere = jest.fn().mockReturnThis();
    const schedLimit = jest.fn().mockReturnValue({ get: jest.fn().mockResolvedValue(schedQuerySnap) });
    const schedDoc = jest.fn().mockReturnValue(schedDocRef);

    mockCollection.mockImplementation((col: string) => {
      if (col === 'pets') return { doc: petDoc };
      if (col === 'vaccination_schedules') return { where: schedWhere, limit: schedLimit, doc: schedDoc };
      if (col === 'audit_logs') return { add: jest.fn().mockResolvedValue({ id: 'log_1' }) };
      return {};
    });
    schedWhere.mockReturnValue({ limit: schedLimit });

    const result = await updatePetProfile('pet_1', { breed: 'Labrador Retriever' });
    expect(result.breed).toBe('Labrador Retriever');
    expect(docUpdate).toHaveBeenCalled();
  });
});

describe('recalculateSchedule', () => {
  it('creates new schedule when none exists', async () => {
    const schedSetFn = jest.fn().mockResolvedValue(undefined);
    const schedDocRef = { id: 'sched_new', set: schedSetFn };
    const schedWhere = jest.fn().mockReturnThis();
    const schedLimit = jest.fn().mockReturnValue({ get: jest.fn().mockResolvedValue(makeQuerySnap([])) });
    const schedDoc = jest.fn().mockReturnValue(schedDocRef);

    const petDocRef = { get: jest.fn().mockResolvedValue(makeDocSnap(basePet)) };
    const petDoc = jest.fn().mockReturnValue(petDocRef);

    mockCollection.mockImplementation((col: string) => {
      if (col === 'pets') return { doc: petDoc };
      if (col === 'vaccination_schedules') return { where: schedWhere, limit: schedLimit, doc: schedDoc };
      if (col === 'audit_logs') return { add: jest.fn().mockResolvedValue({}) };
      return {};
    });
    schedWhere.mockReturnValue({ limit: schedLimit });

    const schedule = await recalculateSchedule('pet_1', 'Golden Retriever', '2022-01-15');
    expect(schedule.petId).toBe('pet_1');
    expect(schedule.vaccines.length).toBeGreaterThan(0);
    expect(schedSetFn).toHaveBeenCalled();
  });

  it('updates existing schedule when one exists', async () => {
    const schedUpdateFn = jest.fn().mockResolvedValue(undefined);
    const schedDocRef = { id: 'sched_1', update: schedUpdateFn };
    const schedQuerySnap = makeQuerySnap([baseSchedule]);
    const schedWhere = jest.fn().mockReturnThis();
    const schedLimit = jest.fn().mockReturnValue({ get: jest.fn().mockResolvedValue(schedQuerySnap) });
    const schedDoc = jest.fn().mockReturnValue(schedDocRef);

    const petDocRef = { get: jest.fn().mockResolvedValue(makeDocSnap(basePet)) };

    mockCollection.mockImplementation((col: string) => {
      if (col === 'pets') return { doc: jest.fn().mockReturnValue(petDocRef) };
      if (col === 'vaccination_schedules') return { where: schedWhere, limit: schedLimit, doc: schedDoc };
      if (col === 'audit_logs') return { add: jest.fn().mockResolvedValue({}) };
      return {};
    });
    schedWhere.mockReturnValue({ limit: schedLimit });

    const schedule = await recalculateSchedule('pet_1', 'Golden Retriever', '2022-01-15');
    expect(schedUpdateFn).toHaveBeenCalled();
    expect(schedule.id).toBe('sched_1');
  });
});

describe('getVaccinationSchedule', () => {
  it('returns existing schedule without recalculating', async () => {
    const schedWhere = jest.fn().mockReturnThis();
    const schedLimit = jest.fn().mockReturnValue({
      get: jest.fn().mockResolvedValue(makeQuerySnap([baseSchedule])),
    });
    mockCollection.mockReturnValue({ where: schedWhere, limit: schedLimit });
    schedWhere.mockReturnValue({ limit: schedLimit });

    const schedule = await getVaccinationSchedule('pet_1');
    expect(schedule.petId).toBe('pet_1');
  });
});

describe('markVaccineComplete', () => {
  it('marks vaccine completed, adds health record, cancels reminders', async () => {
    const schedUpdateFn = jest.fn().mockResolvedValue(undefined);
    const schedDocRef = { get: jest.fn().mockResolvedValue(makeDocSnap(baseSchedule)), update: schedUpdateFn };

    const healthRecordAddFn = jest.fn().mockResolvedValue({ id: 'rec_1' });

    const reminderSnap = makeQuerySnap([
      { id: 'rem_1', petId: 'pet_1', vaccineId: 'rabies', status: 'pending' },
    ]);

    const remWhere = jest.fn().mockReturnThis();
    const remGet = jest.fn().mockResolvedValue(reminderSnap);
    remWhere.mockReturnValue({ where: remWhere, get: remGet });

    mockCollection.mockImplementation((col: string) => {
      if (col === 'vaccination_schedules') return { doc: jest.fn().mockReturnValue(schedDocRef) };
      if (col === 'health_records') return { add: healthRecordAddFn };
      if (col === 'reminders') return { where: remWhere };
      if (col === 'audit_logs') return { add: jest.fn().mockResolvedValue({}) };
      return {};
    });

    await markVaccineComplete('sched_1', 'rabies', '2026-07-24', 'Dr. Smith', 'All good');

    expect(schedUpdateFn).toHaveBeenCalledWith(
      expect.objectContaining({ vaccines: expect.arrayContaining([expect.objectContaining({ status: 'completed' })]) })
    );
    expect(healthRecordAddFn).toHaveBeenCalled();
    expect(mockBatch.commit).toHaveBeenCalled();
  });
});
