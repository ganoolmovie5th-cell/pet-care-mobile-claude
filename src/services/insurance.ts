import axios from 'axios';

const apiBaseUrl = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';

export interface InsuranceClick {
  id: string;
  userId: string;
  providerName: string;
  timestamp: string;
}

export const trackInsuranceClick = async (
  userId: string,
  providerName: string
): Promise<void> => {
  try {
    await axios.post(`${apiBaseUrl}/analytics/insurance-click`, {
      userId,
      providerName,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error('Failed to track insurance click:', err);
  }
};
