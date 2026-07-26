import { useEffect, useState } from 'react';
import {
  processSyncQueue,
  getQueueSize,
  enqueueMutation as queueMutation,
} from '../services/offline';

export function useOffline() {
  // ponytail: no connectivity state here. Nothing detects network loss (no
  // netinfo/expo-network dep), so an `isOnline` flag would always read true.
  // Add it back together with a real listener when a consumer needs it.
  const [queueSize, setQueueSize] = useState(0);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    const checkQueue = async () => {
      const size = await getQueueSize();
      setQueueSize(size);
    };

    checkQueue();
    const interval = setInterval(checkQueue, 5000);

    return () => clearInterval(interval);
  }, []);

  const enqueueMutation = async (
    endpoint: string,
    method: 'POST' | 'PUT' | 'PATCH' | 'DELETE',
    payload: any,
  ) => {
    return await queueMutation(endpoint, method, payload);
  };

  const syncQueue = async () => {
    setSyncing(true);
    try {
      const result = await processSyncQueue();
      const size = await getQueueSize();
      setQueueSize(size);
      return result;
    } finally {
      setSyncing(false);
    }
  };

  return {
    queueSize,
    syncing,
    enqueueMutation,
    syncQueue,
  };
}
