import { useState, useCallback } from 'react';
import { createInvoice, getInvoiceStatus, checkPaymentStatus } from '../services/payment';
import { Invoice } from '../services/payment';

export function usePayment() {
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createNewInvoice = useCallback(async (bookingId: string, amount: number, description: string) => {
    setLoading(true);
    setError(null);
    try {
      const inv = await createInvoice(bookingId, amount, description);
      setInvoice(inv);
      return inv;
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'Failed to create invoice';
      setError(errMsg);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const checkStatus = useCallback(async (invoiceId: string) => {
    try {
      const inv = await getInvoiceStatus(invoiceId);
      setInvoice(inv);
      return inv;
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'Failed to check status';
      setError(errMsg);
      return null;
    }
  }, []);

  const checkBookingPaymentStatus = useCallback(async (bookingId: string) => {
    try {
      const status = await checkPaymentStatus(bookingId);
      return status;
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'Failed to check payment';
      setError(errMsg);
      return null;
    }
  }, []);

  return {
    invoice,
    loading,
    error,
    createNewInvoice,
    checkStatus,
    checkBookingPaymentStatus,
  };
}
