import { db } from './db';
import { Pet, VaccinationSchedule, Vaccine } from '../types/health';
import { calculateVaccineSchedule } from './vaccine-calculator';

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

// --- Pet CRUD (existing baseline) ---

export async function createPet(data: Omit<Pet, 'id' | 'createdAt'>): Promise<Pet> {
  const now = new Date().toISOString();
  const ref = db.collection('pets').doc();
  const pet: Pet = { ...data, id: ref.id, createdAt: now };
  await ref.set(pet);
  return pet;
}

export async function getPetsByOwner(ownerId: string): Promise<Pet[]> {
  const snap = await db.collection('pets').where('ownerId', '==', ownerId).get();
  return snap.docs.map(d => d.data() as Pet);
}

export async function addHealthRecord(
  record: { petId: string; type: string; date: string; note?: string; nextDueDate?: string }
): Promise<string> {
  const ref = await db.collection('health_records').add({
    ...record,
    createdAt: new Date().toISOString(),
  });
  return ref.id;
}

export async function getHealthRecordsByPet(petId: string): Promise<unknown[]> {
  const snap = await db.collection('health_records').where('petId', '==', petId).get();
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function getAllHealthRecords(): Promise<unknown[]> {
  const snap = await db.collection('health_records').get();
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

// --- Extended health service (Task 3) ---

export async function getPetProfile(petId: string): Promise<Pet | null> {
  const doc = await db.collection('pets').doc(petId).get();
  return doc.exists ? (doc.data() as Pet) : null;
}

export async function updatePetProfile(
  petId: string,
  updates: Partial<Omit<Pet, 'id' | 'createdAt'>>
): Promise<Pet> {
  const before = await getPetProfile(petId);
  if (!before) throw new Error(`Pet ${petId} not found`);

  await db.collection('pets').doc(petId).update(updates);
  const after = { ...before, ...updates };

  await logAuditEvent({ petId, actor: 'user', action: 'update_pet_profile', before: before as unknown as Record<string, unknown>, after: after as unknown as Record<string, unknown> });

  const breedChanged = updates.breed !== undefined && updates.breed !== before.breed;
  const birthdateChanged = updates.birthdate !== undefined && updates.birthdate !== before.birthdate;
  if (breedChanged || birthdateChanged) {
    await recalculateSchedule(petId, after.breed, after.birthdate);
  }

  return after;
}

export async function recalculateSchedule(
  petId: string,
  breed: string,
  birthdate: string
): Promise<VaccinationSchedule> {
  const vaccines = await calculateVaccineSchedule(breed, birthdate);
  const now = new Date().toISOString();

  const existing = await db.collection('vaccination_schedules').where('petId', '==', petId).limit(1).get();
  const pet = await getPetProfile(petId);

  const scheduleData: Omit<VaccinationSchedule, 'id'> = {
    petId,
    petName: pet?.name ?? '',
    breed,
    vaccines,
    calculatedAt: now,
    updatedAt: now,
  };

  let scheduleId: string;
  if (!existing.empty) {
    scheduleId = existing.docs[0].id;
    await db.collection('vaccination_schedules').doc(scheduleId).update({ ...scheduleData, updatedAt: now });
  } else {
    const ref = db.collection('vaccination_schedules').doc();
    scheduleId = ref.id;
    await ref.set({ ...scheduleData, id: scheduleId });
  }

  await logAuditEvent({ petId, actor: 'system', action: 'recalculate_schedule', after: { breed, birthdate } });

  return { ...scheduleData, id: scheduleId };
}

export async function getVaccinationSchedule(petId: string): Promise<VaccinationSchedule> {
  const snap = await db.collection('vaccination_schedules').where('petId', '==', petId).limit(1).get();
  if (!snap.empty) return { id: snap.docs[0].id, ...snap.docs[0].data() } as VaccinationSchedule;

  const pet = await getPetProfile(petId);
  if (!pet) throw new Error(`Pet ${petId} not found`);
  return recalculateSchedule(petId, pet.breed, pet.birthdate);
}

export async function markVaccineComplete(
  scheduleId: string,
  vaccineId: string,
  date: string,
  vetName: string,
  notes?: string
): Promise<void> {
  const schedRef = db.collection('vaccination_schedules').doc(scheduleId);
  const schedDoc = await schedRef.get();
  if (!schedDoc.exists) throw new Error(`Schedule ${scheduleId} not found`);

  const schedule = schedDoc.data() as VaccinationSchedule;
  const vaccines: Vaccine[] = schedule.vaccines.map(v =>
    v.id === vaccineId ? { ...v, status: 'completed' as const, lastDate: date } : v
  );

  const now = new Date().toISOString();
  await schedRef.update({ vaccines, updatedAt: now });

  await addHealthRecord({
    petId: schedule.petId,
    type: `vaccine:${vaccineId}`,
    date,
    note: [vetName, notes].filter(Boolean).join(' — '),
  });

  // Cancel pending reminders for this vaccine
  const remindersSnap = await db
    .collection('reminders')
    .where('petId', '==', schedule.petId)
    .where('vaccineId', '==', vaccineId)
    .where('status', '==', 'pending')
    .get();

  const batch = db.batch();
  remindersSnap.docs.forEach(d => batch.update(d.ref, { status: 'cancelled' }));
  await batch.commit();

  await logAuditEvent({
    petId: schedule.petId,
    actor: 'user',
    action: 'mark_vaccine_complete',
    after: { scheduleId, vaccineId, date, vetName, notes },
  });
}
