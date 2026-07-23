import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface PlaydateChatScreenProps {
  matchId: string;
  ownerId: string;
}

export const PlaydateChatScreen: React.FC<PlaydateChatScreenProps> = ({ matchId, ownerId }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.placeholder}>Chat with {ownerId.substring(0, 8)}</Text>
      <Text style={styles.subtext}>(TBD Phase 5 - messaging coming soon)</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fafafa',
  },
  placeholder: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  subtext: {
    fontSize: 12,
    color: '#999',
    marginTop: 8,
  },
});
