import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  StyleSheet,
  Picker,
} from 'react-native';
import { getPetProfile, updatePetProfile } from '../../services/health';
import { Pet } from '../../types/health';

interface EditPetProfileScreenProps {
  petId: string;
  onSave: () => void;
}

export const EditPetProfileScreen: React.FC<EditPetProfileScreenProps> = ({
  petId,
  onSave,
}) => {
  const [pet, setPet] = useState<Pet | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form fields
  const [name, setName] = useState('');
  const [breed, setBreed] = useState('');
  const [birthdate, setBirthdate] = useState('');
  const [weight, setWeight] = useState('');
  const [color, setColor] = useState('');
  const [bloodType, setBloodType] = useState<'A' | 'B' | 'AB' | 'O'>('A');
  const [allergies, setAllergies] = useState<string[]>([]);
  const [allergyInput, setAllergyInput] = useState('');
  const [microchip, setMicrochip] = useState('');
  const [insuranceId, setInsuranceId] = useState('');
  const [emergencyName, setEmergencyName] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('');

  const commonBreeds = [
    'Golden Retriever',
    'Labrador',
    'German Shepherd',
    'French Bulldog',
    'Bulldog',
    'Poodle',
    'Beagle',
    'Yorkshire Terrier',
    'Dachshund',
    'Siberian Husky',
  ];

  useEffect(() => {
    const loadPet = async () => {
      try {
        setLoading(true);
        const petData = await getPetProfile(petId);
        setPet(petData);

        // Populate form fields
        setName(petData.name);
        setBreed(petData.breed);
        setBirthdate(petData.birthdate);
        setWeight(petData.weight?.toString() || '');
        setColor(petData.color || '');
        setBloodType(petData.bloodType || 'A');
        setAllergies(petData.allergies || []);
        setMicrochip(petData.microchip || '');
        setInsuranceId(petData.insuranceId || '');
        setEmergencyName(petData.emergencyContact?.name || '');
        setEmergencyPhone(petData.emergencyContact?.phone || '');
      } catch (err) {
        Alert.alert('Error', 'Failed to load pet profile');
      } finally {
        setLoading(false);
      }
    };

    loadPet();
  }, [petId]);

  const handleAddAllergy = () => {
    if (allergyInput.trim()) {
      setAllergies([...allergies, allergyInput.trim()]);
      setAllergyInput('');
    }
  };

  const handleRemoveAllergy = (index: number) => {
    setAllergies(allergies.filter((_, i) => i !== index));
  };

  const handleValidation = (): boolean => {
    if (!name.trim()) {
      Alert.alert('Error', 'Pet name is required');
      return false;
    }
    if (!breed.trim()) {
      Alert.alert('Error', 'Breed is required');
      return false;
    }
    if (!birthdate.trim()) {
      Alert.alert('Error', 'Birthdate is required');
      return false;
    }
    if (!emergencyName.trim()) {
      Alert.alert('Error', 'Emergency contact name is required');
      return false;
    }
    if (!emergencyPhone.trim()) {
      Alert.alert('Error', 'Emergency contact phone is required');
      return false;
    }
    // Simple phone format check (at least 10 digits)
    const phoneDigits = emergencyPhone.replace(/\D/g, '');
    if (phoneDigits.length < 10) {
      Alert.alert('Error', 'Please enter a valid phone number');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!handleValidation()) return;

    try {
      setSubmitting(true);
      const updates: Partial<Pet> = {
        name,
        breed,
        birthdate,
        weight: weight ? parseFloat(weight) : undefined,
        color: color || undefined,
        bloodType,
        allergies: allergies.length > 0 ? allergies : undefined,
        microchip: microchip || undefined,
        insuranceId: insuranceId || undefined,
        emergencyContact: {
          name: emergencyName,
          phone: emergencyPhone,
        },
      };

      await updatePetProfile(petId, updates);
      Alert.alert('Success', 'Pet profile updated');
      onSave();
    } catch (err) {
      Alert.alert(
        'Error',
        err instanceof Error ? err.message : 'Failed to update pet profile'
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0f5c4a" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Edit Pet Profile</Text>

      {/* Name */}
      <View style={styles.section}>
        <Text style={styles.label}>Name *</Text>
        <TextInput
          style={styles.input}
          placeholder="Pet name"
          value={name}
          onChangeText={setName}
          placeholderTextColor="#aaa"
        />
      </View>

      {/* Breed */}
      <View style={styles.section}>
        <Text style={styles.label}>Breed *</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={breed}
            onValueChange={setBreed}
            style={styles.picker}
          >
            <Picker.Item label="Select breed..." value="" />
            {commonBreeds.map((b) => (
              <Picker.Item key={b} label={b} value={b} />
            ))}
          </Picker>
        </View>
        <Text style={styles.helperText}>Selected: {breed || 'None'}</Text>
        {!commonBreeds.includes(breed) && breed && (
          <Text style={styles.helperText}>Custom: {breed}</Text>
        )}
      </View>

      {/* Birthdate */}
      <View style={styles.section}>
        <Text style={styles.label}>Birthdate (YYYY-MM-DD) *</Text>
        <TextInput
          style={styles.input}
          placeholder="2020-01-15"
          value={birthdate}
          onChangeText={setBirthdate}
          placeholderTextColor="#aaa"
        />
      </View>

      {/* Weight */}
      <View style={styles.section}>
        <Text style={styles.label}>Weight (kg)</Text>
        <TextInput
          style={styles.input}
          placeholder="25.5"
          value={weight}
          onChangeText={setWeight}
          keyboardType="decimal-pad"
          placeholderTextColor="#aaa"
        />
      </View>

      {/* Color */}
      <View style={styles.section}>
        <Text style={styles.label}>Color</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., cream, black"
          value={color}
          onChangeText={setColor}
          placeholderTextColor="#aaa"
        />
      </View>

      {/* Blood Type */}
      <View style={styles.section}>
        <Text style={styles.label}>Blood Type</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={bloodType}
            onValueChange={(value) =>
              setBloodType(value as 'A' | 'B' | 'AB' | 'O')
            }
            style={styles.picker}
          >
            <Picker.Item label="A" value="A" />
            <Picker.Item label="B" value="B" />
            <Picker.Item label="AB" value="AB" />
            <Picker.Item label="O" value="O" />
          </Picker>
        </View>
      </View>

      {/* Microchip */}
      <View style={styles.section}>
        <Text style={styles.label}>Microchip ID</Text>
        <TextInput
          style={styles.input}
          placeholder="Microchip number (optional)"
          value={microchip}
          onChangeText={setMicrochip}
          placeholderTextColor="#aaa"
        />
      </View>

      {/* Insurance ID */}
      <View style={styles.section}>
        <Text style={styles.label}>Insurance ID</Text>
        <TextInput
          style={styles.input}
          placeholder="Insurance ID (optional)"
          value={insuranceId}
          onChangeText={setInsuranceId}
          placeholderTextColor="#aaa"
        />
      </View>

      {/* Allergies */}
      <View style={styles.section}>
        <Text style={styles.label}>Allergies</Text>
        <View style={styles.allergyInputContainer}>
          <TextInput
            style={styles.allergyInput}
            placeholder="Add allergy"
            value={allergyInput}
            onChangeText={setAllergyInput}
            placeholderTextColor="#aaa"
          />
          <TouchableOpacity
            style={styles.addButton}
            onPress={handleAddAllergy}
          >
            <Text style={styles.addButtonText}>Add</Text>
          </TouchableOpacity>
        </View>
        {allergies.length > 0 && (
          <View style={styles.allergyList}>
            {allergies.map((allergy, index) => (
              <View key={index} style={styles.allergyTag}>
                <Text style={styles.allergyTagText}>{allergy}</Text>
                <TouchableOpacity onPress={() => handleRemoveAllergy(index)}>
                  <Text style={styles.allergyRemoveText}>✕</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Emergency Contact */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Emergency Contact *</Text>
        <Text style={styles.label}>Name</Text>
        <TextInput
          style={styles.input}
          placeholder="Emergency contact name"
          value={emergencyName}
          onChangeText={setEmergencyName}
          placeholderTextColor="#aaa"
        />
        <Text style={styles.label}>Phone</Text>
        <TextInput
          style={styles.input}
          placeholder="Emergency contact phone"
          value={emergencyPhone}
          onChangeText={setEmergencyPhone}
          keyboardType="phone-pad"
          placeholderTextColor="#aaa"
        />
      </View>

      {/* Submit Button */}
      <TouchableOpacity
        style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
        onPress={handleSubmit}
        disabled={submitting}
      >
        <Text style={styles.submitButtonText}>
          {submitting ? 'Saving...' : 'Save Changes'}
        </Text>
      </TouchableOpacity>

      <View style={styles.spacer} />
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
    color: '#333',
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333',
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
  pickerContainer: {
    backgroundColor: '#fff',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ddd',
    overflow: 'hidden',
  },
  picker: {
    height: 50,
  },
  helperText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  allergyInputContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  allergyInput: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  addButton: {
    backgroundColor: '#0f5c4a',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 6,
    justifyContent: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  allergyList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  allergyTag: {
    flexDirection: 'row',
    backgroundColor: '#e8f5e9',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignItems: 'center',
    gap: 8,
  },
  allergyTagText: {
    fontSize: 12,
    color: '#2e7d32',
    fontWeight: '500',
  },
  allergyRemoveText: {
    fontSize: 14,
    color: '#2e7d32',
    fontWeight: 'bold',
  },
  submitButton: {
    backgroundColor: '#0f5c4a',
    paddingVertical: 14,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 20,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  spacer: {
    height: 20,
  },
});
