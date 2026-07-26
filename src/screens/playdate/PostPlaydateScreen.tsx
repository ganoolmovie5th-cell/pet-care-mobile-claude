import React, { useContext, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { AuthContext } from '../../context/AuthContext';
import { createPlaydatePost } from '../../services/playdate';
import { PlaydatePost } from '../../types/playdate';

interface PostPlaydateScreenProps {
  onSave: () => void;
}

export const PostPlaydateScreen: React.FC<PostPlaydateScreenProps> = ({ onSave }) => {
  const { user } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);

  const [petId, setPetId] = useState('');
  const [address, setAddress] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');

  const handleSubmit = async () => {
    if (!petId || !date || !description) {
      Alert.alert('Error', 'Please fill all required fields');
      return;
    }

    if (!user?.uid) {
      Alert.alert('Error', 'User not authenticated');
      return;
    }

    try {
      setLoading(true);
      const post: Omit<PlaydatePost, 'id' | 'created_at'> = {
        ownerId: user.uid,
        petId,
        location: {
          lat: 0,
          lng: 0,
          address,
        },
        date,
        description,
        interested_owners: [],
        status: 'active',
      };

      await createPlaydatePost(post);
      Alert.alert('Success', 'Playdate posted!');
      onSave();
    } catch (err) {
      Alert.alert(
        'Error',
        err instanceof Error ? err.message : 'Failed to post playdate',
      );
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#ff9800" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Create Playdate</Text>

      <View style={styles.section}>
        <Text style={styles.label}>Pet ID *</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter pet ID"
          value={petId}
          onChangeText={setPetId}
          placeholderTextColor="#aaa"
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Location</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., Central Park, Jakarta"
          value={address}
          onChangeText={setAddress}
          placeholderTextColor="#aaa"
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Date *</Text>
        <TextInput
          style={styles.input}
          placeholder="YYYY-MM-DD"
          value={date}
          onChangeText={setDate}
          placeholderTextColor="#aaa"
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Description</Text>
        <TextInput
          style={[styles.input, styles.textarea]}
          placeholder="Tell other owners about your pet..."
          value={description}
          onChangeText={setDescription}
          placeholderTextColor="#aaa"
          multiline
          numberOfLines={4}
        />
      </View>

      <TouchableOpacity
        style={styles.submitButton}
        onPress={handleSubmit}
        disabled={loading}
      >
        <Text style={styles.submitButtonText}>Post Playdate</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fafafa',
    padding: 16,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  section: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  textarea: {
    textAlignVertical: 'top',
    paddingVertical: 12,
  },
  cityButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  cityBtn: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  cityBtnActive: {
    backgroundColor: '#ff9800',
    borderColor: '#ff9800',
  },
  cityBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
  },
  cityBtnTextActive: {
    color: '#fff',
  },
  submitButton: {
    backgroundColor: '#ff9800',
    paddingVertical: 14,
    borderRadius: 6,
    alignItems: 'center',
    marginBottom: 20,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
