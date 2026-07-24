import { Vaccine, VaccineType } from '../types/health';
import { addDays, addWeeks, format } from 'date-fns';

const VACCINE_DEFAULTS: Record<string, VaccineType[]> = {
  'Golden Retriever': [
    { id: 'rabies', name: 'Rabies', frequency: 'annual', ageWeeksStart: 12 },
    { id: 'dhpp', name: 'DHPP', frequency: '3-year', ageWeeksStart: 6, ageWeeksInterval: 3 },
  ],
  'Labrador Retriever': [
    { id: 'rabies', name: 'Rabies', frequency: 'annual', ageWeeksStart: 12 },
    { id: 'dhpp', name: 'DHPP', frequency: '3-year', ageWeeksStart: 6, ageWeeksInterval: 3 },
  ],
};

const DEFAULT_VACCINES: VaccineType[] = [
  { id: 'rabies', name: 'Rabies', frequency: 'annual', ageWeeksStart: 12 },
  { id: 'dhpp', name: 'DHPP', frequency: '3-year', ageWeeksStart: 6, ageWeeksInterval: 3 },
];

export async function calculateVaccineSchedule(breed: string, birthdate: string): Promise<Vaccine[]> {
  const vaccines = VACCINE_DEFAULTS[breed] || DEFAULT_VACCINES;
  const today = new Date();
  const birthDate = new Date(birthdate);

  return vaccines.map((vac) => {
    const nextDueDate = vac.ageWeeksStart
      ? addWeeks(birthDate, vac.ageWeeksStart)
      : addDays(today, 30);

    const daysUntilDue = Math.floor((nextDueDate.getTime() - today.getTime()) / (24 * 60 * 60 * 1000));
    let status: 'completed' | 'upcoming' | 'due_soon' | 'overdue' = 'upcoming';
    if (daysUntilDue < 0) status = 'overdue';
    else if (daysUntilDue <= 7) status = 'due_soon';

    return {
      id: vac.id,
      name: vac.name,
      nextDueDate: format(nextDueDate, 'yyyy-MM-dd'),
      status,
      frequency: vac.frequency,
    };
  });
}
