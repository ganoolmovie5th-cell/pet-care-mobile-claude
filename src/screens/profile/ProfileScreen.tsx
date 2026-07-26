import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useAuth } from '../../hooks/useAuth';
import { logout } from '../../services/auth';

export const ProfileScreen = () => {
  const { user } = useAuth();
  const [signingOut, setSigningOut] = useState(false);

  const handleLogout = () => {
    Alert.alert('Keluar', 'Yakin mau keluar dari akun ini?', [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Keluar',
        style: 'destructive',
        onPress: async () => {
          setSigningOut(true);
          try {
            // AuthContext listens to onAuthStateChange, so RootNavigator swaps
            // itself back to AuthStack once this resolves.
            await logout();
          } catch (err) {
            setSigningOut(false);
            Alert.alert('Gagal keluar', err instanceof Error ? err.message : 'Coba lagi.');
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.name}>{user?.displayName || 'Pemilik Hewan'}</Text>
        <Text style={styles.detail}>{user?.phoneNumber || user?.email || '-'}</Text>
      </View>

      <TouchableOpacity style={styles.logout} onPress={handleLogout} disabled={signingOut}>
        {signingOut ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.logoutText}>Keluar</Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 20,
    marginBottom: 24,
  },
  name: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111',
    marginBottom: 4,
  },
  detail: {
    fontSize: 14,
    color: '#666',
  },
  logout: {
    backgroundColor: '#c0392b',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
  },
  logoutText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
