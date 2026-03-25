import React, { useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';
import { LocationProvider } from './src/services/LocationContext';


// Importăm ecranele noastre
import MapComponent from './src/components/MapComponent';
import CameraScreen from './src/screens/CameraScreen';
import PlantListScreen from './src/screens/PlantListScreen';
import LoginScreen from './src/screens/LoginScreen'; // IMPORT NOU

const Tab = createBottomTabNavigator();

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  if (!isLoggedIn) {
    return <LoginScreen onLoginSuccess={() => setIsLoggedIn(true)} />;
  }
  return (
    <LocationProvider>
    <NavigationContainer>
      <Tab.Navigator 
        screenOptions={{ 
          tabBarActiveTintColor: '#2e7d32',
          headerTitleAlign: 'center',
          headerShown: false // Ascundem header-ul standard ca să arate mai "clean"
        }}
        >
        <Tab.Screen name="EcoLocație" component={MapComponent} options={{ tabBarIcon: () => <Text>🗺️</Text> }} />
          <Tab.Screen name="Scanează" component={CameraScreen} options={{ tabBarIcon: () => <Text>📸</Text> }} />
          <Tab.Screen name="Plante" component={PlantListScreen} options={{ tabBarIcon: () => <Text>📖</Text> }} />
      </Tab.Navigator>
      </NavigationContainer>
      </LocationProvider>
  );
}