import React from 'react';
import { Text } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { PetProfileScreen } from '../screens/health/PetProfileScreen';
import { HealthDetailScreen } from '../screens/health/HealthDetailScreen';
import { AddRecordScreen } from '../screens/health/AddRecordScreen';
import { RemindersScreen } from '../screens/health/RemindersScreen';
import { EditPetProfileScreen } from '../screens/health/EditPetProfileScreen';
import VaccinationDashboardScreen from '../screens/health/VaccinationDashboardScreen';
import ReminderPreferencesScreen from '../screens/health/ReminderPreferencesScreen';

export type HealthStackParamList = {
  PetList: undefined;
  HealthDetail: { petId: string; petName: string };
  AddRecord: { petId: string };
  EditPetProfile: { petId: string };
  VaccinationDashboard: { petId: string };
  Reminders: undefined;
  ReminderPreferences: undefined;
};

const Stack = createNativeStackNavigator<HealthStackParamList>();
const Tab = createBottomTabNavigator();

const PetListStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#0f5c4a',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: '600',
        },
      }}
    >
      <Stack.Screen
        name="PetList"
        options={{ title: 'My Pets' }}
      >
        {(props: any) => (
          <PetProfileScreen
            onSelectPet={(petId) => {
              props.navigation.navigate('HealthDetail', {
                petId,
                petName: 'Pet',
              });
            }}
            onAddPet={() => {
              props.navigation.navigate('AddRecord', { petId: 'new' });
            }}
          />
        )}
      </Stack.Screen>

      <Stack.Screen
        name="HealthDetail"
        options={({ route }: any) => ({
          title: route.params.petName,
        })}
      >
        {(props: any) => (
          <HealthDetailScreen
            petId={props.route.params.petId}
            petName={props.route.params.petName}
            onAddRecord={(petId) => {
              props.navigation.navigate('AddRecord', { petId });
            }}
          />
        )}
      </Stack.Screen>

      <Stack.Screen
        name="AddRecord"
        options={{ title: 'Add Health Record' }}
      >
        {(props: any) => (
          <AddRecordScreen
            petId={props.route.params.petId}
            onSave={() => {
              props.navigation.goBack();
            }}
          />
        )}
      </Stack.Screen>

      <Stack.Screen
        name="EditPetProfile"
        options={{ title: 'Edit Pet Profile' }}
      >
        {(props: any) => (
          <EditPetProfileScreen
            petId={props.route.params.petId}
            onSave={() => {
              props.navigation.goBack();
            }}
          />
        )}
      </Stack.Screen>

      <Stack.Screen
        name="VaccinationDashboard"
        component={VaccinationDashboardScreen}
        options={({ route }: any) => ({
          title: 'Vaccination Status',
        })}
      />

      <Stack.Screen
        name="ReminderPreferences"
        component={ReminderPreferencesScreen}
        options={{ title: 'Reminder Settings' }}
      />
    </Stack.Navigator>
  );
};

export const HealthStack = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#0f5c4a',
        tabBarInactiveTintColor: '#999',
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="Pets"
        component={PetListStack}
        options={{
          tabBarLabel: 'My Pets',
          tabBarIcon: () => <Text style={{ fontSize: 20 }}>🐾</Text>,
        }}
      />
      <Tab.Screen
        name="Reminders"
        component={RemindersScreen}
        options={{
          tabBarLabel: 'Reminders',
          tabBarIcon: () => <Text style={{ fontSize: 20 }}>⏰</Text>,
        }}
      />
    </Tab.Navigator>
  );
};
