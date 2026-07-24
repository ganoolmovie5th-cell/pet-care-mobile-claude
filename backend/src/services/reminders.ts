import { db } from './db';
import { Reminder, ReminderPreferences } from '../types/health';

// ponytail: logAuditEvent stub — Task 6 will provide the real impl
async function logAuditEvent(params: {
  petId: string;
  actor: 'user' | 'system';
  action: string;
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
}): Promise<void> {
  await db.collection('audit_logs').add({
    ...params,
    timestamp: new Date().toISOString(),
  });
}

const DEFAULT_PREFS = (ownerId: string): ReminderPreferences => ({
  id: ownerId,
  ownerId,
  smsEnabled: true,
  pushEnabled: true,
  reminderDaysBefore: 7,
  mutedVaccines: [],
  updatedAt: new Date().toISOString(),
});

export async function getReminderPreferences(ownerId: string): Promise<ReminderPreferences> {
  const doc = await db.collection('reminderPreferences').doc(ownerId).get();
  return doc.exists ? (doc.data() as ReminderPreferences) : DEFAULT_PREFS(ownerId);
}

export async function updateReminderPreferences(
  ownerId: string,
  updates: Partial<ReminderPreferences>
): Promise<void> {
  const before = await getReminderPreferences(ownerId);
  await db.collection('reminderPreferences').doc(ownerId).set(
    { ...updates, ownerId, updatedAt: new Date().toISOString() },
    { merge: true }
  );
  // ponytail: audit key is ownerId, not petId — using ownerId as petId field here
  await logAuditEvent({ petId: ownerId, actor: 'user', action: 'reminder_preferences_updated', before: before as unknown as Record<string, unknown>, after: updates as Record<string, unknown> });
}

export async function createReminder(
  petId: string,
  vaccineId: string,
  dueDate: string,
  channels: ('sms' | 'push')[]
): Promise<Reminder> {
  const ref = db.collection('reminders').doc();
  const reminder: Reminder = {
    id: ref.id,
    petId,
    vaccineId,
    dueDate,
    status: 'pending',
    reminderChannels: channels,
    createdAt: new Date().toISOString(),
  };
  await ref.set(reminder);
  return reminder;
}

export async function getReminders(ownerId: string): Promise<Reminder[]> {
  // ponytail: Reminder has no ownerId — join via owner's pets
  const petsSnap = await db.collection('pets').where('ownerId', '==', ownerId).get();
  if (petsSnap.empty) return [];

  const petIds = petsSnap.docs.map(d => d.id);
  // Firestore 'in' supports up to 30 items; owners with more pets need pagination — YAGNI for MVP
  const remindersSnap = await db
    .collection('reminders')
    .where('petId', 'in', petIds)
    .orderBy('dueDate', 'desc')
    .get();

  return remindersSnap.docs.map(d => d.data() as Reminder);
}

export async function dismissReminder(reminderId: string): Promise<void> {
  await db.collection('reminders').doc(reminderId).update({ status: 'dismissed' });
}
