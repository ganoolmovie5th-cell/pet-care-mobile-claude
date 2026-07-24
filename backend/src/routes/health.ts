import express from 'express';
import { verifyAuth } from '../middleware/auth';
import {
  createPet,
  getPetProfile,
  updatePetProfile,
  getVaccinationSchedule,
  markVaccineComplete,
} from '../services/health';
import { getReminderPreferences, updateReminderPreferences, getReminders, dismissReminder } from '../services/reminders';
import { getBookingSuggestions, acceptBookingSuggestion } from '../services/booking-suggestions';

const router = express.Router();

router.post('/pets', verifyAuth, async (req, res, next) => {
  try {
    const pet = await createPet({ ...req.body, ownerId: (req as any).user.uid });
    res.json({ id: pet.id, createdAt: pet.createdAt });
  } catch (err) {
    next(err);
  }
});

router.get('/pets/:petId', verifyAuth, async (req, res, next) => {
  try {
    const pet = await getPetProfile(req.params.petId);
    if (!pet || pet.ownerId !== (req as any).user.uid) {
      res.status(404).json({ error: 'Pet not found' });
      return;
    }
    res.json(pet);
  } catch (err) {
    next(err);
  }
});

router.patch('/pets/:petId', verifyAuth, async (req, res, next) => {
  try {
    const pet = await getPetProfile(req.params.petId);
    if (!pet || pet.ownerId !== (req as any).user.uid) {
      res.status(404).json({ error: 'Pet not found' });
      return;
    }
    await updatePetProfile(req.params.petId, req.body);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

router.get('/pets/:petId/vaccination-schedule', verifyAuth, async (req, res, next) => {
  try {
    const pet = await getPetProfile(req.params.petId);
    if (!pet || pet.ownerId !== (req as any).user.uid) {
      res.status(404).json({ error: 'Pet not found' });
      return;
    }
    const schedule = await getVaccinationSchedule(req.params.petId);
    res.json(schedule);
  } catch (err) {
    next(err);
  }
});

router.patch('/vaccination-schedules/:scheduleId/vaccines/:vaccineId', verifyAuth, async (req, res, next) => {
  try {
    const { lastDate, vetName, notes } = req.body;
    // ponytail: ownership via schedule→petId→pet.ownerId; markVaccineComplete already fetches schedule
    await markVaccineComplete(req.params.scheduleId, req.params.vaccineId, lastDate, vetName, notes, (req as any).user.uid);
    res.json({ success: true });
  } catch (err: any) {
    if (err.status === 404) {
      res.status(404).json({ error: 'Pet not found' });
      return;
    }
    next(err);
  }
});

router.get('/reminders/preferences', verifyAuth, async (req, res, next) => {
  try {
    const prefs = await getReminderPreferences((req as any).user.uid);
    res.json(prefs);
  } catch (err) {
    next(err);
  }
});

router.patch('/reminders/preferences', verifyAuth, async (req, res, next) => {
  try {
    await updateReminderPreferences((req as any).user.uid, req.body);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

router.get('/reminders', verifyAuth, async (req, res, next) => {
  try {
    const reminders = await getReminders((req as any).user.uid);
    res.json(reminders);
  } catch (err) {
    next(err);
  }
});

router.post('/reminders/:reminderId/dismiss', verifyAuth, async (req, res, next) => {
  try {
    await dismissReminder(req.params.reminderId);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

router.get('/pets/:petId/booking-suggestions', verifyAuth, async (req, res, next) => {
  try {
    const pet = await getPetProfile(req.params.petId);
    if (!pet || pet.ownerId !== (req as any).user.uid) {
      res.status(404).json({ error: 'Pet not found' });
      return;
    }
    const suggestions = await getBookingSuggestions(req.params.petId);
    res.json(suggestions);
  } catch (err) {
    next(err);
  }
});

router.post('/booking-suggestions/:suggestionId/accept', verifyAuth, async (req, res, next) => {
  try {
    await acceptBookingSuggestion(req.params.suggestionId);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

export default router;
