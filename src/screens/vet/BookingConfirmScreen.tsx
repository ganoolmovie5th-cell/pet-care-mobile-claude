import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Linking,
  Alert,
  ScrollView,
} from 'react-native';
import { usePayment } from '../../hooks/usePayment';

interface BookingConfirmScreenProps {
  bookingId: string;
  amount: number;
  petName: string;
  vetClinicName: string;
  onPaymentComplete: () => void;
}

export const BookingConfirmScreen: React.FC<BookingConfirmScreenProps> = ({
  bookingId,
  amount,
  petName,
  vetClinicName,
  onPaymentComplete,
}) => {
  const { invoice, loading, error, createNewInvoice, checkStatus } = usePayment();
  const [pollInterval, setPollInterval] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    initializePayment();
  }, []);

  const initializePayment = async () => {
    const inv = await createNewInvoice(
      bookingId,
      amount,
      `Booking at ${vetClinicName} for ${petName}`
    );

    if (inv) {
      startPolling(inv.id);
    }
  };

  const startPolling = (invoiceId: string) => {
    const interval = setInterval(async () => {
      const status = await checkStatus(invoiceId);
      if (status?.status === 'PAID') {
        clearInterval(interval);
        Alert.alert('Success', 'Payment confirmed!');
        onPaymentComplete();
      }
    }, 3000);

    setPollInterval(interval);
  };

  const handleOpenPayment = async () => {
    if (!invoice?.invoice_url) {
      Alert.alert('Error', 'Invoice URL not available');
      return;
    }

    try {
      const canOpen = await Linking.canOpenURL(invoice.invoice_url);
      if (canOpen) {
        await Linking.openURL(invoice.invoice_url);
      } else {
        Alert.alert('Error', 'Cannot open payment URL');
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to open payment');
    }
  };

  useEffect(() => {
    return () => {
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [pollInterval]);

  if (loading && !invoice) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#0f5c4a" />
        <Text style={styles.loadingText}>Creating payment...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={initializePayment}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.title}>Confirm Your Booking</Text>

        <View style={styles.detailsCard}>
          <View style={styles.detailRow}>
            <Text style={styles.label}>Pet:</Text>
            <Text style={styles.value}>{petName}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.label}>Clinic:</Text>
            <Text style={styles.value}>{vetClinicName}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.label}>Total:</Text>
            <Text style={[styles.value, styles.amountValue]}>
              Rp{amount.toLocaleString('id-ID')}
            </Text>
          </View>
        </View>
      </View>

      {invoice?.status === 'PENDING' && (
        <View style={styles.section}>
          <Text style={styles.subtitle}>Payment Methods</Text>
          <Text style={styles.description}>
            Supported: e-wallet (OVO, DANA, LinkAja), bank transfer, credit card
          </Text>

          <TouchableOpacity style={styles.payButton} onPress={handleOpenPayment}>
            <Text style={styles.payButtonText}>Open Payment</Text>
          </TouchableOpacity>

          <Text style={styles.statusText}>
            Status: {invoice.status}
          </Text>
        </View>
      )}

      {invoice?.status === 'PAID' && (
        <View style={styles.section}>
          <View style={styles.successCard}>
            <Text style={styles.successText}>✓ Payment Confirmed</Text>
            <Text style={styles.successSubtext}>Your booking is confirmed!</Text>
          </View>

          <TouchableOpacity style={styles.doneButton} onPress={onPaymentComplete}>
            <Text style={styles.doneButtonText}>Done</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  section: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  detailsCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  value: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
  },
  amountValue: {
    color: '#0f5c4a',
    fontSize: 16,
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  payButton: {
    backgroundColor: '#0f5c4a',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  payButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  statusText: {
    textAlign: 'center',
    fontSize: 12,
    color: '#999',
  },
  successCard: {
    backgroundColor: '#e8f5e9',
    borderLeftWidth: 4,
    borderLeftColor: '#4caf50',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
  },
  successText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2e7d32',
  },
  successSubtext: {
    fontSize: 14,
    color: '#558b2f',
    marginTop: 4,
  },
  doneButton: {
    backgroundColor: '#4caf50',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  doneButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    fontSize: 16,
    color: '#f44336',
    marginBottom: 20,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#f44336',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
});
