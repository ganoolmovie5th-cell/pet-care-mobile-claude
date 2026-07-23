import React, { useContext } from 'react';
import { ActivityIndicator, View, Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { AuthContext } from '../context/AuthContext';
import { AuthStack } from './AuthStack';
import { HealthStack } from './HealthStack';
import { PlaydateStack } from './PlaydateStack';

const Tab = createBottomTabNavigator();

const VetStackPlaceholder = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
    <Text>Vet Marketplace (TBD)</Text>
  </View>
);


const ProfileStackPlaceholder = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
    <Text>My Profile (TBD)</Text>
  </View>
);

const MainTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#0f5c4a',
        tabBarInactiveTintColor: '#999',
        headerStyle: {
          backgroundColor: '#0f5c4a',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: '600',
        },
      }}
    >
      <Tab.Screen
        name="VetTab"
        component={VetStackPlaceholder}
        options={{
          title: 'Vets',
          tabBarLabel: 'Vets',
          tabBarIcon: () => <Text style={{ fontSize: 20 }}>🏥</Text>,
        }}
      />
      <Tab.Screen
        name="HealthTab"
        component={HealthStack}
        options={{
          title: 'Health',
          tabBarLabel: 'Health',
          tabBarIcon: () => <Text style={{ fontSize: 20 }}>❤️</Text>,
          headerShown: false,
        }}
      />
      <Tab.Screen
        name="PlaydateTab"
        component={PlaydateStack}
        options={{
          title: 'Playdate',
          tabBarLabel: 'Playdate',
          tabBarIcon: () => <Text style={{ fontSize: 20 }}>🎾</Text>,
          headerShown: false,
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileStackPlaceholder}
        options={{
          title: 'Profile',
          tabBarLabel: 'Profile',
          tabBarIcon: () => <Text style={{ fontSize: 20 }}>👤</Text>,
        }}
      />
    </Tab.Navigator>
  );
};

export const RootNavigator = () => {
  const { user, loading } = useContext(AuthContext);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#0f5c4a" />
      </View>
    );
  }

  if (!user) {
    return <AuthStack />;
  }

  return <MainTabs />;
};
