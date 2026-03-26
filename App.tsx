import React, { useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';
import ScanComponent from './src/components/ScanComponent';
import { LocationProvider } from './src/services/LocationContext'; 
import RegisterScreen from './src/screens/RegisterScreen';
import LoginScreen from './src/screens/LoginScreen';
import MapComponent from './src/components/MapComponent';
import PlantListScreen from './src/screens/PlantListScreen';
import AdminScreen from './src/screens/AdminPanel'; // Verifică dacă fișierul se numește AdminScreen sau AdminPanel
import SplashScreen from './src/screens/SplashScreen';

const Tab = createBottomTabNavigator();

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [isAdmin, setIsAdmin] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
if (showSplash) return <SplashScreen onFinish={() => setShowSplash(false)} />;

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
        <Tab.Navigator 
  screenOptions={{ 
    tabBarActiveTintColor: '#2e7d32',
    tabBarInactiveTintColor: '#999',
    headerShown: false,
    tabBarStyle: {
      backgroundColor: '#fff',
      marginRight: 10,
      marginLeft: 10,
      position: 'absolute', // Esențial pentru efectul de plutire
      bottom: 25,           // Distanța de marginea de jos
      left: 20,             // Distanța de marginea stângă
      right: 20,            // Distanța de marginea dreaptă
      height: 70,           // Înălțime modernă
      borderRadius: 35,     // Capsulă perfectă
      borderTopWidth: 0,    // Scoatem linia standard
      // Umbră premium
      elevation: 15,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.12,
      shadowRadius: 20,
      paddingBottom: 12,
      paddingTop: 10,
    },
    tabBarLabelStyle: {
      fontSize: 11,
      fontWeight: '700',
      marginTop: -5,
    }
  }}
>
          <Tab.Screen name="Hartă" component={MapComponent} options={{ tabBarIcon: () => <Text>🗺️</Text> }} />
          <Tab.Screen name="Scanează" component={ScanComponent} options={{ tabBarIcon: () => <Text>📸</Text> }} />
          <Tab.Screen 
            name="Enciclopedie" 
            options={{ tabBarIcon: () => <Text>🌿</Text> }}
          >
            {() => <PlantListScreen isAdmin={isAdmin} />}
          </Tab.Screen>
          
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