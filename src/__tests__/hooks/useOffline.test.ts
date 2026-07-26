import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useOffline } from '../../hooks/useOffline';
import * as offlineService from '../../services/offline';

jest.mock('../../services/offline');

describe('useOffline', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (offlineService.getQueueSize as jest.Mock).mockResolvedValue(0);
  });

  it('reads the queue size on mount', async () => {
    (offlineService.getQueueSize as jest.Mock).mockResolvedValue(3);

    const { result } = renderHook(() => useOffline());

    await waitFor(() => expect(result.current.queueSize).toBe(3));
    expect(result.current.syncing).toBe(false);
  });

  it('polls the queue size every 5s', async () => {
    jest.useFakeTimers();
    (offlineService.getQueueSize as jest.Mock).mockResolvedValue(1);

    renderHook(() => useOffline());

    expect(offlineService.getQueueSize).toHaveBeenCalledTimes(1);

    await act(async () => {
      jest.advanceTimersByTime(5000);
    });

    expect(offlineService.getQueueSize).toHaveBeenCalledTimes(2);
    jest.useRealTimers();
  });

  it('stops polling after unmount', async () => {
    jest.useFakeTimers();
    (offlineService.getQueueSize as jest.Mock).mockResolvedValue(1);

    const { unmount } = renderHook(() => useOffline());
    unmount();

    await act(async () => {
      jest.advanceTimersByTime(15000);
    });

    expect(offlineService.getQueueSize).toHaveBeenCalledTimes(1);
    jest.useRealTimers();
  });

  it('enqueueMutation delegates straight to the service', async () => {
    (offlineService.enqueueMutation as jest.Mock).mockResolvedValue('queued_1');

    const { result } = renderHook(() => useOffline());

    let id;
    await act(async () => {
      id = await result.current.enqueueMutation('/bookings', 'POST', { vetId: 'vet_1' });
    });

    expect(offlineService.enqueueMutation).toHaveBeenCalledWith('/bookings', 'POST', {
      vetId: 'vet_1',
    });
    expect(id).toBe('queued_1');
  });

  it('syncQueue returns the result and refreshes the size', async () => {
    (offlineService.getQueueSize as jest.Mock)
      .mockResolvedValueOnce(2)
      .mockResolvedValue(0);
    (offlineService.processSyncQueue as jest.Mock).mockResolvedValue({
      synced: 2,
      failed: 0,
    });

    const { result } = renderHook(() => useOffline());
    await waitFor(() => expect(result.current.queueSize).toBe(2));

    let out;
    await act(async () => {
      out = await result.current.syncQueue();
    });

    expect(out).toEqual({ synced: 2, failed: 0 });
    expect(result.current.queueSize).toBe(0);
    expect(result.current.syncing).toBe(false);
  });

  it('syncQueue rethrows but still clears the syncing flag', async () => {
    (offlineService.processSyncQueue as jest.Mock).mockRejectedValue(
      new Error('Backend mati'),
    );

    const { result } = renderHook(() => useOffline());

    await act(async () => {
      await expect(result.current.syncQueue()).rejects.toThrow('Backend mati');
    });

    expect(result.current.syncing).toBe(false);
  });
});
