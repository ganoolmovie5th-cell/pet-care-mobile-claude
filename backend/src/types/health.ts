export interface Pet {
  id: string;
  ownerId: string;
  name: string;
  breed: string;
  birthdate: string;
  age?: number;
  photo?: string;
  microchip?: string;
  weight?: number;
  color?: string;
  bloodType?: 'A' | 'B' | 'AB' | 'O';
  allergies?: string[];
  insuranceId?: string;
  emergencyContact?: { name: string; phone: string };
  vetRelationships?: Array<{ vetId: string; clinicName: string; lastVisit?: string }>;
  createdAt: string;
}

export interface Vaccine {
  id: string;
  name: string;
  lastDate?: string;
  nextDueDate: string;
  status: 'completed' | 'upcoming' | 'due_soon' | 'overdue';
  frequency: 'annual' | '3-year' | 'booster' | 'once';
}

export interface VaccinationSchedule {
  id: string;
  petId: string;
  petName: string;
  breed: string;
  vaccines: Vaccine[];
  calculatedAt: string;
  updatedAt: string;
}

export interface Reminder {
  id: string;
  petId: string;
  vaccineId: string;
  dueDate: string;
  status: 'pending' | 'sent' | 'dismissed' | 'cancelled';
  reminderChannels: ('sms' | 'push')[];
  sentAt?: string;
  readAt?: string;
  createdAt: string;
}

export interface ReminderPreferences {
  id: string;
  ownerId: string;
  smsEnabled: boolean;
  pushEnabled: boolean;
  reminderDaysBefore: number;
  mutedVaccines: string[];
  updatedAt: string;
}

export interface BookingSuggestion {
  id: string;
  petId: string;
  overdueVaccines: string[];
  suggestedDate: string;
  vetId?: string;
  status: 'pending' | 'accepted' | 'dismissed';
  createdAt: string;
  acceptedAt?: string;
}

export interface AuditLog {
  id: string;
  petId: string;
  actor: 'user' | 'system';
  action: string;
  before?: Record<string, any>;
  after?: Record<string, any>;
  timestamp: string;
}

export interface VaccineType {
  id: string;
  name: string;
  frequency: 'annual' | '3-year' | 'booster' | 'once';
  ageWeeksStart?: number;
  ageWeeksInterval?: number;
}
