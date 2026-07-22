import { useState, useCallback } from 'react';
import { createBooking, getBookingsByOwner, Booking } from '../services/booking';

interface UseBookingReturn {
  bookings: Booking[];
  loading: boolean;
  error: string | null;
  createNewBooking: (booking: Omit<Booking, 'id' | 'created_at'>) => Promise<string | null>;
  fetchBookings: (ownerId: string) => Promise<void>;
}

export const useBooking = (): UseBookingReturn => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createNewBooking = useCallback(
    async (booking: Omit<Booking, 'id' | 'created_at'>): Promise<string | null> => {
      try {
        setLoading(true);
        setError(null);
        const bookingId = await createBooking(booking);
        return bookingId;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to create booking';
        setError(errorMsg);
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const fetchBookings = useCallback(async (ownerId: string) => {
    try {
      setLoading(true);
      setError(null);
      const data = await getBookingsByOwner(ownerId);
      setBookings(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch bookings');
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    bookings,
    loading,
    error,
    createNewBooking,
    fetchBookings,
  };
};
