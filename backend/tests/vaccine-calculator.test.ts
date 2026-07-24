import { calculateVaccineSchedule } from '../src/services/vaccine-calculator';
import { subYears } from 'date-fns';

describe('Vaccine Calculator', () => {
  it('should calculate schedule for adult dog', async () => {
    const birthdate = subYears(new Date(), 2).toISOString().split('T')[0];
    const schedule = await calculateVaccineSchedule('Golden Retriever', birthdate);

    expect(schedule.length).toBeGreaterThan(0);
    expect(schedule[0].name).toBeDefined();
  });

  it('should mark vaccine overdue if due date in past', async () => {
    const birthdate = '2020-01-15';
    const schedule = await calculateVaccineSchedule('Golden Retriever', birthdate);

    const overdue = schedule.filter(v => v.status === 'overdue');
    expect(overdue.length).toBeGreaterThan(0);
  });

  it('should use defaults for unknown breed', async () => {
    const birthdate = subYears(new Date(), 1).toISOString().split('T')[0];
    const schedule = await calculateVaccineSchedule('Unknown', birthdate);

    expect(schedule.length).toBeGreaterThan(0);
    expect(schedule.map(v => v.name)).toContain('Rabies');
  });
});
