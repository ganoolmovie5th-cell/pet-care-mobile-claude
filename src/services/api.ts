import axios from 'axios';
import { auth } from './firebase';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:5000';

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
});

// The backend verifies Firebase ID tokens, so the token has to come from the
// Firebase SDK, which also refreshes it for us.
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await auth.currentUser?.getIdToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error retrieving auth token:', error);
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// ponytail: no 401 handler here — the Firebase SDK owns session state, so
// there is no local token to clear.
