import { useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { processSyncQueue, getQueueSize } from '../services/offline';
import { initSentry, addBreadcrumb } from '../services/sentry';

export const useAppInit = () => {
  const [queueSize, setQueueSize] = useState(0);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    // Initialize Sentry on app start
    initSentry();
    addBreadcrumb('App initialized');

    // Check sync queue on mount
    checkQueue();

    // Monitor app state changes (foreground/background)
    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription.remove();
    };
  }, []);

  const checkQueue = async () => {
    const size = await getQueueSize();
    setQueueSize(size);
    if (size > 0) {
      addBreadcrumb(`Offline queue has ${size} mutations`);
    }
  };

  const handleAppStateChange = async (nextAppState: string) => {
    if (nextAppState === 'active') {
      // App came to foreground - attempt sync
      addBreadcrumb('App returned to foreground, attempting sync');
      await triggerSync();
    }
  };

  const triggerSync = async () => {
    const size = await getQueueSize();
    if (size === 0) return;

    setSyncing(true);
    try {
      const { synced, failed } = await processSyncQueue();
      addBreadcrumb(
        `Sync complete: ${synced} synced, ${failed} failed`,
        failed > 0 ? 'warning' : 'info',
      );
      await checkQueue();
    } catch (err) {
      addBreadcrumb(
        `Sync failed: ${err instanceof Error ? err.message : 'unknown error'}`,
        'error',
      );
    } finally {
      setSyncing(false);
    }
  };

  return { queueSize, syncing, triggerSync, checkQueue };
};
