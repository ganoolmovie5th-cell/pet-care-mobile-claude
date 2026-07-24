// Mock firebase-admin before any imports that touch db
const mockAuditSet = jest.fn().mockResolvedValue(undefined);
const mockUpdate = jest.fn().mockResolvedValue(undefined);
const mockSet = jest.fn().mockResolvedValue(undefined);

// Per-collection mock state
let prefsDocData: Record<string, unknown> | null = null;
let remindersData: Array<Record<string, unknown>> = [];
let petsData: Array<{ id: string; data: () => Record<string, unknown> }> = [];

const mockDocRef = (id: string, data: Record<string, unknown> | null) => ({
  id,
  get: jest.fn().mockResolvedValue({ exists: data !== null, data: () => data }),
  set: mockSet,
  update: mockUpdate,
});

const mockCollection = jest.fn((name: string) => {
  if (name === 'reminderPreferences') {
    return {
      doc: jest.fn((id: string) => mockDocRef(id, prefsDocData)),
    };
  }
  if (name === 'reminders') {
    return {
      doc: jest.fn((id: string) => {
        if (id === 'reminder_1') {
          return {
            get: jest.fn().mockResolvedValue({ exists: true, data: () => ({ id: 'reminder_1', petId: 'pet_1', status: 'pending' }) }),
            update: mockUpdate,
          };
        }
        const ref = { id: 'reminder_new', set: mockSet, update: mockUpdate };
        return ref;
      }),
      where: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      get: jest.fn().mockResolvedValue({ docs: remindersData }),
    };
  }
  if (name === 'pets') {
    return {
      doc: jest.fn((id: string) => {
        if (id === 'pet_1') {
          return {
            get: jest.fn().mockResolvedValue({ exists: true, data: () => ({ id: 'pet_1', ownerId: 'user_1' }) }),
          };
        }
        return {
          get: jest.fn().mockResolvedValue({ exists: false, data: () => null }),
        };
      }),
      where: jest.fn().mockReturnThis(),
      get: jest.fn().mockResolvedValue({ empty: petsData.length === 0, docs: petsData }),
    };
  }
  // auditLogs
  return {
    doc: jest.fn(() => ({ id: 'log_1', set: mockAuditSet })),
  };
});

jest.mock('firebase-admin', () => ({
  apps: [true],
  initializeApp: jest.fn(),
  firestore: jest.fn(() => ({ collection: mockCollection })),
}));

import {
  getReminderPreferences,
  updateReminderPreferences,
  createReminder,
  getReminders,
  dismissReminder,
} from '../src/services/reminders';

beforeEach(() => {
  prefsDocData = null;
  remindersData = [];
  petsData = [];
  jest.clearAllMocks();
});

describe('getReminderPreferences', () => {
  it('returns defaults when doc missing', async () => {
    const prefs = await getReminderPreferences('user_1');
    expect(prefs.smsEnabled).toBe(true);
    expect(prefs.pushEnabled).toBe(true);
    expect(prefs.reminderDaysBefore).toBe(7);
    expect(prefs.mutedVaccines).toEqual([]);
    expect(prefs.ownerId).toBe('user_1');
  });

  it('returns stored prefs when doc exists', async () => {
    prefsDocData = { id: 'user_1', ownerId: 'user_1', smsEnabled: false, pushEnabled: true, reminderDaysBefore: 3, mutedVaccines: ['rabies'], updatedAt: '2026-01-01T00:00:00Z' };
    const prefs = await getReminderPreferences('user_1');
    expect(prefs.smsEnabled).toBe(false);
    expect(prefs.reminderDaysBefore).toBe(3);
  });
});

describe('updateReminderPreferences', () => {
  it('upserts with merge and logs audit', async () => {
    await updateReminderPreferences('user_1', { smsEnabled: false });
    expect(mockSet).toHaveBeenCalledWith(
      expect.objectContaining({ smsEnabled: false, ownerId: 'user_1' }),
      { merge: true }
    );
    expect(mockAuditSet).toHaveBeenCalledWith(expect.objectContaining({ action: 'reminder_preferences_updated' }));
  });
});

describe('createReminder', () => {
  it('creates and returns reminder with pending status', async () => {
    const reminder = await createReminder('pet_1', 'vac_rabies', '2026-08-15', ['sms', 'push']);
    expect(reminder.status).toBe('pending');
    expect(reminder.petId).toBe('pet_1');
    expect(reminder.vaccineId).toBe('vac_rabies');
    expect(reminder.reminderChannels).toEqual(['sms', 'push']);
    expect(mockSet).toHaveBeenCalledWith(expect.objectContaining({ status: 'pending' }));
  });
});

describe('getReminders', () => {
  it('returns empty array when owner has no pets', async () => {
    const result = await getReminders('user_1');
    expect(result).toEqual([]);
  });

  it('returns reminders for owner pets', async () => {
    const reminder = { id: 'r1', petId: 'pet_1', vaccineId: 'rabies', dueDate: '2026-08-01', status: 'pending', reminderChannels: ['sms'], createdAt: '2026-01-01T00:00:00Z' };
    petsData = [{ id: 'pet_1', data: () => ({ ownerId: 'user_1' }) }];
    remindersData = [{ data: () => reminder }] as any;
    const result = await getReminders('user_1');
    expect(result).toHaveLength(1);
    expect(result[0].petId).toBe('pet_1');
  });
});

describe('dismissReminder', () => {
  it('updates status to dismissed', async () => {
    await dismissReminder('reminder_1', 'user_1');
    expect(mockUpdate).toHaveBeenCalledWith({ status: 'dismissed' });
  });

  it('returns 404 if user does not own pet', async () => {
    try {
      await dismissReminder('reminder_1', 'user_2');
      fail('Should throw error');
    } catch (err: any) {
      expect(err.status).toBe(404);
    }
  });
});
