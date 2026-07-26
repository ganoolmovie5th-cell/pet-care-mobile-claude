import React, { useState } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { PhoneScreen } from '../screens/auth/PhoneScreen';
import { OTPScreen } from '../screens/auth/OTPScreen';

const Stack = createNativeStackNavigator();

export const AuthStack = () => {
  const [phoneSent, setPhoneSent] = useState(false);

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      {!phoneSent ? (
        <Stack.Screen name="Phone" options={{ animation: 'none' }}>
          {() => <PhoneScreen onPhoneSent={() => setPhoneSent(true)} />}
        </Stack.Screen>
      ) : (
        <Stack.Screen name="OTP" options={{ animation: 'none' }}>
          {() => <OTPScreen onOTPVerified={() => setPhoneSent(false)} />}
        </Stack.Screen>
      )}
    </Stack.Navigator>
  );
};
