import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useNotifications } from '../../hooks/useNotifications';
import * as notificationService from '../../services/notifications';

jest.mock('../../services/notifications');

describe('useNotifications Hook', () => {
  const mockUserId = 'user-123';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('notifications state', () => {
    it('initializes with empty array', () => {
      (notificationService.getUserNotifications as jest.Mock).mockResolvedValue({
        notifications: [],
        total: 0,
      });

      const { result } = renderHook(() => useNotifications(mockUserId));

      expect(result.current.notifications).toEqual([]);
      expect(result.current.unreadCount).toBe(0);
    });

    it('loads notifications on init', async () => {
      const mockNotifications = [
        { id: '1', userId: mockUserId, type: 'booking', title: 'Test', read_at: null },
        { id: '2', userId: mockUserId, type: 'reminder', title: 'Test 2', read_at: null },
      ];
      (notificationService.getUserNotifications as jest.Mock).mockResolvedValue({
        notifications: mockNotifications,
        total: mockNotifications.length,
      });

      const { result } = renderHook(() => useNotifications(mockUserId));

      await waitFor(() => {
        expect(result.current.notifications).toHaveLength(2);
      });
    });
  });

  describe('unreadCount', () => {
    it('counts unread notifications', async () => {
      const mockNotifications = [
        { id: '1', userId: mockUserId, read_at: null },
        { id: '2', userId: mockUserId, read_at: null },
        { id: '3', userId: mockUserId, read_at: '2026-07-24T10:00:00Z' },
      ];
      (notificationService.getUserNotifications as jest.Mock).mockResolvedValue({
        notifications: mockNotifications,
        total: mockNotifications.length,
      });

      const { result } = renderHook(() => useNotifications(mockUserId));

      await waitFor(() => {
        expect(result.current.unreadCount).toBe(2);
      });
    });
  });

  describe('refreshNotifications', () => {
    it('refetches and updates notifications', async () => {
      const mock1 = { notifications: [{ id: '1', title: 'First' }], total: 1 };
      const mock2 = {
        notifications: [{ id: '1', title: 'First' }, { id: '2', title: 'Second' }],
        total: 2,
      };

      (notificationService.getUserNotifications as jest.Mock)
        .mockResolvedValueOnce(mock1)
        .mockResolvedValueOnce(mock2);

      const { result } = renderHook(() => useNotifications(mockUserId));

      await waitFor(() => {
        expect(result.current.notifications).toHaveLength(1);
      });

      await act(async () => {
        await result.current.refreshNotifications();
      });

      await waitFor(() => {
        expect(result.current.notifications).toHaveLength(2);
      });
    });

    it('sets loading state during refresh', async () => {
      (notificationService.getUserNotifications as jest.Mock).mockResolvedValue({
        notifications: [],
        total: 0,
      });

      const { result } = renderHook(() => useNotifications(mockUserId));

      await act(async () => {
        result.current.refreshNotifications();
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });
  });

  describe('markAsRead', () => {
    it('marks notification as read', async () => {
      (notificationService.markNotificationAsRead as jest.Mock).mockResolvedValue(undefined);

      const { result } = renderHook(() => useNotifications(mockUserId));

      await act(async () => {
        await result.current.markAsRead('notif-123');
      });

      expect(notificationService.markNotificationAsRead).toHaveBeenCalledWith('notif-123');
    });

    it('updates unreadCount after marking as read', async () => {
      const mockNotifications = [
        { id: '1', userId: mockUserId, read_at: null },
        { id: '2', userId: mockUserId, read_at: null },
      ];
      (notificationService.getUserNotifications as jest.Mock).mockResolvedValue({
        notifications: mockNotifications,
        total: mockNotifications.length,
      });
      (notificationService.markNotificationAsRead as jest.Mock).mockResolvedValue(undefined);

      const { result } = renderHook(() => useNotifications(mockUserId));

      await waitFor(() => {
        expect(result.current.unreadCount).toBe(2);
      });

      await act(async () => {
        await result.current.markAsRead('1');
      });

      await waitFor(() => {
        expect(result.current.unreadCount).toBeLessThan(2);
      });
    });
  });

  describe('setupFCM', () => {
    it('initializes FCM listeners', async () => {
      (notificationService.requestNotificationPermission as jest.Mock).mockResolvedValue(true);
      (notificationService.getAndRegisterFCMToken as jest.Mock).mockResolvedValue('test-fcm-token');
      (notificationService.setupFCMListeners as jest.Mock).mockReturnValue(() => {});

      const { result } = renderHook(() => useNotifications(mockUserId));

      await act(async () => {
        result.current.setupFCM('user-123');
      });

      expect(notificationService.setupFCMListeners).toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('sets error state on fetch failure', async () => {
      const error = new Error('Network failed');
      (notificationService.getUserNotifications as jest.Mock).mockRejectedValue(error);

      const { result } = renderHook(() => useNotifications(mockUserId));

      await waitFor(() => {
        expect(result.current.error).toBeDefined();
      });
    });
  });
});
