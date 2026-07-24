import { useState, useCallback, useEffect } from 'react';
import {
  getAllActivePosts,
  getPlaydatePost,
  getPlaydateChat,
  addMessageToChat,
} from '../services/playdate';
import { PlaydatePost, PlaydateChat } from '../types/playdate';

// Task 23: usePlaydatePosts hook
export const usePlaydatePosts = () => {
  const [posts, setPosts] = useState<PlaydatePost[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getAllActivePosts();
      setPosts(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch posts');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { posts, loading, error, refetch };
};

// Task 23: usePlaydatePost hook
export const usePlaydatePost = (postId: string) => {
  const [post, setPost] = useState<PlaydatePost | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!postId) return;
    try {
      setLoading(true);
      setError(null);
      const data = await getPlaydatePost(postId);
      setPost(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch post');
    } finally {
      setLoading(false);
    }
  }, [postId]);

  useEffect(() => {
    refetch();
  }, [postId, refetch]);

  return { post, loading, error, refetch };
};

// Task 23: usePlaydateChat hook
export const usePlaydateChat = (chatId: string) => {
  const [chat, setChat] = useState<PlaydateChat | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!chatId) return;
    try {
      setLoading(true);
      setError(null);
      const data = await getPlaydateChat(chatId);
      setChat(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch chat');
    } finally {
      setLoading(false);
    }
  }, [chatId]);

  const addMessage = useCallback(
    async (text: string) => {
      if (!chatId) return false;
      try {
        await addMessageToChat(chatId, text);
        // Refetch to get updated messages
        await refetch();
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to send message');
        return false;
      }
    },
    [chatId, refetch]
  );

  useEffect(() => {
    refetch();
  }, [chatId, refetch]);

  return { chat, loading, error, refetch, addMessage };
};
