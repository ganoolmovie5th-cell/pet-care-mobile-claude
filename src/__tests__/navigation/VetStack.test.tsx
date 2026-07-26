/* eslint-disable @typescript-eslint/no-var-requires -- jest.mock factories cannot
   reference top-level imports, so require() inside them is the supported pattern. */
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { VetStack } from '../../navigation/VetStack';
import { AuthContext } from '../../context/AuthContext';

// Stub every screen so this suite only exercises VetStack's own wiring:
// which params each route receives and how the callbacks chain them.
jest.mock('../../screens/vet/VetBrowseScreen', () => {
  const { TouchableOpacity, Text } = require('react-native');
  return {
    VetBrowseScreen: ({ onVetSelect }: any) => (
      <TouchableOpacity onPress={() => onVetSelect('vet_1')}>
        <Text>stub-browse</Text>
      </TouchableOpacity>
    ),
  };
});

jest.mock('../../screens/vet/VetDetailScreen', () => {
  const { TouchableOpacity, Text } = require('react-native');
  return {
    VetDetailScreen: ({ vetId, onBooking }: any) => (
      <TouchableOpacity
        onPress={() =>
          onBooking({ id: vetId, clinic_name: 'Klinik Sehat', consultation_fee: 150000 })
        }
      >
        <Text>stub-detail:{vetId}</Text>
      </TouchableOpacity>
    ),
  };
});

jest.mock('../../screens/vet/BookingScreen', () => {
  const { TouchableOpacity, Text } = require('react-native');
  return {
    BookingScreen: ({ vetId, vetName, onBookingComplete }: any) => (
      <TouchableOpacity onPress={() => onBookingComplete('booking_1', 'Bimo')}>
        <Text>
          stub-booking:{vetId}:{vetName}
        </Text>
      </TouchableOpacity>
    ),
  };
});

jest.mock('../../screens/vet/BookingConfirmScreen', () => {
  const { Text } = require('react-native');
  return {
    BookingConfirmScreen: ({ bookingId, amount, petName, vetName, userId }: any) => (
      <Text>
        stub-confirm:{bookingId}:{amount}:{petName}:{vetName}:{userId}
      </Text>
    ),
  };
});

const renderStack = () =>
  render(
    <AuthContext.Provider
      value={{ user: { uid: 'user_1' } as any, loading: false, error: null }}
    >
      <NavigationContainer>
        <VetStack />
      </NavigationContainer>
    </AuthContext.Provider>,
  );

describe('VetStack', () => {
  it('starts on the browse screen', async () => {
    const { getByText } = renderStack();

    await waitFor(() => getByText('stub-browse'));
  });

  it('threads params through browse -> detail -> booking -> confirm', async () => {
    const { getByText } = renderStack();
    await waitFor(() => getByText('stub-browse'));

    fireEvent.press(getByText('stub-browse'));
    await waitFor(() => getByText('stub-detail:vet_1'));

    fireEvent.press(getByText('stub-detail:vet_1'));
    await waitFor(() => getByText('stub-booking:vet_1:Klinik Sehat'));

    fireEvent.press(getByText('stub-booking:vet_1:Klinik Sehat'));
    await waitFor(() =>
      getByText('stub-confirm:booking_1:150000:Bimo:Klinik Sehat:user_1'),
    );
  });
});
