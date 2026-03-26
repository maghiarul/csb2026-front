import React, { useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
// IMPORTĂM ICONIȚELE LUCIDE
import { Map as MapIcon, Camera, Leaf, ShieldCheck } from 'lucide-react-native';

import ScanComponent from './src/components/ScanComponent';
import { LocationProvider } from './src/services/LocationContext'; 
import RegisterScreen from './src/screens/RegisterScreen';
import LoginScreen from './src/screens/LoginScreen';
import MapComponent from './src/components/MapComponent';
import PlantListScreen from './src/screens/PlantListScreen';
import AdminScreen from './src/screens/AdminPanel';
import SplashScreen from './src/screens/SplashScreen';

const Tab = createBottomTabNavigator();

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [isAdmin, setIsAdmin] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  const [user, setUser] = useState<any>(null);

  if (showSplash) return <SplashScreen onFinish={() => setShowSplash(false)} />;

  if (!isLoggedIn) {
    if (authMode === 'login') {
      return (
        <LoginScreen 
          onLoginSuccess={(role, userData) => {
            setIsLoggedIn(true);
            if (role === 'admin' || role === 'service_role') setIsAdmin(true);
            setUser(userData);
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
              position: 'absolute',
              bottom: 25,
              left: 20,
              right: 20,
              height: 70,
              borderRadius: 35,
              borderTopWidth: 0,
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
          {/* SECȚIUNEA ACTUALIZATĂ CU ICONIȚE LUCIDE */}
          <Tab.Screen 
            name="Hartă" 
            options={{ 
              tabBarIcon: ({ color, size }) => <MapIcon color={color} size={size} /> 
            }}
          >
            {() => <MapComponent 
                      isAdmin={isAdmin} 
                      currentUserName={user?.username || 'Utilizator'} 
                   />}
          </Tab.Screen>

          <Tab.Screen 
            name="Scanează" 
            component={ScanComponent} 
            options={{ 
              tabBarIcon: ({ color, size }) => <Camera color={color} size={size} /> 
            }} 
          />

          <Tab.Screen 
            name="Enciclopedie" 
            options={{ 
              tabBarIcon: ({ color, size }) => <Leaf color={color} size={size} /> 
            }}
          >
            {() => <PlantListScreen isAdmin={isAdmin} />}
          </Tab.Screen>
          
          {isAdmin && (
            <Tab.Screen 
              name="Admin" 
              component={AdminScreen} 
              options={{ 
                tabBarIcon: ({ color, size }) => <ShieldCheck color={color} size={size} /> 
              }} 
            />
          )}
        </Tab.Navigator>
      </NavigationContainer>
    </LocationProvider>
  );
}