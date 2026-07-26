import { renderHook, act, waitFor } from '@testing-library/react-native';
import {
  usePlaydatePosts,
  usePlaydatePost,
  usePlaydateChat,
} from '../../hooks/usePlaydate';
import * as playdateService from '../../services/playdate';

jest.mock('../../services/playdate');

const mockPosts = [
  {
    id: 'post_1',
    ownerId: 'user_1',
    petId: 'pet_1',
    location: 'Jakarta Selatan',
    date: '2026-08-10',
    description: 'Cari teman main sore',
  },
  {
    id: 'post_2',
    ownerId: 'user_2',
    petId: 'pet_2',
    location: 'Bandung',
    date: '2026-08-12',
    description: 'Playdate di taman',
  },
] as any;

const mockChat = {
  id: 'chat_1',
  postId: 'post_1',
  messages: [{ id: 'msg_1', senderId: 'user_1', text: 'Halo' }],
} as any;

describe('usePlaydatePosts', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('auto-fetches active posts on mount', async () => {
    (playdateService.getAllActivePosts as jest.Mock).mockResolvedValue(mockPosts);

    const { result } = renderHook(() => usePlaydatePosts());

    await waitFor(() => expect(result.current.posts).toHaveLength(2));

    expect(result.current.error).toBeNull();
    expect(result.current.loading).toBe(false);
  });

  it('records the error and keeps posts empty', async () => {
    (playdateService.getAllActivePosts as jest.Mock).mockRejectedValue(
      new Error('Backend mati'),
    );

    const { result } = renderHook(() => usePlaydatePosts());

    await waitFor(() => expect(result.current.error).toBe('Backend mati'));

    expect(result.current.posts).toEqual([]);
  });
});

describe('usePlaydatePost', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('fetches one post by id', async () => {
    (playdateService.getPlaydatePost as jest.Mock).mockResolvedValue(mockPosts[0]);

    const { result } = renderHook(() => usePlaydatePost('post_1'));

    await waitFor(() => expect(result.current.post).not.toBeNull());

    expect(playdateService.getPlaydatePost).toHaveBeenCalledWith('post_1');
    expect(result.current.post?.location).toBe('Jakarta Selatan');
  });

  it('skips the request entirely when postId is empty', async () => {
    const { result } = renderHook(() => usePlaydatePost(''));

    await act(async () => {
      await result.current.refetch();
    });

    expect(playdateService.getPlaydatePost).not.toHaveBeenCalled();
    expect(result.current.post).toBeNull();
    expect(result.current.loading).toBe(false);
  });
});

describe('usePlaydateChat', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('auto-fetches the chat on mount', async () => {
    (playdateService.getPlaydateChat as jest.Mock).mockResolvedValue(mockChat);

    const { result } = renderHook(() => usePlaydateChat('chat_1'));

    await waitFor(() => expect(result.current.chat).not.toBeNull());

    expect(playdateService.getPlaydateChat).toHaveBeenCalledWith('chat_1');
    expect(result.current.chat?.messages).toHaveLength(1);
  });

  it('addMessage sends then refetches, returning true', async () => {
    (playdateService.getPlaydateChat as jest.Mock).mockResolvedValue(mockChat);
    (playdateService.addMessageToChat as jest.Mock).mockResolvedValue(undefined);

    const { result } = renderHook(() => usePlaydateChat('chat_1'));
    await waitFor(() => expect(result.current.chat).not.toBeNull());

    let sent;
    await act(async () => {
      sent = await result.current.addMessage('Boleh, jam 4 ya');
    });

    expect(playdateService.addMessageToChat).toHaveBeenCalledWith(
      'chat_1',
      'Boleh, jam 4 ya',
    );
    // once on mount, once after the send
    expect(playdateService.getPlaydateChat).toHaveBeenCalledTimes(2);
    expect(sent).toBe(true);
  });

  it('addMessage returns false and records the error when the send fails', async () => {
    (playdateService.getPlaydateChat as jest.Mock).mockResolvedValue(mockChat);
    (playdateService.addMessageToChat as jest.Mock).mockRejectedValue(
      new Error('Chat ditutup'),
    );

    const { result } = renderHook(() => usePlaydateChat('chat_1'));
    await waitFor(() => expect(result.current.chat).not.toBeNull());

    let sent;
    await act(async () => {
      sent = await result.current.addMessage('Halo?');
    });

    expect(sent).toBe(false);
    expect(result.current.error).toBe('Chat ditutup');
  });

  it('addMessage returns false without a request when chatId is empty', async () => {
    const { result } = renderHook(() => usePlaydateChat(''));

    let sent;
    await act(async () => {
      sent = await result.current.addMessage('Halo?');
    });

    expect(sent).toBe(false);
    expect(playdateService.addMessageToChat).not.toHaveBeenCalled();
    expect(playdateService.getPlaydateChat).not.toHaveBeenCalled();
  });
});
