import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Linking, Alert } from 'react-native';

interface InsuranceProvider {
  name: string;
  description: string;
  affiliateUrl: string;
}

const insuranceProviders: InsuranceProvider[] = [
  {
    name: 'Asuransi Pawsitive',
    description: 'Pet health insurance dari Rp50K/bulan',
    affiliateUrl: 'https://asuransipawsitive.com?ref=petcare',
  },
  {
    name: 'Semakin Pet Care',
    description: 'Kesehatan & kecelakaan untuk semua jenis hewan',
    affiliateUrl: 'https://semakinpetcare.com?ref=petcare',
  },
  {
    name: 'PetPal Insurance',
    description: 'Cashless treatment di 500+ klinik',
    affiliateUrl: 'https://petpalinsurance.com?ref=petcare',
  },
];

export const InsuranceCard: React.FC = () => {
  const handleOpenLink = async (url: string, providerName: string) => {
    try {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
        console.log(`Insurance click: ${providerName}`);
      }
    } catch (err) {
      Alert.alert('Error', 'Cannot open link');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Pet Insurance Options</Text>
      {insuranceProviders.map((provider, idx) => (
        <TouchableOpacity
          key={idx}
          style={styles.card}
          onPress={() => handleOpenLink(provider.affiliateUrl, provider.name)}
        >
          <Text style={styles.providerName}>{provider.name}</Text>
          <Text style={styles.description}>{provider.description}</Text>
          <Text style={styles.link}>Learn More →</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 20,
    paddingHorizontal: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  card: {
    backgroundColor: '#fff3e0',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#ff9800',
  },
  providerName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  description: {
    fontSize: 12,
    color: '#666',
    marginVertical: 4,
  },
  link: {
    fontSize: 12,
    color: '#ff9800',
    fontWeight: '600',
  },
});
