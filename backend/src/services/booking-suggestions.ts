import { db } from './db';
import { BookingSuggestion } from '../types/health';
import { logAuditEvent } from './audit-log';

export async function createBookingSuggestion(
  petId: string,
  overdueVaccines: string[],
  suggestedDate: string,
  vetId?: string
): Promise<BookingSuggestion> {
  const ref = db.collection('bookingSuggestions').doc();

  const suggestion: BookingSuggestion = {
    id: ref.id,
    petId,
    overdueVaccines,
    suggestedDate,
    vetId,
    status: 'pending',
    createdAt: new Date().toISOString(),
  };

  await ref.set(suggestion);
  await logAuditEvent(
    petId,
    'system',
    'create_booking_suggestion',
    undefined,
    { suggestionId: ref.id, overdueVaccines, suggestedDate, vetId }
  );

  return suggestion;
}

export async function getBookingSuggestions(petId: string): Promise<BookingSuggestion[]> {
  const docs = await db
    .collection('bookingSuggestions')
    .where('petId', '==', petId)
    .orderBy('createdAt', 'desc')
    .get();

  return docs.docs.map(doc => doc.data() as BookingSuggestion);
}

export async function acceptBookingSuggestion(suggestionId: string, ownerId: string): Promise<void> {
  const docRef = db.collection('bookingSuggestions').doc(suggestionId);
  const doc = await docRef.get();

  if (!doc.exists) throw new Error(`BookingSuggestion ${suggestionId} not found`);

  const suggestion = doc.data() as BookingSuggestion;
  const petDoc = await db.collection('pets').doc(suggestion.petId).get();
  const pet = petDoc.data() as { ownerId?: string };

  if (!pet || pet.ownerId !== ownerId) {
    const err = new Error(`BookingSuggestion ${suggestionId} not found`) as any;
    err.status = 404;
    throw err;
  }

  const now = new Date().toISOString();

  await docRef.update({
    status: 'accepted',
    acceptedAt: now,
  });

  await logAuditEvent(
    suggestion.petId,
    'user',
    'accept_booking_suggestion',
    { status: suggestion.status },
    { status: 'accepted', acceptedAt: now }
  );
}
