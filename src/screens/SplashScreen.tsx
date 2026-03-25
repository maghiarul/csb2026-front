import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Animated, Image } from 'react-native';

export default function SplashScreen({ onFinish }: { onFinish: () => void }) {
  const fadeAnim = new Animated.Value(0);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1500,
      useNativeDriver: true,
    }).start();

    // După 2.5 secunde, trecem la Login
    const timer = setTimeout(onFinish, 2500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View style={{ opacity: fadeAnim, alignItems: 'center' }}>
        <Text style={styles.logoIcon}>🌿</Text>
        <Text style={styles.title}>EcoScan</Text>
        <Text style={styles.subtitle}>Digitalizing Nature</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#2e7d32', justifyContent: 'center', alignItems: 'center' },
  logoIcon: { fontSize: 80, marginBottom: 10 },
  title: { fontSize: 42, fontWeight: '900', color: '#fff', letterSpacing: 2 },
  subtitle: { fontSize: 16, color: '#A5D6A7', marginTop: 5, fontWeight: '500' }
});