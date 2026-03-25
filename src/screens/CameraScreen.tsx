import React, { useState, useRef } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Image, Button, TextInput, ActivityIndicator, Alert, ScrollView, SafeAreaView, Modal, FlatList } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { MOCK_PLANTS } from '../services/plantData'; // Importă datele despre plante (pentru Enciclopedie)

export default function CameraScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [photo, setPhoto] = useState<string | null>(null);
  const [comment, setComment] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const cameraRef = useRef<any>(null);
  const [showManualList, setShowManualList] = useState(false);
  const [identifiedPlant, setIdentifiedPlant] = useState<string | null>(null);

  if (!permission) return <View />;

  if (!permission.granted) {
    return (
      <View style={styles.centerContainer}>
        <Text style={{ textAlign: 'center', marginBottom: 20 }}>
          Avem nevoie de permisiunea ta pentru a scana plantele! 🌱
        </Text>
        <Button onPress={requestPermission} title="Permite accesul la Cameră" color="#2e7d32" />
      </View>
    );
  }

  const takePicture = async () => {
    if (cameraRef.current) {
      const photoData = await cameraRef.current.takePictureAsync({ quality: 0.5 }); // Calitate mai mică pentru a trimite rapid pe net
      setPhoto(photoData.uri);
    }
  };

const handleIdentify = () => {
    setIsAnalyzing(true);
    
    // Simulăm apelul către backend-ul colegului tău
    setTimeout(() => {
      setIsAnalyzing(false);
      const aiResult = "Mușețel"; // Aici va veni răspunsul real de la API
      setIdentifiedPlant(aiResult);
      
      Alert.alert(
        "🌿 Rezultat AI", 
        `Am identificat: ${aiResult}. Dacă nu este corect, poți schimba planta manual folosind selectorul.`
      );
    }, 2000);
  };
  // Ecranul 2: După ce am făcut poza (Formularul)
if (photo) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#f5f5f5' }}>
        <ScrollView contentContainerStyle={styles.formContainer}>
          <Image source={{ uri: photo }} style={styles.previewImageSmall} />
          
          {/* SELECTORUL MANUAL */}
          <Text style={styles.label}>Planta identificată:</Text>
          <TouchableOpacity 
            style={styles.selector} 
            onPress={() => setShowManualList(true)}
          >
            <Text style={styles.selectorText}>
              {identifiedPlant ? identifiedPlant : "🔍 Apasă pentru a alege planta..."}
            </Text>
          </TouchableOpacity>

          <Text style={styles.label}>Adaugă un comentariu despre plantă:</Text>
          <TextInput
            style={styles.input}
            placeholder="Ex: Am găsit-o lângă râu, pare sănătoasă..."
            value={comment}
            onChangeText={setComment}
            multiline
          />

          <View style={styles.actionButtons}>
          <Button title="🔄 Refă poza" onPress={() => { setPhoto(null); setIdentifiedPlant(null); }} color="#555" />
          
          {!identifiedPlant ? (
            <Button title="✨ Identifică AI" onPress={handleIdentify} color="#2e7d32" />
          ) : (
            <Button 
              title="🚀 Salvează Punct" 
              onPress={() => Alert.alert("Succes", "Datele au fost trimise către baza de date PostGIS!")} 
              color="#007bff" 
            />
          )}
        </View>
          {/* MODALUL PENTRU LISTĂ */}
          <Modal visible={showManualList} animationType="slide">
            <SafeAreaView style={{ flex: 1, padding: 20 }}>
              <Text style={styles.modalTitle}>Alege planta manual</Text>
              <FlatList
                data={MOCK_PLANTS}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity 
                    style={styles.listItem} 
                    onPress={() => {
                      setIdentifiedPlant(item.name);
                      setShowManualList(false);
                    }}
                  >
                    <Text style={styles.listItemText}>{item.name}</Text>
                  </TouchableOpacity>
                )}
              />
              <Button title="Anulează" onPress={() => setShowManualList(false)} color="red" />
            </SafeAreaView>
          </Modal>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Ecranul 1: Camera Live
  return (
    <SafeAreaView style={styles.container}>
      <CameraView style={styles.camera} facing="back" ref={cameraRef}>
        <View style={styles.overlay}>
          <TouchableOpacity style={styles.captureButton} onPress={takePicture}>
            <Text style={styles.captureText}>📸 Scanează Planta</Text>
          </TouchableOpacity>
        </View>
      </CameraView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  camera: { flex: 1 },
  overlay: {
    flex: 1,
    backgroundColor: 'transparent',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingBottom: 40,
  },
  captureButton: {
    backgroundColor: '#fff',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 30,
    elevation: 5,
  },
  captureText: { fontSize: 18, fontWeight: 'bold', color: '#2e7d32' },
  
  // Stiluri noi pentru formular
  formContainer: { flexGrow: 1, padding: 20, backgroundColor: '#f5f5f5', alignItems: 'center' },
  previewImageSmall: { width: '100%', height: 300, borderRadius: 15, marginBottom: 20 },
  label: { fontSize: 16, fontWeight: 'bold', alignSelf: 'flex-start', marginBottom: 10, color: '#333' },
  input: {
    width: '100%',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: 30,
  },
  actionButtons: { width: '100%', flexDirection: 'row', justifyContent: 'space-between' },
  loadingContainer: { alignItems: 'center', marginTop: 20 },
    loadingText: { marginTop: 10, fontSize: 16, color: '#2e7d32', fontWeight: 'bold' },
  selector: {
    width: '100%',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#2e7d32',
    marginBottom: 20,
    alignItems: 'center',
  },
  selectorText: { fontSize: 16, color: '#2e7d32', fontWeight: 'bold' },
  modalTitle: { fontSize: 22, fontWeight: 'bold', textAlign: 'center', marginVertical: 20, color: '#2e7d32' },
  listItem: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  listItemText: { fontSize: 18, color: '#333' },
});