import axios from 'axios';

export interface PlaydatePost {
  id: string;
  ownerId: string;
  petId: string;
  location: {
    lat: number;
    lng: number;
    city: string;
    address: string;
  };
  date: string;
  time: string;
  description: string;
  photos: string[];
  interested_owners: string[];
  status: 'open' | 'matched' | 'closed';
  created_at: string;
}

export interface PlaydateMatch {
  id: string;
  postId: string;
  ownerId: string;
  petId: string;
  interested_date: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
}

const apiBaseUrl = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';

export const createPost = async (
  post: Omit<PlaydatePost, 'id' | 'created_at' | 'interested_owners'>
): Promise<string> => {
  const response = await axios.post(`${apiBaseUrl}/playdate/posts`, post);
  return response.data.id;
};

export const searchPostsNearby = async (filters: {
  city: string;
  lat?: number;
  lng?: number;
  maxDistance?: number;
}): Promise<PlaydatePost[]> => {
  const params = new URLSearchParams();
  params.append('city', filters.city);
  if (filters.lat !== undefined) params.append('lat', filters.lat.toString());
  if (filters.lng !== undefined) params.append('lng', filters.lng.toString());
  if (filters.maxDistance !== undefined) params.append('maxDistance', filters.maxDistance.toString());

  const response = await axios.get(`${apiBaseUrl}/playdate/posts?${params}`);
  return response.data;
};

export const getPostById = async (postId: string): Promise<PlaydatePost | null> => {
  try {
    const response = await axios.get(`${apiBaseUrl}/playdate/posts/${postId}`);
    return response.data;
  } catch (err) {
    return null;
  }
};

export const markInterest = async (postId: string, ownerId: string, petId: string): Promise<string> => {
  const response = await axios.post(`${apiBaseUrl}/playdate/posts/${postId}/interest`, {
    ownerId,
    petId,
  });
  return response.data.matchId;
};

export const removeInterest = async (postId: string, ownerId: string): Promise<void> => {
  await axios.delete(`${apiBaseUrl}/playdate/posts/${postId}/interest`, {
    data: { ownerId },
  });
};

export const getInterestedMatches = async (postId: string): Promise<PlaydateMatch[]> => {
  const response = await axios.get(`${apiBaseUrl}/playdate/posts/${postId}/matches`);
  return response.data;
};

export const acceptMatch = async (matchId: string): Promise<void> => {
  await axios.post(`${apiBaseUrl}/playdate/matches/${matchId}/accept`);
};

export const rejectMatch = async (matchId: string): Promise<void> => {
  await axios.post(`${apiBaseUrl}/playdate/matches/${matchId}/reject`);
};

export const getOrCreateChat = async (matchId: string, otherUserId: string): Promise<Chat> => {
  const response = await axios.post(`${apiBaseUrl}/chat`, {
    matchId,
    otherUserId,
  });
  return response.data;
};

export const sendMessage = async (chatId: string, text: string): Promise<ChatMessage> => {
  const response = await axios.post(`${apiBaseUrl}/chat/${chatId}/message`, { text });
  return response.data;
};

export const getMessages = async (chatId: string, limit: number = 50): Promise<ChatMessage[]> => {
  const response = await axios.get(`${apiBaseUrl}/chat/${chatId}/messages`, {
    params: { limit },
  });
  return response.data;
};

export const markMessagesAsRead = async (chatId: string): Promise<void> => {
  await axios.post(`${apiBaseUrl}/chat/${chatId}/read`);
};
