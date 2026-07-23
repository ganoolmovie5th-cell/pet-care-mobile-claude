import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

export interface QueuedMutation {
  id: string;
  endpoint: string;
  method: 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  payload: any;
  timestamp: number;
  retries: number;
}

const QUEUE_KEY = '@pet_care_sync_queue';
const MAX_RETRIES = 5;

export async function enqueueMutation(
  endpoint: string,
  method: 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  payload: any
): Promise<string> {
  const mutation: QueuedMutation = {
    id: `mutation_${Date.now()}_${Math.random()}`,
    endpoint,
    method,
    payload,
    timestamp: Date.now(),
    retries: 0,
  };

  const queue = await getQueue();
  queue.push(mutation);
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));

  return mutation.id;
}

export async function getQueue(): Promise<QueuedMutation[]> {
  try {
    const data = await AsyncStorage.getItem(QUEUE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (err) {
    console.error('Failed to load queue:', err);
    return [];
  }
}

export async function processSyncQueue(): Promise<{ synced: number; failed: number }> {
  const queue = await getQueue();
  if (queue.length === 0) return { synced: 0, failed: 0 };

  let synced = 0;
  let failed = 0;
  const remaining: QueuedMutation[] = [];

  for (const mutation of queue) {
    try {
      if (mutation.method === 'POST') {
        await axios.post(mutation.endpoint, mutation.payload);
      } else if (mutation.method === 'PUT') {
        await axios.put(mutation.endpoint, mutation.payload);
      } else if (mutation.method === 'PATCH') {
        await axios.patch(mutation.endpoint, mutation.payload);
      } else if (mutation.method === 'DELETE') {
        await axios.delete(mutation.endpoint);
      }
      synced++;
    } catch (err) {
      mutation.retries++;
      if (mutation.retries < MAX_RETRIES) {
        remaining.push(mutation);
      } else {
        console.error(`Mutation ${mutation.id} failed after ${MAX_RETRIES} retries`);
        failed++;
      }
    }
  }

  if (remaining.length > 0) {
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(remaining));
  } else {
    await AsyncStorage.removeItem(QUEUE_KEY);
  }

  return { synced, failed };
}

export async function clearQueue(): Promise<void> {
  await AsyncStorage.removeItem(QUEUE_KEY);
}

export async function getQueueSize(): Promise<number> {
  const queue = await getQueue();
  return queue.length;
}
