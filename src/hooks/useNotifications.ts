import { useEffect, useState, useCallback } from 'react';
import { Platform } from 'react-native';
import {
  requestNotificationPermission,
  getAndRegisterFCMToken,
  getUserNotifications,
  markNotificationAsRead,
  setupFCMListeners,
  UserNotification,
} from '../services/notifications';

interface UseNotificationsReturn {
  notifications: UserNotification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  refreshNotifications: () => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  setupFCM: (userId: string) => Promise<void>;
}

export const useNotifications = (userId?: string): UseNotificationsReturn => {
  const [notifications, setNotifications] = useState<UserNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshNotifications = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const response = await getUserNotifications(userId, false, 50, 0);
      setNotifications(response.notifications);
      const unread = response.notifications.filter(n => !n.read_at).length;
      setUnreadCount(unread);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch notifications');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const markAsRead = useCallback(
    async (notificationId: string) => {
      try {
        await markNotificationAsRead(notificationId);
        setNotifications(prev =>
          prev.map(n =>
            n.id === notificationId ? { ...n, read_at: new Date().toISOString() } : n
          )
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      } catch (err) {
        console.error('Error marking notification as read:', err);
      }
    },
    []
  );

  const setupFCM = useCallback(
    async (uid: string) => {
      try {
        // Request permission
        const hasPermission = await requestNotificationPermission();
        if (!hasPermission) {
          console.warn('Notification permission denied');
          return;
        }

        // Register token
        const device = Platform.OS === 'ios' ? ('iOS' as const) : ('Android' as const);
        await getAndRegisterFCMToken(uid, device);

        // Setup listeners
        setupFCMListeners(
          message => {
            console.log('Foreground notification:', message);
            refreshNotifications();
          },
          message => {
            console.log('Background notification:', message);
          }
        );
      } catch (err) {
        console.error('Error setting up FCM:', err);
      }
    },
    [refreshNotifications]
  );

  useEffect(() => {
    if (userId) {
      refreshNotifications();
    }
  }, [userId, refreshNotifications]);

  return {
    notifications,
    unreadCount,
    loading,
    error,
    refreshNotifications,
    markAsRead,
    setupFCM,
  };
};
