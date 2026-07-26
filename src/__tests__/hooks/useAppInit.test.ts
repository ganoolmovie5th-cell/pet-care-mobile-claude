import { renderHook, act, waitFor } from '@testing-library/react-native';
import { AppState } from 'react-native';
import { useAppInit } from '../../hooks/useAppInit';
import * as offlineService from '../../services/offline';
import * as sentry from '../../services/sentry';

jest.mock('../../services/offline');
// Factory, not automock: automocking still loads services/sentry, which pulls in
// @sentry/react-native as untransformed ESM and blows up the suite.
jest.mock('../../services/sentry', () => ({
  initSentry: jest.fn(),
  addBreadcrumb: jest.fn(),
}));

/** Grab the listener useAppInit registered so the test can fake a state change. */
const emitAppState = async (state: string) => {
  const calls = (AppState.addEventListener as jest.Mock).mock.calls;
  const handler = calls[calls.length - 1][1];
  await act(async () => {
    await handler(state);
  });
};

describe('useAppInit', () => {
  let remove: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    remove = jest.fn();
    jest.spyOn(AppState, 'addEventListener').mockReturnValue({ remove } as any);
    (offlineService.getQueueSize as jest.Mock).mockResolvedValue(0);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('boots Sentry and reads the queue on mount', async () => {
    (offlineService.getQueueSize as jest.Mock).mockResolvedValue(2);

    const { result } = renderHook(() => useAppInit());

    await waitFor(() => expect(result.current.queueSize).toBe(2));

    expect(sentry.initSentry).toHaveBeenCalledTimes(1);
    expect(sentry.addBreadcrumb).toHaveBeenCalledWith('App initialized');
    expect(sentry.addBreadcrumb).toHaveBeenCalledWith('Offline queue has 2 mutations');
  });

  it('stays quiet about the queue when it is empty', async () => {
    const { result } = renderHook(() => useAppInit());

    await waitFor(() => expect(offlineService.getQueueSize).toHaveBeenCalled());

    expect(result.current.queueSize).toBe(0);
    expect(sentry.addBreadcrumb).not.toHaveBeenCalledWith(
      expect.stringContaining('Offline queue has')
    );
  });

  it('removes the AppState listener on unmount', () => {
    const { unmount } = renderHook(() => useAppInit());
    unmount();

    expect(remove).toHaveBeenCalledTimes(1);
  });

  it('syncs when the app returns to the foreground', async () => {
    (offlineService.getQueueSize as jest.Mock)
      .mockResolvedValueOnce(2)
      .mockResolvedValueOnce(2)
      .mockResolvedValue(0);
    (offlineService.processSyncQueue as jest.Mock).mockResolvedValue({
      synced: 2,
      failed: 0,
    });

    const { result } = renderHook(() => useAppInit());
    await waitFor(() => expect(result.current.queueSize).toBe(2));

    await emitAppState('active');

    expect(offlineService.processSyncQueue).toHaveBeenCalledTimes(1);
    expect(result.current.queueSize).toBe(0);
    expect(result.current.syncing).toBe(false);
  });

  it('ignores a move to the background', async () => {
    renderHook(() => useAppInit());
    await waitFor(() => expect(offlineService.getQueueSize).toHaveBeenCalled());

    await emitAppState('background');

    expect(offlineService.processSyncQueue).not.toHaveBeenCalled();
  });

  it('skips the sync entirely when the queue is empty', async () => {
    const { result } = renderHook(() => useAppInit());
    await waitFor(() => expect(offlineService.getQueueSize).toHaveBeenCalled());

    await act(async () => {
      await result.current.triggerSync();
    });

    expect(offlineService.processSyncQueue).not.toHaveBeenCalled();
    expect(result.current.syncing).toBe(false);
  });

  it('flags a partial sync as a warning breadcrumb', async () => {
    (offlineService.getQueueSize as jest.Mock).mockResolvedValue(3);
    (offlineService.processSyncQueue as jest.Mock).mockResolvedValue({
      synced: 2,
      failed: 1,
    });

    const { result } = renderHook(() => useAppInit());
    await waitFor(() => expect(result.current.queueSize).toBe(3));

    await act(async () => {
      await result.current.triggerSync();
    });

    expect(sentry.addBreadcrumb).toHaveBeenCalledWith(
      'Sync complete: 2 synced, 1 failed',
      'warning'
    );
  });

  it('swallows a sync failure into an error breadcrumb', async () => {
    (offlineService.getQueueSize as jest.Mock).mockResolvedValue(1);
    (offlineService.processSyncQueue as jest.Mock).mockRejectedValue(
      new Error('Backend mati')
    );

    const { result } = renderHook(() => useAppInit());
    await waitFor(() => expect(result.current.queueSize).toBe(1));

    await act(async () => {
      await result.current.triggerSync();
    });

    expect(sentry.addBreadcrumb).toHaveBeenCalledWith(
      'Sync failed: Backend mati',
      'error'
    );
    expect(result.current.syncing).toBe(false);
  });
});
