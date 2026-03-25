import React, { useState, useRef } from 'react'; // Adăugăm useRef
import { StyleSheet, View, Text, TouchableOpacity, Image, ActivityIndicator, Alert } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import api from '../services/api';

export default function CameraScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [photo, setPhoto] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  
  // 1. Cream o referință pentru cameră
  const cameraRef = useRef<CameraView>(null);

  if (!permission) return <View />;
  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <TouchableOpacity style={styles.pillButton} onPress={requestPermission}>
          <Text style={styles.buttonText}>Oferă Permisiune Cameră</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // 2. Funcția de captură folosește referința
  const takePicture = async () => {
    if (cameraRef.current) {
      try {
        const data = await cameraRef.current.takePictureAsync({
          quality: 0.5,
          base64: true,
        });
        setPhoto(data);
      } catch (e) {
        Alert.alert("Eroare", "Nu am putut face poza.");
      }
    }
  };

  const handleIdentify = async () => {
    if (!photo) return;
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('image', {
        uri: photo.uri,
        name: 'plant.jpg',
        type: 'image/jpeg',
      } as any);

      const response = await api.post('/identify', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      Alert.alert("Identificare Reușită! 🌿", `Planta: ${response.data.plant_name}`);
    } catch (error) {
      Alert.alert("Info AI", "Serverul de identificare este offline momentan.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {!photo ? (
        // 3. Atașăm ref-ul aici și punem UI-ul direct ca element copil
        <CameraView ref={cameraRef} style={styles.camera} facing="back">
          <View style={styles.controlsContainer}>
            <TouchableOpacity 
              style={styles.captureButton} 
              onPress={takePicture} 
            />
          </View>
        </CameraView>
      ) : (
        <View style={styles.previewContainer}>
          <Image source={{ uri: photo.uri }} style={styles.preview} />
          <View style={styles.actionContainer}>
            <TouchableOpacity style={[styles.pillButton, styles.secondaryPill]} onPress={() => setPhoto(null)}>
              <Text style={styles.secondaryText}>Anulează</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.pillButton} onPress={handleIdentify} disabled={loading}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Scanează</Text>}
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  camera: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  controlsContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 130, // Ridicat să nu intre sub meniu
  },
  captureButton: {
    width: 75,
    height: 75,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderWidth: 5,
    borderColor: '#fff',
  },
  previewContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  preview: { width: '100%', height: '100%' },
  actionContainer: {
    position: 'absolute',
    bottom: 120, // Ridicat să nu intre sub meniu
    flexDirection: 'row',
    gap: 15,
  },
  pillButton: {
    backgroundColor: '#2e7d32',
    paddingVertical: 15,
    paddingHorizontal: 25,
    borderRadius: 30,
    elevation: 5,
  },
  secondaryPill: { backgroundColor: '#fff' },
  buttonText: { color: '#fff', fontWeight: 'bold' },
  secondaryText: { color: '#2e7d32', fontWeight: 'bold' }
});