import { api } from './api';

export interface InsuranceClick {
  id: string;
  userId: string;
  providerName: string;
  timestamp: string;
}

export const trackInsuranceClick = async (providerName: string): Promise<void> => {
  try {
    await api.post('/analytics/insurance-click', { providerName });
  } catch (err) {
    console.error('Failed to track insurance click:', err);
  }
};
