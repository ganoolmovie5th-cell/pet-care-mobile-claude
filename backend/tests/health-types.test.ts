import { Pet, VaccinationSchedule, Reminder } from '../src/types/health';

describe('Health Types', () => {
  it('should compile Pet interface', () => {
    const pet: Pet = {
      id: 'pet_1',
      ownerId: 'user_1',
      name: 'Bella',
      breed: 'Golden Retriever',
      birthdate: '2022-01-15',
      createdAt: '2026-07-24T10:00:00Z',
    };
    expect(pet.name).toBe('Bella');
  });

  it('should compile VaccinationSchedule', () => {
    const schedule: VaccinationSchedule = {
      id: 'sched_1',
      petId: 'pet_1',
      petName: 'Bella',
      breed: 'Golden Retriever',
      vaccines: [{
        id: 'vac_1',
        name: 'Rabies',
        nextDueDate: '2026-08-15',
        status: 'upcoming',
        frequency: 'annual',
      }],
      calculatedAt: '2026-07-24T10:00:00Z',
      updatedAt: '2026-07-24T10:00:00Z',
    };
    expect(schedule.vaccines.length).toBe(1);
  });
});
