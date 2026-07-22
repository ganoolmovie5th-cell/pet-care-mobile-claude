import axios from 'axios';

export interface Vet {
  id: string;
  clinic_name: string;
  location: {
    lat: number;
    lng: number;
    city: string;
    address: string;
  };
  specialties: string[];
  hours: {
    open: string;
    close: string;
  };
  rating: number;
  review_count: number;
  consultation_fee: number;
  phone: string;
  created_at: string;
}

const apiBaseUrl = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';

export const getAllVets = async (): Promise<Vet[]> => {
  const response = await axios.get(`${apiBaseUrl}/vets`);
  return response.data;
};

export const getVetById = async (vetId: string): Promise<Vet> => {
  const response = await axios.get(`${apiBaseUrl}/vets/${vetId}`);
  return response.data;
};

export const searchVets = async (filters: {
  city?: string;
  specialty?: string;
  minRating?: number;
  maxDistance?: number;
  lat?: number;
  lng?: number;
}): Promise<Vet[]> => {
  const params = new URLSearchParams();
  if (filters.city) params.append('city', filters.city);
  if (filters.specialty) params.append('specialty', filters.specialty);
  if (filters.minRating) params.append('minRating', filters.minRating.toString());
  if (filters.maxDistance) params.append('maxDistance', filters.maxDistance.toString());
  if (filters.lat) params.append('lat', filters.lat.toString());
  if (filters.lng) params.append('lng', filters.lng.toString());

  const response = await axios.get(`${apiBaseUrl}/vets/search?${params}`);
  return response.data;
};
