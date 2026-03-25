import React, { useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';

import { LocationProvider } from './src/services/LocationContext'; 
import RegisterScreen from './src/screens/RegisterScreen';
import LoginScreen from './src/screens/LoginScreen';
import MapComponent from './src/components/MapComponent';
import CameraScreen from './src/screens/CameraScreen';
import PlantListScreen from './src/screens/PlantListScreen';
import AdminScreen from './src/screens/AdminPanel'; // Verifică dacă fișierul se numește AdminScreen sau AdminPanel

const Tab = createBottomTabNavigator();

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [isAdmin, setIsAdmin] = useState(false);

  if (!isLoggedIn) {
    if (authMode === 'login') {
      return (
        <LoginScreen 
          onLoginSuccess={(role: string) => {
            setIsLoggedIn(true);
            // Verificăm rolul
            if (role === 'admin' || role === 'service_role') {
              setIsAdmin(true);
            }
          }} 
          onGoToRegister={() => setAuthMode('register')} 
        />
      );
    }
    return <RegisterScreen onBackToLogin={() => setAuthMode('login')} />;
  }

  return (
    <LocationProvider>
      <NavigationContainer>
        <Tab.Navigator screenOptions={{ tabBarActiveTintColor: '#2e7d32', headerShown: false }}>
          <Tab.Screen name="Hartă" component={MapComponent} options={{ tabBarIcon: () => <Text>🗺️</Text> }} />
          <Tab.Screen name="Scanează" component={CameraScreen} options={{ tabBarIcon: () => <Text>📸</Text> }} />
          <Tab.Screen name="Enciclopedie" component={PlantListScreen} options={{ tabBarIcon: () => <Text>🌿</Text> }} />
          
          {isAdmin && (
            <Tab.Screen 
              name="Admin" 
              component={AdminScreen} 
              options={{ tabBarIcon: () => <Text>⚙️</Text> }} 
            />
          )}
        </Tab.Navigator>
      </NavigationContainer>
    </LocationProvider>
  );
}