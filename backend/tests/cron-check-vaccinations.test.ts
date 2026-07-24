// Mock firebase-admin before any imports that touch db
const mockGet = jest.fn().mockResolvedValue({ docs: [] });
const mockUpdate = jest.fn().mockResolvedValue(undefined);
const mockSet = jest.fn().mockResolvedValue(undefined);
const mockAuditSet = jest.fn().mockResolvedValue(undefined);

const mockCollection = jest.fn((name: string) => {
  if (name === 'pets') {
    return {
      get: mockGet,
    };
  }
  if (name === 'vaccination_schedules') {
    return {
      where: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      get: jest.fn().mockResolvedValue({ docs: [] }),
    };
  }
  if (name === 'reminders') {
    return {
      doc: jest.fn(() => ({ id: 'reminder_1', set: mockSet })),
    };
  }
  if (name === 'bookingSuggestions') {
    return {
      doc: jest.fn(() => ({ id: 'suggestion_1', set: mockSet })),
    };
  }
  if (name === 'reminderPreferences') {
    return {
      doc: jest.fn(() => ({
        get: jest.fn().mockResolvedValue({
          exists: true,
          data: () => ({ smsEnabled: true, pushEnabled: true, mutedVaccines: [] }),
        }),
      })),
    };
  }
  // auditLogs
  return {
    doc: jest.fn(() => ({ id: 'log_1', set: mockAuditSet })),
  };
});

jest.mock('../src/services/db', () => ({
  db: { collection: mockCollection },
}));

jest.mock('date-fns', () => ({
  format: jest.fn((date: Date, fmt: string) => {
    if (fmt === 'yyyy-MM-dd') {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
    return '';
  }),
  addDays: jest.fn((date: Date, days: number) => {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }),
}));

import { checkVaccinations } from '../src/cron/check-vaccinations';

describe('Cron Vaccination Check', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGet.mockResolvedValue({ docs: [] });
  });

  it('should handle empty pets list', async () => {
    const res = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
    };

    await checkVaccinations({}, res);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        petsChecked: 0,
        remindersCreated: 0,
        smsSent: 0,
      })
    );
  });

  it('should return error on failure', async () => {
    mockCollection.mockImplementation(() => {
      throw new Error('DB error');
    });

    const res = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
    };

    await checkVaccinations({}, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: false })
    );
  });
});
