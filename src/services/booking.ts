import axios from 'axios';

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

const apiBaseUrl = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';

export const createBooking = async (booking: Omit<Booking, 'id' | 'created_at'>): Promise<string> => {
  const response = await axios.post(`${apiBaseUrl}/bookings`, booking);
  return response.data.id;
};

export const getBookingsByOwner = async (ownerId: string): Promise<Booking[]> => {
  const response = await axios.get(`${apiBaseUrl}/bookings/owner/${ownerId}`);
  return response.data;
};
