import express from 'express';
import { verifyAuth } from '../middleware/auth';
import {
  createPet,
  getPetProfile,
  updatePetProfile,
  getVaccinationSchedule,
  markVaccineComplete,
} from '../services/health';

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
    if (!pet) {
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
    await updatePetProfile(req.params.petId, req.body);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

router.get('/pets/:petId/vaccination-schedule', verifyAuth, async (req, res, next) => {
  try {
    const schedule = await getVaccinationSchedule(req.params.petId);
    res.json(schedule);
  } catch (err) {
    next(err);
  }
});

router.patch('/vaccination-schedules/:scheduleId/vaccines/:vaccineId', verifyAuth, async (req, res, next) => {
  try {
    const { lastDate, vetName, notes } = req.body;
    await markVaccineComplete(req.params.scheduleId, req.params.vaccineId, lastDate, vetName, notes);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

export default router;
