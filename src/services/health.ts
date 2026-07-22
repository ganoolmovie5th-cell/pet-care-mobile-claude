import axios from 'axios';

export interface Pet {
  id: string;
  ownerId: string;
  name: string;
  breed: string;
  age: number;
  photo?: string;
  microchip?: string;
  created_at: string;
}

export interface HealthRecord {
  id: string;
  petId: string;
  type: 'vaksin' | 'checkup' | 'medication' | 'surgery';
  date: string;
  note: string;
  vet_name?: string;
  next_due_date?: string;
  created_at: string;
}

const apiBaseUrl = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';

export const createPet = async (pet: Omit<Pet, 'id' | 'created_at'>): Promise<string> => {
  const response = await axios.post(`${apiBaseUrl}/health/pets`, pet);
  return response.data.id;
};

export const getPetsByOwner = async (ownerId: string): Promise<Pet[]> => {
  const response = await axios.get(`${apiBaseUrl}/health/pets/owner/${ownerId}`);
  return response.data;
};

export const addHealthRecord = async (record: Omit<HealthRecord, 'id' | 'created_at'>): Promise<string> => {
  const response = await axios.post(`${apiBaseUrl}/health/records`, record);
  return response.data.id;
};

export const getHealthRecordsByPet = async (petId: string): Promise<HealthRecord[]> => {
  const response = await axios.get(`${apiBaseUrl}/health/records/pet/${petId}`);
  return response.data;
};

export const getAllHealthRecords = async (): Promise<HealthRecord[]> => {
  const response = await axios.get(`${apiBaseUrl}/health/records`);
  return response.data;
};
