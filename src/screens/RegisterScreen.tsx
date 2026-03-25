import React, { useState } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator, SafeAreaView, ScrollView } from 'react-native';
import api from '../services/api';

export default function RegisterScreen({ onBackToLogin }: { onBackToLogin: () => void }) {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    // Validări de bază frontend
    if (!username || !email || !password) {
      Alert.alert("Eroare", "Toate câmpurile sunt obligatorii!");
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert("Eroare", "Parolele nu coincid!");
      return;
    }

    setLoading(true);
    try {
      // Apelăm ruta de register din Postman
      await api.post('/auth/register', {
        email: email,
        password: password,
        username: username
      });

      Alert.alert(
        "Cont Creat! 🎉", 
        "Acum te poți loga cu noile date.",
        [{ text: "OK", onPress: onBackToLogin }]
      );
    } catch (error: any) {
      console.error(error);
      const errorMsg = error.response?.data?.detail || "Nu am putut crea contul. Email-ul ar putea fi deja folosit.";
      Alert.alert("Eroare", errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.logo}>🌿 Alătură-te EcoScan</Text>
        <Text style={styles.subtitle}>Creează un cont pentru a salva plante</Text>

        <TextInput
          style={styles.input}
          placeholder="Nume utilizator (Username)"
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
        />

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

        <TextInput
          style={styles.input}
          placeholder="Confirmă Parola"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
        />

        <TouchableOpacity 
          style={styles.registerButton} 
          onPress={handleRegister}
          disabled={loading}
        >
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Creează Cont</Text>}
        </TouchableOpacity>

        <TouchableOpacity onPress={onBackToLogin} style={{ marginTop: 20 }}>
          <Text style={styles.linkText}>Ai deja cont? Loghează-te aici</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f4f0' },
  content: { padding: 30, justifyContent: 'center', flexGrow: 1 },
  logo: { fontSize: 28, fontWeight: 'bold', color: '#2e7d32', textAlign: 'center', marginBottom: 10 },
  subtitle: { fontSize: 16, color: '#666', textAlign: 'center', marginBottom: 30 },
  input: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  registerButton: {
    backgroundColor: '#2e7d32',
    padding: 18,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  linkText: { color: '#2e7d32', textAlign: 'center', fontWeight: '600' }
});