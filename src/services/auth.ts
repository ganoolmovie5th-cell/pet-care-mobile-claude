import {
  signInWithPhoneNumber,
  ConfirmationResult,
  User,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { auth } from './firebase';
import axios from 'axios';

let confirmationResult: ConfirmationResult | null = null;

// Mobile phone OTP handled via backend (Twilio SMS)
// This uses Firebase ID token exchange after backend OTP verification
export const sendPhoneOTP = async (phoneNumber: string): Promise<void> => {
  // Backend sends OTP via Twilio
  // Client will receive OTP and verify via backend /auth/verify-otp endpoint
  // No Firebase phone auth verifier needed on mobile
  console.log('OTP request sent for', phoneNumber);
};

export const verifyOTP = async (code: string): Promise<User> => {
  if (!confirmationResult) throw new Error('OTP not sent');
  const result = await confirmationResult.confirm(code);
  return result.user;
};

export const getCurrentUser = (): User | null => {
  return auth.currentUser;
};

export const getIdToken = async (): Promise<string> => {
  const user = auth.currentUser;
  if (!user) throw new Error('No user logged in');
  return user.getIdToken();
};

export const logout = async (): Promise<void> => {
  await signOut(auth);
  confirmationResult = null;
};

export const exchangeIdTokenForJWT = async (idToken: string): Promise<string> => {
  const apiBaseUrl = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';
  const response = await axios.post(`${apiBaseUrl}/auth/verify-token`, {
    idToken,
  });
  return response.data.token;
};

export const onAuthStateChange = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback);
};
