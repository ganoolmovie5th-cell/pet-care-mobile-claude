import React from 'react';
import { Alert } from 'react-native';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { ProfileScreen } from '../../screens/profile/ProfileScreen';
import { AuthContext } from '../../context/AuthContext';
import * as authService from '../../services/auth';

// Factory, not automock: automocking still loads services/auth, which pulls in
// firebase ESM and blows up the suite.
jest.mock('../../services/auth', () => ({
  logout: jest.fn(),
}));

const renderScreen = (user: any) =>
  render(
    <AuthContext.Provider value={{ user, loading: false, error: null }}>
      <ProfileScreen />
    </AuthContext.Provider>,
  );

/** Grab the destructive button from the confirm dialog and press it. */
const confirmLogout = async () => {
  const calls = (Alert.alert as jest.Mock).mock.calls;
  const buttons = calls[calls.length - 1][2];
  const keluar = buttons.find((b: any) => b.text === 'Keluar');
  await keluar.onPress();
};

describe('ProfileScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
    (authService.logout as jest.Mock).mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('shows the display name and phone number', () => {
    const { getByText } = renderScreen({
      displayName: 'Ilham',
      phoneNumber: '+628123456789',
    });

    expect(getByText('Ilham')).toBeTruthy();
    expect(getByText('+628123456789')).toBeTruthy();
  });

  it('falls back to placeholders when the profile is empty', () => {
    const { getByText } = renderScreen({});

    expect(getByText('Pemilik Hewan')).toBeTruthy();
    expect(getByText('-')).toBeTruthy();
  });

  it('only logs out after the confirm dialog', async () => {
    const { getByText } = renderScreen({ displayName: 'Ilham' });

    fireEvent.press(getByText('Keluar'));

    expect(Alert.alert).toHaveBeenCalledWith(
      'Keluar',
      'Yakin mau keluar dari akun ini?',
      expect.any(Array),
    );
    expect(authService.logout).not.toHaveBeenCalled();

    await confirmLogout();

    expect(authService.logout).toHaveBeenCalledTimes(1);
  });

  it('surfaces a logout failure and re-enables the button', async () => {
    (authService.logout as jest.Mock).mockRejectedValue(new Error('Jaringan putus'));

    const { getByText } = renderScreen({ displayName: 'Ilham' });

    fireEvent.press(getByText('Keluar'));
    await confirmLogout();

    await waitFor(() =>
      expect(Alert.alert).toHaveBeenCalledWith('Gagal keluar', 'Jaringan putus'),
    );
    expect(getByText('Keluar')).toBeTruthy();
  });
});
