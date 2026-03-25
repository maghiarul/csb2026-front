import React, { useState, useRef } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Image, Alert, ActivityIndicator, SafeAreaView } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import api from '../services/api';
import { useLocation } from '../services/LocationContext';

export default function ScanComponent() {
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [result, setResult] = useState<any>(null);
  
  const { coords } = useLocation();

  if (!permission) return <View />;
  if (!permission.granted) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.permissionText}>Avem nevoie de cameră pentru identificare.</Text>
        <TouchableOpacity style={styles.primaryButton} onPress={requestPermission}>
          <Text style={styles.buttonText}>Permite Accesul</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const takePicture = async () => {
    if (cameraRef.current) {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.6 });
      setPhotoUri(photo?.uri || null);
    }
  };

  const analyzePlant = async () => {
    if (!photoUri) return;
    setIsAnalyzing(true);
    try {
      const formData = new FormData();
      formData.append('image', {
        uri: photoUri,
        name: 'scan.jpg',
        type: 'image/jpeg',
      } as any);

      const response = await api.post('/identify', formData, {
        transformRequest: (data) => data,
      });

      if (response.status === 200) {
        setResult(response.data);
      }
    } catch (error: any) {
      Alert.alert("Eroare AI", "Serverul AI (port 9999) nu răspunde.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  // NOU: Funcție pentru a salva punctul pe hartă după identificare
  const savePointToDatabase = async () => {
    if (!coords || !result) return;
    setIsSaving(true);
    try {
      const formData = new FormData();
      formData.append('latitude', coords.lat.toString());
      formData.append('longitude', coords.lng.toString());
      formData.append('plant_id', result.plant_id.toString());
      formData.append('comment', `Identificat prin scanare: ${result.plant_name}`);
      
      // Trimitem aceeași poză și la POI
      formData.append('image', {
        uri: photoUri,
        name: 'poi.jpg',
        type: 'image/jpeg',
      } as any);

      await api.post('/poi', formData, { transformRequest: (data) => data });
      Alert.alert("Succes! 🎉", "Planta a fost marcată pe hartă.");
      resetScan();
    } catch (e) {
      Alert.alert("Eroare", "Nu am putut salva locația în baza de date.");
    } finally {
      setIsSaving(false);
    }
  };

  const resetScan = () => {
    setPhotoUri(null);
    setResult(null);
  };

  if (result) {
    return (
      <SafeAreaView style={styles.resultContainer}>
        <Image source={{ uri: photoUri! }} style={styles.previewImage} />
        <View style={styles.resultCard}>
          <Text style={styles.resultTitle}>Rezultat Analiză</Text>
          <Text style={styles.plantName}>{result.plant_name}</Text>
          <Text style={styles.confidence}>Acuratețe: {(result.confidence * 100).toFixed(1)}%</Text>
          
          {coords && (
            <TouchableOpacity 
              style={[styles.primaryButton, {marginTop: 20}]} 
              onPress={savePointToDatabase}
              disabled={isSaving}
            >
              {isSaving ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>📍 Salvează pe Hartă</Text>}
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity style={styles.secondaryButton} onPress={resetScan}>
          <Text style={styles.secondaryButtonText}>Altă Scanare</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      {!photoUri ? (
        <CameraView style={styles.camera} ref={cameraRef}>
          <View style={styles.cameraOverlay}>
             <View style={styles.targetBox} />
          </View>
          <View style={styles.bottomControls}>
            <TouchableOpacity style={styles.captureButton} onPress={takePicture}>
              <View style={styles.captureInner} />
            </TouchableOpacity>
          </View>
        </CameraView>
      ) : (
        <View style={styles.container}>
          <Image source={{ uri: photoUri }} style={styles.fullImage} />
          <View style={styles.bottomControls}>
            {isAnalyzing ? (
              <ActivityIndicator size="large" color="#fff" />
            ) : (
              <View style={styles.actionRow}>
                <TouchableOpacity style={styles.retakeButton} onPress={resetScan}><Text style={styles.buttonText}>Anulează</Text></TouchableOpacity>
                <TouchableOpacity style={styles.analyzeButton} onPress={analyzePlant}><Text style={styles.buttonText}>Analizează</Text></TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  camera: { flex: 1 },
  cameraOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  targetBox: { width: 250, height: 250, borderWidth: 2, borderColor: 'rgba(255,255,255,0.5)', borderRadius: 20 },
  bottomControls: { position: 'absolute', bottom: 130, width: '100%', alignItems: 'center', zIndex: 10 },
  captureButton: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.3)', justifyContent: 'center', alignItems: 'center' },
  captureInner: { width: 65, height: 65, borderRadius: 35, backgroundColor: '#fff' },
  fullImage: { flex: 1 },
  actionRow: { flexDirection: 'row', gap: 20 },
  retakeButton: { backgroundColor: '#d32f2f', padding: 15, borderRadius: 30, minWidth: 120, alignItems: 'center' },
  analyzeButton: { backgroundColor: '#2e7d32', padding: 15, borderRadius: 30, minWidth: 120, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: 'bold' },
  resultContainer: { flex: 1, backgroundColor: '#f5f5f5' },
  previewImage: { width: '100%', height: '45%' },
  resultCard: { backgroundColor: '#fff', margin: 20, marginTop: -20, borderRadius: 25, padding: 25, elevation: 10, paddingBottom: 40 },
  resultTitle: { fontSize: 12, color: '#666', letterSpacing: 1 },
  plantName: { fontSize: 30, fontWeight: 'bold', color: '#2e7d32' },
  confidence: { fontSize: 16, color: '#666' },
  primaryButton: { backgroundColor: '#2e7d32', padding: 15, borderRadius: 30, alignItems: 'center' },
  secondaryButton: { padding: 15, alignItems: 'center', marginBottom: 100 },
  secondaryButtonText: { color: '#2e7d32', fontWeight: 'bold' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  permissionText: { textAlign: 'center', marginBottom: 20 }
});