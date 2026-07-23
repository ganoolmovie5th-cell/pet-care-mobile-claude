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
import { usePlaydate } from '../../hooks/usePlaydate';

interface PostPlaydateScreenProps {
  onSave: () => void;
}

export const PostPlaydateScreen: React.FC<PostPlaydateScreenProps> = ({ onSave }) => {
  const { user } = useContext(AuthContext);
  const { createNewPost, loading } = usePlaydate();

  const [petId, setPetId] = useState('');
  const [city, setCity] = useState('Jakarta');
  const [address, setAddress] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState('14:00');
  const [description, setDescription] = useState('');

  const handleSubmit = async () => {
    if (!petId || !city || !date || !time || !description) {
      Alert.alert('Error', 'Please fill all required fields');
      return;
    }

    if (!user?.uid) {
      Alert.alert('Error', 'User not authenticated');
      return;
    }

    const success = await createNewPost({
      ownerId: user.uid,
      petId,
      location: {
        lat: 0,
        lng: 0,
        city,
        address,
      },
      date,
      time,
      description,
      photos: [],
      status: 'open',
    });

    if (success) {
      Alert.alert('Success', 'Playdate posted!');
      onSave();
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
        <Text style={styles.label}>Pet ID</Text>
        <TextInput
          style={styles.input}
          placeholder="Pet ID"
          value={petId}
          onChangeText={setPetId}
          placeholderTextColor="#aaa"
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>City</Text>
        <View style={styles.cityButtons}>
          {['Jakarta', 'Surabaya'].map(c => (
            <TouchableOpacity
              key={c}
              style={[styles.cityBtn, city === c && styles.cityBtnActive]}
              onPress={() => setCity(c)}
            >
              <Text style={[styles.cityBtnText, city === c && styles.cityBtnTextActive]}>
                {c}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Address</Text>
        <TextInput
          style={styles.input}
          placeholder="Location details"
          value={address}
          onChangeText={setAddress}
          placeholderTextColor="#aaa"
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Date (YYYY-MM-DD)</Text>
        <TextInput
          style={styles.input}
          placeholder="2026-07-23"
          value={date}
          onChangeText={setDate}
          placeholderTextColor="#aaa"
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Time (HH:MM)</Text>
        <TextInput
          style={styles.input}
          placeholder="14:00"
          value={time}
          onChangeText={setTime}
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

      <TouchableOpacity style={styles.submitButton} onPress={handleSubmit} disabled={loading}>
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
