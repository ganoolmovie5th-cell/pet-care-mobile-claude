import { renderHook, act } from '@testing-library/react-native';
import { useBooking } from '../../hooks/useBooking';
import * as bookingService from '../../services/booking';

jest.mock('../../services/booking');

const newBooking = {
  ownerId: 'user_1',
  petId: 'pet_1',
  vetId: 'vet_1',
  date: '2026-08-01',
  time: '10:00',
  status: 'pending',
  payment_status: 'unpaid',
} as any;

const mockBookings = [
  { ...newBooking, id: 'booking_1', created_at: '2026-07-26T00:00:00Z' },
  {
    ...newBooking,
    id: 'booking_2',
    date: '2026-08-15',
    status: 'confirmed',
    created_at: '2026-07-26T00:00:00Z',
  },
] as any;

describe('useBooking', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('starts empty and not loading', () => {
    const { result } = renderHook(() => useBooking());

    expect(result.current.bookings).toEqual([]);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('createNewBooking returns the new id and does not prepend to the list', async () => {
    (bookingService.createBooking as jest.Mock).mockResolvedValue('booking_1');

    const { result } = renderHook(() => useBooking());

    let id;
    await act(async () => {
      id = await result.current.createNewBooking(newBooking);
    });

    expect(bookingService.createBooking).toHaveBeenCalledWith(newBooking);
    expect(id).toBe('booking_1');
    expect(result.current.bookings).toEqual([]);
    expect(result.current.error).toBeNull();
  });

  it('createNewBooking returns null and records the error on failure', async () => {
    (bookingService.createBooking as jest.Mock).mockRejectedValue(
      new Error('Slot already taken'),
    );

    const { result } = renderHook(() => useBooking());

    let id;
    await act(async () => {
      id = await result.current.createNewBooking(newBooking);
    });

    expect(id).toBeNull();
    expect(result.current.error).toBe('Slot already taken');
    expect(result.current.loading).toBe(false);
  });

  it('fetchBookings fills the list for the owner', async () => {
    (bookingService.getBookingsByOwner as jest.Mock).mockResolvedValue(mockBookings);

    const { result } = renderHook(() => useBooking());

    await act(async () => {
      await result.current.fetchBookings('user_1');
    });

    expect(bookingService.getBookingsByOwner).toHaveBeenCalledWith('user_1');
    expect(result.current.bookings).toHaveLength(2);
    expect(result.current.bookings[1].status).toBe('confirmed');
  });

  it('fetchBookings keeps the list empty on failure', async () => {
    (bookingService.getBookingsByOwner as jest.Mock).mockRejectedValue(
      new Error('Unauthorized'),
    );

    const { result } = renderHook(() => useBooking());

    await act(async () => {
      await result.current.fetchBookings('user_1');
    });

    expect(result.current.bookings).toEqual([]);
    expect(result.current.error).toBe('Unauthorized');
  });

  it('clears a previous error on the next successful call', async () => {
    (bookingService.getBookingsByOwner as jest.Mock)
      .mockRejectedValueOnce(new Error('Timeout'))
      .mockResolvedValueOnce(mockBookings);

    const { result } = renderHook(() => useBooking());

    await act(async () => {
      await result.current.fetchBookings('user_1');
    });
    expect(result.current.error).toBe('Timeout');

    await act(async () => {
      await result.current.fetchBookings('user_1');
    });
    expect(result.current.error).toBeNull();
    expect(result.current.bookings).toHaveLength(2);
  });
});
