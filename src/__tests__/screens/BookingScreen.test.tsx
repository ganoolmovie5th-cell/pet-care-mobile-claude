import React from 'react';
import { Alert } from 'react-native';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { BookingScreen } from '../../screens/vet/BookingScreen';
import { AuthContext } from '../../context/AuthContext';
import * as healthService from '../../services/health';
import * as bookingService from '../../services/booking';

jest.mock('../../services/health');
jest.mock('../../services/booking');

const mockPets = [
  {
    id: 'pet_1',
    ownerId: 'user_1',
    name: 'Bimo',
    breed: 'Kucing Kampung',
    birthdate: '2023-04-01',
    createdAt: '2026-07-01T00:00:00Z',
  },
  {
    id: 'pet_2',
    ownerId: 'user_1',
    name: 'Coklat',
    breed: 'Golden Retriever',
    birthdate: '2022-01-05',
    createdAt: '2026-07-02T00:00:00Z',
  },
] as any;

const renderScreen = (onBookingComplete = jest.fn()) => {
  const utils = render(
    <AuthContext.Provider
      value={{ user: { uid: 'user_1' } as any, loading: false, error: null }}
    >
      <BookingScreen
        vetId="vet_1"
        vetName="Klinik Sehat"
        onBookingComplete={onBookingComplete}
      />
    </AuthContext.Provider>,
  );
  return { ...utils, onBookingComplete };
};

const fillDateAndTime = (utils: ReturnType<typeof renderScreen>) => {
  fireEvent.changeText(utils.getByPlaceholderText('2024-01-15'), '2026-08-10');
  fireEvent.changeText(utils.getByPlaceholderText('14:30'), '14:30');
};

describe('BookingScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
    (healthService.getPetsByOwner as jest.Mock).mockResolvedValue(mockPets);
    (bookingService.createBooking as jest.Mock).mockResolvedValue('booking_1');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("lists the signed-in owner's pets", async () => {
    const utils = renderScreen();

    await waitFor(() => utils.getByText('Bimo'));

    expect(healthService.getPetsByOwner).toHaveBeenCalledWith('user_1');
    expect(utils.getByText('Coklat')).toBeTruthy();
  });

  it('reports the chosen pet name alongside the booking id', async () => {
    const utils = renderScreen();
    await waitFor(() => utils.getByText('Coklat'));

    fillDateAndTime(utils);
    fireEvent.press(utils.getByText('Coklat'));
    fireEvent.press(utils.getByText('Confirm Booking'));

    await waitFor(() =>
      expect(utils.onBookingComplete).toHaveBeenCalledWith('booking_1', 'Coklat'),
    );
    expect(bookingService.createBooking).toHaveBeenCalledWith(
      expect.objectContaining({ ownerId: 'user_1', petId: 'pet_2', vetId: 'vet_1' }),
    );
  });

  it('refuses to book until a pet is picked', async () => {
    const utils = renderScreen();
    await waitFor(() => utils.getByText('Bimo'));

    fillDateAndTime(utils);
    fireEvent.press(utils.getByText('Confirm Booking'));

    await waitFor(() =>
      expect(Alert.alert).toHaveBeenCalledWith(
        'Error',
        'Please fill in all required fields',
      ),
    );
    expect(bookingService.createBooking).not.toHaveBeenCalled();
  });

  it('points the owner at the Health tab when they have no pets', async () => {
    (healthService.getPetsByOwner as jest.Mock).mockResolvedValue([]);

    const utils = renderScreen();

    await waitFor(() => utils.getByText('No pets yet. Add one in the Health tab first.'));
  });
});
