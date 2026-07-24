import { db } from './db';
import { AuditLog } from '../types/health';

export async function logAuditEvent(
  petId: string,
  actor: 'user' | 'system',
  action: string,
  before?: Record<string, any>,
  after?: Record<string, any>
): Promise<void> {
  const ref = db.collection('auditLogs').doc();

  const log: AuditLog = {
    id: ref.id,
    petId,
    actor,
    action,
    before,
    after,
    timestamp: new Date().toISOString(),
  };

  await ref.set(log);
}

export async function getAuditLogs(petId: string): Promise<AuditLog[]> {
  const docs = await db
    .collection('auditLogs')
    .where('petId', '==', petId)
    .orderBy('timestamp', 'desc')
    .limit(100)
    .get();

  return docs.docs.map(doc => doc.data() as AuditLog);
}
