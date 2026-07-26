import { renderHook, act } from '@testing-library/react-native';
import { usePayment } from '../../hooks/usePayment';
import * as paymentService from '../../services/payment';

jest.mock('../../services/payment');

const mockInvoice = {
  id: 'inv_1',
  user_id: 'user_1',
  reference_id: 'booking_1',
  amount: 150000,
  currency: 'IDR',
  status: 'PENDING',
  invoice_url: 'https://checkout.example/inv_1',
  created_at: '2026-07-26T00:00:00Z',
} as any;

describe('usePayment', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('starts with no invoice', () => {
    const { result } = renderHook(() => usePayment());

    expect(result.current.invoice).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('createNewInvoice stores and returns the invoice', async () => {
    (paymentService.createInvoice as jest.Mock).mockResolvedValue(mockInvoice);

    const { result } = renderHook(() => usePayment());

    let inv;
    await act(async () => {
      inv = await result.current.createNewInvoice('booking_1', 150000, 'Konsultasi Bimo');
    });

    expect(paymentService.createInvoice).toHaveBeenCalledWith(
      'booking_1',
      150000,
      'Konsultasi Bimo'
    );
    expect(inv).toEqual(mockInvoice);
    expect(result.current.invoice?.invoice_url).toBe('https://checkout.example/inv_1');
    expect(result.current.loading).toBe(false);
  });

  it('createNewInvoice returns null and records the error on failure', async () => {
    (paymentService.createInvoice as jest.Mock).mockRejectedValue(
      new Error('Xendit menolak')
    );

    const { result } = renderHook(() => usePayment());

    let inv;
    await act(async () => {
      inv = await result.current.createNewInvoice('booking_1', 150000, 'Konsultasi');
    });

    expect(inv).toBeNull();
    expect(result.current.invoice).toBeNull();
    expect(result.current.error).toBe('Xendit menolak');
    expect(result.current.loading).toBe(false);
  });

  it('checkStatus replaces the stored invoice with the fresh one', async () => {
    (paymentService.getInvoiceStatus as jest.Mock).mockResolvedValue({
      ...mockInvoice,
      status: 'PAID',
      paid_at: '2026-07-26T01:00:00Z',
    });

    const { result } = renderHook(() => usePayment());

    await act(async () => {
      await result.current.checkStatus('inv_1');
    });

    expect(paymentService.getInvoiceStatus).toHaveBeenCalledWith('inv_1');
    expect(result.current.invoice?.status).toBe('PAID');
  });

  it('checkStatus returns null and records the error on failure', async () => {
    (paymentService.getInvoiceStatus as jest.Mock).mockRejectedValue(
      new Error('Invoice hilang')
    );

    const { result } = renderHook(() => usePayment());

    let inv;
    await act(async () => {
      inv = await result.current.checkStatus('inv_missing');
    });

    expect(inv).toBeNull();
    expect(result.current.error).toBe('Invoice hilang');
  });

  it('checkBookingPaymentStatus returns the raw status without storing an invoice', async () => {
    (paymentService.checkPaymentStatus as jest.Mock).mockResolvedValue({
      status: 'PAID',
      paidAt: '2026-07-26T01:00:00Z',
    });

    const { result } = renderHook(() => usePayment());

    let status;
    await act(async () => {
      status = await result.current.checkBookingPaymentStatus('booking_1');
    });

    expect(paymentService.checkPaymentStatus).toHaveBeenCalledWith('booking_1');
    expect(status).toEqual({ status: 'PAID', paidAt: '2026-07-26T01:00:00Z' });
    expect(result.current.invoice).toBeNull();
  });

  it('checkBookingPaymentStatus returns null and records the error on failure', async () => {
    (paymentService.checkPaymentStatus as jest.Mock).mockRejectedValue(
      new Error('Booking tidak ada')
    );

    const { result } = renderHook(() => usePayment());

    let status;
    await act(async () => {
      status = await result.current.checkBookingPaymentStatus('booking_missing');
    });

    expect(status).toBeNull();
    expect(result.current.error).toBe('Booking tidak ada');
  });
});
