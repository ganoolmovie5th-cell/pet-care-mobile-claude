import React, { useEffect } from 'react';
import { Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { AuthProvider } from './context/AuthContext';
import { RootNavigator } from './navigation/RootNavigator';
import { useAppInit } from './hooks/useAppInit';
import { useAuth } from './hooks/useAuth';
import { useNotifications } from './hooks/useNotifications';
import { requestNotificationPermission, getAndRegisterFCMToken } from './services/notifications';

function AppContent() {
  const { user } = useAuth();
  const { setupFCM } = useNotifications();
  useAppInit();

  useEffect(() => {
    if (!user) return;

    const initFCM = async () => {
      try {
        const hasPermission = await requestNotificationPermission();
        if (hasPermission) {
          await getAndRegisterFCMToken(
            user.uid,
            Platform.OS === 'ios' ? 'iOS' : 'Android'
          );
          setupFCM(user.uid);
        }
      } catch (error) {
        console.error('FCM initialization failed:', error);
      }
    };

    initFCM();
  }, [user, setupFCM]);

  return (
    <NavigationContainer>
      <RootNavigator />
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
