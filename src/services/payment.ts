import axios from 'axios';

const apiBaseUrl = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';

export interface Invoice {
  id: string;
  user_id: string;
  reference_id: string;
  amount: number;
  currency: string;
  status: 'PENDING' | 'PAID' | 'EXPIRED' | 'FAILED';
  invoice_url: string;
  paid_at?: string;
  created_at: string;
}

export const createInvoice = async (
  bookingId: string,
  amount: number,
  description: string
): Promise<Invoice> => {
  const response = await axios.post(`${apiBaseUrl}/payments/create-invoice`, {
    bookingId,
    amount,
    description,
  });
  return response.data;
};

export const getInvoiceStatus = async (invoiceId: string): Promise<Invoice> => {
  const response = await axios.get(`${apiBaseUrl}/payments/invoice/${invoiceId}`);
  return response.data;
};

export const checkPaymentStatus = async (bookingId: string): Promise<{ status: string; paidAt?: string }> => {
  const response = await axios.get(`${apiBaseUrl}/payments/booking/${bookingId}/status`);
  return response.data;
};
