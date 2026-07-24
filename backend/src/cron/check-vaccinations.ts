import { db } from '../services/db';
import { getVaccinationSchedule } from '../services/health';
import { getReminderPreferences, createReminder } from '../services/reminders';
import { createBookingSuggestion } from '../services/booking-suggestions';
import { logAuditEvent } from '../services/audit-log';
import { format, addDays } from 'date-fns';

const sendSMS = async (phone: string, message: string): Promise<boolean> => {
  try {
    console.log(`SMS to ${phone}: ${message}`);
    // TODO: Implement Twilio
    return true;
  } catch (err) {
    console.error('SMS failed:', err);
    return false;
  }
};

export async function checkVaccinations(req: any, res: any) {
  const startTime = Date.now();
  let petsChecked = 0;
  let remindersCreated = 0;
  let smsSent = 0;
  const failures: string[] = [];

  try {
    const today = format(new Date(), 'yyyy-MM-dd');
    const inSevenDays = format(addDays(new Date(), 7), 'yyyy-MM-dd');

    const petsSnapshot = await db.collection('pets').get();

    for (const petDoc of petsSnapshot.docs) {
      petsChecked++;
      const petId = petDoc.id;
      const pet = petDoc.data() as any;
      const ownerId = pet.ownerId;

      try {
        const schedule = await getVaccinationSchedule(petId);

        const dueVaccines = schedule.vaccines.filter(v => {
          return v.nextDueDate <= inSevenDays && v.status !== 'completed';
        });

        if (dueVaccines.length === 0) continue;

        const prefs = await getReminderPreferences(ownerId);

        for (const vaccine of dueVaccines) {
          await createReminder(petId, vaccine.id, vaccine.nextDueDate, ['sms', 'push']);
          remindersCreated++;

          const message = `${pet.name}'s ${vaccine.name} is due on ${vaccine.nextDueDate}`;

          if (prefs.smsEnabled && pet.emergencyContact?.phone) {
            const sent = await sendSMS(pet.emergencyContact.phone, message);
            if (sent) smsSent++;
            else failures.push(`SMS failed for pet ${petId}`);
          }
        }

        const overdueVaccines = dueVaccines.filter(v => v.nextDueDate < today);
        if (overdueVaccines.length > 0) {
          await createBookingSuggestion(
            petId,
            overdueVaccines.map(v => v.id),
            format(addDays(new Date(), 1), 'yyyy-MM-dd')
          );
        }

        await logAuditEvent(petId, 'system', 'cron_check_complete', undefined, {
          dueVaccines: dueVaccines.map(v => v.name),
        } as any);
      } catch (err) {
        console.error(`Error processing pet ${petId}:`, err);
        failures.push(String(err));
      }
    }

    const duration = Date.now() - startTime;
    res.json({
      success: true,
      petsChecked,
      remindersCreated,
      smsSent,
      failures: failures.length > 0 ? failures : undefined,
      durationMs: duration,
    });
  } catch (err) {
    console.error('Cron failed:', err);
    res.status(500).json({ success: false, error: String(err) });
  }
}
