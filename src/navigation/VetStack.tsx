import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { VetBrowseScreen } from '../screens/vet/VetBrowseScreen';
import { VetDetailScreen } from '../screens/vet/VetDetailScreen';
import { BookingScreen } from '../screens/vet/BookingScreen';
import { BookingConfirmScreen } from '../screens/vet/BookingConfirmScreen';
import { useAuth } from '../hooks/useAuth';

export type VetStackParamList = {
  VetBrowse: undefined;
  VetDetail: { vetId: string };
  Booking: { vetId: string; vetName: string; fee: number };
  BookingConfirm: {
    bookingId: string;
    vetId: string;
    vetName: string;
    amount: number;
    petName: string;
  };
};

const Stack = createNativeStackNavigator<VetStackParamList>();

export const VetStack = () => {
  const { user } = useAuth();

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#0f5c4a' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: '600' },
      }}
    >
      <Stack.Screen name="VetBrowse" options={{ title: 'Vets' }}>
        {(props: any) => (
          <VetBrowseScreen
            onVetSelect={(vetId) => props.navigation.navigate('VetDetail', { vetId })}
          />
        )}
      </Stack.Screen>

      <Stack.Screen name="VetDetail" options={{ title: 'Clinic' }}>
        {(props: any) => (
          <VetDetailScreen
            vetId={props.route.params.vetId}
            onBooking={(vet) =>
              props.navigation.navigate('Booking', {
                vetId: vet.id,
                vetName: vet.clinic_name,
                fee: vet.consultation_fee,
              })
            }
          />
        )}
      </Stack.Screen>

      <Stack.Screen name="Booking" options={{ title: 'Book Appointment' }}>
        {(props: any) => (
          <BookingScreen
            vetId={props.route.params.vetId}
            vetName={props.route.params.vetName}
            onBookingComplete={(bookingId, petName) =>
              props.navigation.navigate('BookingConfirm', {
                bookingId,
                vetId: props.route.params.vetId,
                vetName: props.route.params.vetName,
                amount: props.route.params.fee,
                petName,
              })
            }
          />
        )}
      </Stack.Screen>

      <Stack.Screen name="BookingConfirm" options={{ title: 'Payment' }}>
        {(props: any) => (
          <BookingConfirmScreen
            bookingId={props.route.params.bookingId}
            amount={props.route.params.amount}
            petName={props.route.params.petName}
            vetName={props.route.params.vetName}
            vetClinicName={props.route.params.vetName}
            vetId={props.route.params.vetId}
            userId={user?.uid || ''}
            onPaymentComplete={() => props.navigation.popToTop()}
          />
        )}
      </Stack.Screen>
    </Stack.Navigator>
  );
};
