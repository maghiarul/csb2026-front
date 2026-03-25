import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';

// Importăm ecranele noastre
import MapComponent from './src/components/MapComponent';
import CameraScreen from './src/screens/CameraScreen';
import PlantListScreen from './src/screens/PlantListScreen'; // IMPORT NOU

const Tab = createBottomTabNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Tab.Navigator 
        screenOptions={{ 
          tabBarActiveTintColor: '#2e7d32',
          headerTitleAlign: 'center',
          headerShown: false // Ascundem header-ul standard ca să arate mai "clean"
        }}
      >
        <Tab.Screen 
          name="EcoLocație" 
          component={MapComponent} 
          options={{ 
            tabBarIcon: () => <Text style={{ fontSize: 20 }}>🗺️</Text>,
            tabBarLabel: 'Hartă'
          }} 
        />
        <Tab.Screen 
          name="Identifică" 
          component={CameraScreen} 
          options={{ 
            tabBarIcon: () => <Text style={{ fontSize: 20 }}>📸</Text>,
            tabBarLabel: 'Scanează'
          }} 
        />
        {/* TAB-UL NOU: ENCICLOPEDIA */}
        <Tab.Screen 
          name="Plante" 
          component={PlantListScreen} 
          options={{ 
            tabBarIcon: () => <Text style={{ fontSize: 20 }}>📖</Text>,
            tabBarLabel: 'Bază Date'
          }} 
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}