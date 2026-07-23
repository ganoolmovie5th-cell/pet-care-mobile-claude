import { useEffect, useState } from 'react';
import { processSyncQueue, getQueueSize, enqueueMutation as queueMutation } from '../services/offline';

export function useOffline() {
  const [isOnline, setIsOnline] = useState(true);
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
    payload: any
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
    isOnline,
    queueSize,
    syncing,
    enqueueMutation,
    syncQueue,
  };
}
