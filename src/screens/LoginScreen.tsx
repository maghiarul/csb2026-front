import React, { useState } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator, SafeAreaView } from 'react-native';
import api, { setAuthToken } from '../services/api';

export default function LoginScreen({ onLoginSuccess }: { onLoginSuccess: () => void }) {
  const [email, setEmail] = useState(''); // Precompletat cu datele tale de test
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Eroare", "Te rugăm să introduci email-ul și parola.");
      return;
    }

    setLoading(true);
    try {
      // Trimitem cererea conform colectiei Postman
      const response = await api.post('/auth/login', {
        email: email,
        password: password
      });

      // Salvăm token-ul primit în header-ul Axios
      const token = response.data.access_token;
      setAuthToken(token);
      
      Alert.alert("Succes", "Te-ai autentificat cu succes!");
      onLoginSuccess(); // Trecem la restul aplicației
    } catch (error: any) {
      console.error(error);
      const errorMsg = error.response?.data?.detail || "Email sau parolă incorectă.";
      Alert.alert("Eroare Autentificare", errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.logo}>🌿 EcoScan Admin</Text>
        <Text style={styles.subtitle}>Concursul Severin Bumbaru 2026</Text>

        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        <TextInput
          style={styles.input}
          placeholder="Parolă"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity 
          style={styles.loginButton} 
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Intră în aplicație</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f4f0', justifyContent: 'center' },
  content: { padding: 30 },
  logo: { fontSize: 32, fontWeight: 'bold', color: '#2e7d32', textAlign: 'center', marginBottom: 10 },
  subtitle: { fontSize: 16, color: '#666', textAlign: 'center', marginBottom: 40 },
  input: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#ddd',
    fontSize: 16,
  },
  loginButton: {
    backgroundColor: '#2e7d32',
    padding: 18,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
    elevation: 3,
  },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' }
});