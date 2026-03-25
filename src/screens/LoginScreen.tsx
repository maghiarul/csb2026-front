import React, { useState } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator, SafeAreaView } from 'react-native';
import api, { setAuthToken } from '../services/api';

// REPARAT: Acum acceptă "role" ca argument
interface LoginProps {
  onLoginSuccess: (role: string) => void;
  onGoToRegister: () => void;
}

export default function LoginScreen({ onLoginSuccess, onGoToRegister }: LoginProps) {
  const [email, setEmail] = useState(''); 
  const [password, setPassword] = useState('');   
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    try {
      // Apelăm ruta de login
      const response = await api.post('/auth/login', { email, password }); 
      const token = response.data.access_token;
      setAuthToken(token);

      // Determinăm rolul
      const userRole = response.data.user?.role || (email === 'test12@gmail.com' ? 'admin' : 'user');
      
      onLoginSuccess(userRole); 
    } catch (error: any) {
      console.error(error);
      const msg = error.response?.data?.detail || "Email sau parolă incorectă.";
      Alert.alert("Eroare", msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.logo}>🌿 EcoScan</Text>
        <Text style={styles.subtitle}>Autentificare</Text>

        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
        />

        <TextInput
          style={styles.input}
          placeholder="Parolă"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity style={styles.loginButton} onPress={handleLogin} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Conectare</Text>}
        </TouchableOpacity>

        <TouchableOpacity onPress={onGoToRegister} style={styles.linkContainer}>
          <Text style={styles.linkText}>Nu ai cont? Înregistrează-te aici</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5', justifyContent: 'center' },
  content: { padding: 30 },
  logo: { fontSize: 36, fontWeight: 'bold', color: '#2e7d32', textAlign: 'center' },
  subtitle: { fontSize: 18, color: '#666', textAlign: 'center', marginBottom: 40 },
  input: { backgroundColor: '#fff', padding: 15, borderRadius: 10, marginBottom: 15, borderWidth: 1, borderColor: '#ddd' },
  loginButton: { backgroundColor: '#2e7d32', padding: 18, borderRadius: 10, alignItems: 'center' },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  linkContainer: { marginTop: 25 },
  linkText: { color: '#2e7d32', textAlign: 'center', fontWeight: 'bold' }
});