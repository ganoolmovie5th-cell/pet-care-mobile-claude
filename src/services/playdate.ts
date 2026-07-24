import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PlaydatePost, PlaydateChat, Message } from '../types/playdate';

const apiBaseUrl = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';

// Task 22: API wrappers with AsyncStorage caching

export const createPlaydatePost = async (
  post: Omit<PlaydatePost, 'id' | 'created_at'>
): Promise<PlaydatePost> => {
  const response = await axios.post(`${apiBaseUrl}/playdate/posts`, post);
  const newPost = response.data as PlaydatePost;
  // Invalidate cache
  await AsyncStorage.removeItem('playdate_posts_all').catch(() => {});
  return newPost;
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
  await axios.patch(`${apiBaseUrl}/playdate/posts/${postId}`, updates);
  await AsyncStorage.removeItem(`playdate_post_${postId}`).catch(() => {});
  await AsyncStorage.removeItem('playdate_posts_all').catch(() => {});
};

export const getPlaydatePostsByOwner = async (ownerId: string): Promise<PlaydatePost[]> => {
  const response = await axios.get(`${apiBaseUrl}/playdate/posts?owner=${ownerId}`);
  return response.data as PlaydatePost[];
};

export const addInterestedOwner = async (postId: string): Promise<void> => {
  await axios.post(`${apiBaseUrl}/playdate/posts/${postId}/interested`);
  await AsyncStorage.removeItem(`playdate_post_${postId}`).catch(() => {});
  await AsyncStorage.removeItem('playdate_posts_all').catch(() => {});
};

export const removeInterestedOwner = async (postId: string): Promise<void> => {
  await axios.delete(`${apiBaseUrl}/playdate/posts/${postId}/interested`);
  await AsyncStorage.removeItem(`playdate_post_${postId}`).catch(() => {});
  await AsyncStorage.removeItem('playdate_posts_all').catch(() => {});
};

export const createPlaydateChat = async (
  postId: string,
  interestedOwnerId: string,
  initialMessage: string
): Promise<PlaydateChat> => {
  const response = await axios.post(`${apiBaseUrl}/playdate/posts/${postId}/chat/start`, {
    interestedOwnerId,
    initialMessage,
  });
  return response.data as PlaydateChat;
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
  await axios.post(`${apiBaseUrl}/playdate/chat/${chatId}/message`, { text });
  await AsyncStorage.removeItem(`playdate_chat_${chatId}`).catch(() => {});
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
