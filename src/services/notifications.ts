import messaging from '@react-native-firebase/messaging';
import { api } from './api';

export interface UserNotification {
  id: string;
  userId: string;
  type: 'booking' | 'playdate_match' | 'reminder' | 'message';
  title: string;
  body: string;
  data?: Record<string, string>;
  deeplink?: string;
  sent_at: string;
  read_at?: string;
}

export interface NotificationsResponse {
  notifications: UserNotification[];
  total: number;
}

export const requestNotificationPermission = async (): Promise<boolean> => {
  try {
    const permission = await messaging().requestPermission();
    return permission === messaging.AuthorizationStatus.AUTHORIZED ||
           permission === messaging.AuthorizationStatus.PROVISIONAL;
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return false;
  }
};

export const getAndRegisterFCMToken = async (userId: string, device: 'iOS' | 'Android'): Promise<string> => {
  try {
    const token = await messaging().getToken();
    await api.post('/fcm/register-token', {
      userId,
      token,
      device,
    });
    return token;
  } catch (error) {
    console.error('Error getting/registering FCM token:', error);
    throw error;
  }
};

export const getUserNotifications = async (
  userId: string,
  unreadOnly: boolean = false,
  limit: number = 20,
  offset: number = 0
): Promise<NotificationsResponse> => {
  const response = await api.get('/fcm/notifications', {
    params: {
      userId,
      unreadOnly: unreadOnly ? 'true' : 'false',
      limit,
      offset,
    },
  });
  return response.data;
};

export const markNotificationAsRead = async (notificationId: string): Promise<void> => {
  await api.patch(`/fcm/notifications/${notificationId}/read`);
};

export const setupFCMListeners = (
  onMessage: (notification: any) => void,
  onBackgroundMessage?: (notification: any) => void
): (() => void) => {
  // Foreground message handler
  const unsubscribeForeground = messaging().onMessage(remoteMessage => {
    if (remoteMessage.notification) {
      onMessage(remoteMessage);
    }
  });

  // Background message handler (optional)
  if (onBackgroundMessage) {
    messaging().setBackgroundMessageHandler(async remoteMessage => {
      onBackgroundMessage(remoteMessage);
    });
  }

  return unsubscribeForeground;
};

export const parseNotificationDeeplink = (notification: any): string | null => {
  return notification?.data?.deeplink || null;
};
