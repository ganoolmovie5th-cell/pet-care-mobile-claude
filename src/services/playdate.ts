import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PlaydatePost, PlaydateChat, Message } from '../types/playdate';
import { enqueueMutation, processSyncQueue } from './offline';

const apiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:5000';

// Phase 5: Retry logic with exponential backoff
const exponentialBackoff = (attempt: number) => Math.min(1000 * Math.pow(2, attempt), 30000);

const retryRequest = async <T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  attempt = 0
): Promise<T> => {
  try {
    return await fn();
  } catch (err: any) {
    if (attempt < maxRetries && (err.code === 'ECONNREFUSED' || err.response?.status >= 500)) {
      const delay = exponentialBackoff(attempt);
      await new Promise(resolve => setTimeout(resolve, delay));
      return retryRequest(fn, maxRetries, attempt + 1);
    }
    throw err;
  }
};

// Task 22: API wrappers with AsyncStorage caching

export const createPlaydatePost = async (
  post: Omit<PlaydatePost, 'id' | 'created_at'>
): Promise<PlaydatePost> => {
  try {
    const response = await retryRequest(() => axios.post(`${apiBaseUrl}/playdate/posts`, post));
    const newPost = response.data as PlaydatePost;
    await AsyncStorage.removeItem('playdate_posts_all').catch(() => {});
    return newPost;
  } catch (err) {
    // Phase 5: Queue for offline sync
    await enqueueMutation(`${apiBaseUrl}/playdate/posts`, 'POST', post);
    // Return optimistic placeholder with local ID
    const now = new Date().toISOString();
    return {
      id: `local_${Date.now()}`,
      created_at: now,
      ...post,
      updated_at: now,
    } as PlaydatePost;
  }
};

export const getAllActivePosts = async (): Promise<PlaydatePost[]> => {
  const cached = await AsyncStorage.getItem('playdate_posts_all').catch(() => null);
  if (cached) return JSON.parse(cached);

  const response = await axios.get(`${apiBaseUrl}/playdate/posts/active/all`);
  const posts = response.data as PlaydatePost[];
  await AsyncStorage.setItem('playdate_posts_all', JSON.stringify(posts)).catch(() => {});
  return posts;
};

export const getPlaydatePost = async (postId: string): Promise<PlaydatePost> => {
  const cached = await AsyncStorage.getItem(`playdate_post_${postId}`).catch(() => null);
  if (cached) return JSON.parse(cached);

  const response = await axios.get(`${apiBaseUrl}/playdate/posts/${postId}`);
  const post = response.data as PlaydatePost;
  await AsyncStorage.setItem(`playdate_post_${postId}`, JSON.stringify(post)).catch(() => {});
  return post;
};

export const updatePlaydatePost = async (
  postId: string,
  updates: Partial<PlaydatePost>
): Promise<void> => {
  try {
    await retryRequest(() => axios.patch(`${apiBaseUrl}/playdate/posts/${postId}`, updates));
    await AsyncStorage.removeItem(`playdate_post_${postId}`).catch(() => {});
    await AsyncStorage.removeItem('playdate_posts_all').catch(() => {});
  } catch (err) {
    // Phase 5: Queue for offline sync
    await enqueueMutation(`${apiBaseUrl}/playdate/posts/${postId}`, 'PATCH', updates);
  }
};

export const getPlaydatePostsByOwner = async (ownerId: string): Promise<PlaydatePost[]> => {
  const response = await axios.get(`${apiBaseUrl}/playdate/posts?owner=${ownerId}`);
  return response.data as PlaydatePost[];
};

export const addInterestedOwner = async (postId: string): Promise<void> => {
  try {
    await retryRequest(() => axios.post(`${apiBaseUrl}/playdate/posts/${postId}/interested`));
    await AsyncStorage.removeItem(`playdate_post_${postId}`).catch(() => {});
    await AsyncStorage.removeItem('playdate_posts_all').catch(() => {});
  } catch (err) {
    await enqueueMutation(`${apiBaseUrl}/playdate/posts/${postId}/interested`, 'POST', {});
  }
};

export const removeInterestedOwner = async (postId: string): Promise<void> => {
  try {
    await retryRequest(() => axios.delete(`${apiBaseUrl}/playdate/posts/${postId}/interested`));
    await AsyncStorage.removeItem(`playdate_post_${postId}`).catch(() => {});
    await AsyncStorage.removeItem('playdate_posts_all').catch(() => {});
  } catch (err) {
    await enqueueMutation(`${apiBaseUrl}/playdate/posts/${postId}/interested`, 'DELETE', {});
  }
};

export const createPlaydateChat = async (
  postId: string,
  interestedOwnerId: string,
  initialMessage: string
): Promise<PlaydateChat> => {
  try {
    const response = await retryRequest(() =>
      axios.post(`${apiBaseUrl}/playdate/posts/${postId}/chat/start`, {
        interestedOwnerId,
        initialMessage,
      })
    );
    return response.data as PlaydateChat;
  } catch (err) {
    // Phase 5: Queue for offline sync
    await enqueueMutation(`${apiBaseUrl}/playdate/posts/${postId}/chat/start`, 'POST', {
      interestedOwnerId,
      initialMessage,
    });
    // Return optimistic placeholder
    const now = new Date().toISOString();
    return {
      id: `local_chat_${Date.now()}`,
      postId,
      ownerId: 'current-user',
      interestedOwnerId,
      messages: [{ sender: 'current-user', text: initialMessage, timestamp: now }],
      status: 'active',
      created_at: now,
    } as PlaydateChat;
  }
};

export const getPlaydateChatsByPost = async (postId: string): Promise<PlaydateChat[]> => {
  const response = await axios.get(`${apiBaseUrl}/playdate/posts/${postId}/chat`);
  return response.data as PlaydateChat[];
};

export const getPlaydateChat = async (chatId: string): Promise<PlaydateChat> => {
  const cached = await AsyncStorage.getItem(`playdate_chat_${chatId}`).catch(() => null);
  if (cached) return JSON.parse(cached);

  const response = await axios.get(`${apiBaseUrl}/playdate/chat/${chatId}`);
  const chat = response.data as PlaydateChat;
  await AsyncStorage.setItem(`playdate_chat_${chatId}`, JSON.stringify(chat)).catch(() => {});
  return chat;
};

export const addMessageToChat = async (chatId: string, text: string): Promise<void> => {
  try {
    await retryRequest(() => axios.post(`${apiBaseUrl}/playdate/chat/${chatId}/message`, { text }));
    await AsyncStorage.removeItem(`playdate_chat_${chatId}`).catch(() => {});
  } catch (err) {
    // Phase 5: Queue for offline sync
    await enqueueMutation(`${apiBaseUrl}/playdate/chat/${chatId}/message`, 'POST', { text });
  }
};

// Legacy exports for compatibility (kept for backward compatibility with old hooks)
export interface Chat {
  id: string;
  participants: string[];
  matchId: string;
  lastMessage?: string;
  lastMessageTime?: string;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  chatId: string;
  senderId: string;
  text: string;
  timestamp: string;
  read: boolean;
}

// ponytail: deprecated legacy functions, use new API above
export const getOrCreateChat = async (): Promise<Chat> => {
  throw new Error('Deprecated: use createPlaydateChat instead');
};

export const sendMessage = async (): Promise<ChatMessage> => {
  throw new Error('Deprecated: use addMessageToChat instead');
};

export const getMessages = async (): Promise<ChatMessage[]> => {
  throw new Error('Deprecated: use getPlaydateChat instead');
};

export const markMessagesAsRead = async (): Promise<void> => {
  throw new Error('Deprecated: no longer supported');
};
