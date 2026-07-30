import { api } from './api';

export interface Booking {
  id: string;
  ownerId: string;
  petId: string;
  vetId: string;
  date: string;
  time: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  payment_status: 'pending' | 'paid' | 'refunded';
  notes?: string;
  created_at: string;
}

export const createBooking = async (
  booking: Omit<Booking, 'id' | 'created_at' | 'ownerId'>,
): Promise<string> => {
  const response = await api.post('/bookings', booking);
  return response.data.id;
};

export const getBookingsByOwner = async (ownerId: string): Promise<Booking[]> => {
  const response = await api.get(`/bookings/owner/${ownerId}`);
  return response.data;
};
