import { useState, useCallback, useEffect } from 'react';
import { ChatMessage, Chat, getOrCreateChat, sendMessage, getMessages, markMessagesAsRead } from '../services/playdate';

export function useChatMessage(matchId: string, otherUserId: string, userId: string) {
  const [chat, setChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadOrCreateChat = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const chatData = await getOrCreateChat(matchId, otherUserId);
      setChat(chatData);
      const msgs = await getMessages(chatData.id);
      setMessages(msgs.reverse());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load chat');
    } finally {
      setLoading(false);
    }
  }, [matchId, otherUserId]);

  useEffect(() => {
    loadOrCreateChat();
  }, [loadOrCreateChat]);

  const sendNewMessage = useCallback(
    async (text: string) => {
      if (!chat) return;
      try {
        const newMessage = await sendMessage(chat.id, text);
        setMessages(prev => [...prev, newMessage]);
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to send message');
        return false;
      }
    },
    [chat]
  );

  const markAsRead = useCallback(async () => {
    if (!chat) return;
    try {
      await markMessagesAsRead(chat.id);
      setMessages(prev =>
        prev.map(msg =>
          msg.senderId !== userId ? { ...msg, read: true } : msg
        )
      );
    } catch (err) {
      console.error('Failed to mark messages as read:', err);
    }
  }, [chat, userId]);

  return {
    chat,
    messages,
    loading,
    error,
    sendMessage: sendNewMessage,
    markAsRead,
    reload: loadOrCreateChat,
  };
}
