import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useLocation } from '../../hooks/useLocation';
import * as Location from 'expo-location';

jest.mock('expo-location', () => ({
  requestForegroundPermissionsAsync: jest.fn(),
  getCurrentPositionAsync: jest.fn(),
  Accuracy: { Balanced: 3 },
}));

const LAT = -6.2;
const LNG = 106.8;

const granted = { status: 'granted' };
const denied = { status: 'denied' };
const position = { coords: { latitude: LAT, longitude: LNG } };

describe('useLocation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('maps the device coords to lat/lng once permission is granted', async () => {
    (Location.requestForegroundPermissionsAsync as jest.Mock).mockResolvedValue(granted);
    (Location.getCurrentPositionAsync as jest.Mock).mockResolvedValue(position);

    const { result } = renderHook(() => useLocation());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.location).toEqual({ lat: LAT, lng: LNG });
    expect(result.current.error).toBeNull();
  });

  it('never asks for a position when permission is denied', async () => {
    (Location.requestForegroundPermissionsAsync as jest.Mock).mockResolvedValue(denied);

    const { result } = renderHook(() => useLocation());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(Location.getCurrentPositionAsync).not.toHaveBeenCalled();
    expect(result.current.location).toBeNull();
    expect(result.current.error).toBe('Location permission denied');
  });

  it('records the error when the GPS read throws', async () => {
    (Location.requestForegroundPermissionsAsync as jest.Mock).mockResolvedValue(granted);
    (Location.getCurrentPositionAsync as jest.Mock).mockRejectedValue(
      new Error('GPS mati')
    );

    const { result } = renderHook(() => useLocation());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.location).toBeNull();
    expect(result.current.error).toBe('GPS mati');
  });

  it('refresh clears the previous error and stores the new coords', async () => {
    (Location.requestForegroundPermissionsAsync as jest.Mock)
      .mockResolvedValueOnce(denied)
      .mockResolvedValueOnce(granted);
    (Location.getCurrentPositionAsync as jest.Mock).mockResolvedValue(position);

    const { result } = renderHook(() => useLocation());
    await waitFor(() => expect(result.current.error).toBe('Location permission denied'));

    await act(async () => {
      await result.current.refresh();
    });

    expect(result.current.error).toBeNull();
    expect(result.current.location).toEqual({ lat: LAT, lng: LNG });
  });

  it('requests the balanced accuracy profile', async () => {
    (Location.requestForegroundPermissionsAsync as jest.Mock).mockResolvedValue(granted);
    (Location.getCurrentPositionAsync as jest.Mock).mockResolvedValue(position);

    renderHook(() => useLocation());

    await waitFor(() =>
      expect(Location.getCurrentPositionAsync).toHaveBeenCalledWith({
        accuracy: Location.Accuracy.Balanced,
      })
    );
  });
});
