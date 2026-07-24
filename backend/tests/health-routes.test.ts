// Mock firebase-admin before any imports that touch db
const mockBatch = { update: jest.fn(), commit: jest.fn().mockResolvedValue(undefined) };
const mockCollection = jest.fn();
const mockDb = { collection: mockCollection, batch: jest.fn().mockReturnValue(mockBatch) };

jest.mock('firebase-admin', () => ({
  apps: [true],
  initializeApp: jest.fn(),
  firestore: jest.fn(() => mockDb),
}));

jest.mock('../src/services/vaccine-calculator', () => ({
  calculateVaccineSchedule: jest.fn().mockResolvedValue([
    { id: 'rabies', name: 'Rabies', nextDueDate: '2027-01-01', status: 'upcoming', frequency: 'annual' },
  ]),
}));

import request from 'supertest';
import app from '../src/index';
import { Pet, VaccinationSchedule } from '../src/types/health';

const token = 'mock_token';

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
  vaccines: [{ id: 'rabies', name: 'Rabies', nextDueDate: '2027-01-01', status: 'upcoming', frequency: 'annual' }],
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

describe('Health Routes', () => {
  describe('POST /health/pets', () => {
    it('should create pet with auth', async () => {
      const addRef = { id: 'pet_1' };
      const setFn = jest.fn().mockResolvedValue(undefined);
      const docRef = { ...addRef, set: setFn };

      mockCollection.mockReturnValue({
        doc: jest.fn().mockReturnValue(docRef),
      });

      const res = await request(app)
        .post('/health/pets')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Bella', breed: 'Golden Retriever', birthdate: '2022-01-15' });

      expect(res.status).toBe(200);
      expect(res.body.id).toBe('pet_1');
      expect(setFn).toHaveBeenCalled();
    });

    it('should return 401 without auth', async () => {
      const res = await request(app).post('/health/pets').send({ name: 'Bella', breed: 'Golden Retriever' });

      expect(res.status).toBe(401);
      expect(res.body.error).toBe('Missing authorization token');
    });
  });

  describe('GET /health/pets/:petId', () => {
    it('should return pet with auth', async () => {
      const docRef = { get: jest.fn().mockResolvedValue(makeDocSnap(basePet)) };
      mockCollection.mockReturnValue({ doc: jest.fn().mockReturnValue(docRef) });

      const res = await request(app).get('/health/pets/pet_1').set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.name).toBe('Bella');
    });

    it('should return 404 for missing pet', async () => {
      const docRef = { get: jest.fn().mockResolvedValue(makeDocSnap(null)) };
      mockCollection.mockReturnValue({ doc: jest.fn().mockReturnValue(docRef) });

      const res = await request(app).get('/health/pets/missing').set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Pet not found');
    });

    it('should return 401 without auth', async () => {
      const res = await request(app).get('/health/pets/pet_1');

      expect(res.status).toBe(401);
    });
  });

  describe('PATCH /health/pets/:petId', () => {
    it('should update pet with auth', async () => {
      const updateFn = jest.fn().mockResolvedValue(undefined);
      const docGet = jest.fn().mockResolvedValue(makeDocSnap(basePet));
      const docRef = { update: updateFn, get: docGet };

      const schedQuerySnap = makeQuerySnap([baseSchedule]);
      const schedDocRef = { update: jest.fn().mockResolvedValue(undefined) };

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

      const res = await request(app)
        .patch('/health/pets/pet_1')
        .set('Authorization', `Bearer ${token}`)
        .send({ breed: 'Labrador Retriever' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(updateFn).toHaveBeenCalled();
    });

    it('should return 401 without auth', async () => {
      const res = await request(app).patch('/health/pets/pet_1').send({ breed: 'Labrador Retriever' });

      expect(res.status).toBe(401);
    });
  });

  describe('GET /health/pets/:petId/vaccination-schedule', () => {
    it('should return schedule with auth', async () => {
      const schedWhere = jest.fn().mockReturnThis();
      const schedLimit = jest.fn().mockReturnValue({
        get: jest.fn().mockResolvedValue(makeQuerySnap([baseSchedule])),
      });
      mockCollection.mockReturnValue({ where: schedWhere, limit: schedLimit });
      schedWhere.mockReturnValue({ limit: schedLimit });

      const res = await request(app)
        .get('/health/pets/pet_1/vaccination-schedule')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.petId).toBe('pet_1');
    });

    it('should return 401 without auth', async () => {
      const res = await request(app).get('/health/pets/pet_1/vaccination-schedule');

      expect(res.status).toBe(401);
    });
  });

  describe('PATCH /health/vaccination-schedules/:scheduleId/vaccines/:vaccineId', () => {
    it('should mark vaccine complete with auth', async () => {
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

      const res = await request(app)
        .patch('/health/vaccination-schedules/sched_1/vaccines/rabies')
        .set('Authorization', `Bearer ${token}`)
        .send({ lastDate: '2026-07-24', vetName: 'Dr. Smith', notes: 'All good' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(schedUpdateFn).toHaveBeenCalled();
    });

    it('should return 401 without auth', async () => {
      const res = await request(app)
        .patch('/health/vaccination-schedules/sched_1/vaccines/rabies')
        .send({ lastDate: '2026-07-24', vetName: 'Dr. Smith' });

      expect(res.status).toBe(401);
    });
  });
});
