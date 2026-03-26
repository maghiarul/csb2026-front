import React, { useState, useRef } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Image, Alert, ActivityIndicator, SafeAreaView, FlatList, ScrollView, TextInput } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import api from '../services/api';
import { useLocation } from '../services/LocationContext';
import { MOCK_PLANTS } from '../services/plantData';

interface PostmanPlant {
  id: number;
  name_ro: string;
  name_latin: string;
  confidence?: number;
}

export default function ScanComponent() {
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const [mainResult, setMainResult] = useState<{id: number, name: string, confidence: number} | null>(null);
  const [topCandidates, setTopCandidates] = useState<PostmanPlant[]>([]);
  const [fallbackPlants, setFallbackPlants] = useState<PostmanPlant[]>([]);
  
  const [selectedPlantId, setSelectedPlantId] = useState<number | null>(null);
  const [showFallbackList, setShowFallbackList] = useState(false);
  
  // NOU: State pentru comentariul utilizatorului
  const [userComment, setUserComment] = useState('');
  
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
    resetAnalysisState(); 
    
    try {
      const formData = new FormData();
      formData.append('image', { uri: photoUri, name: 'scan.jpg', type: 'image/jpeg' } as any);

      const response = await api.post('/identify', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (response.status === 200) {
        const data = response.data;
        
        if (data && data.plant_name) {
          const foundId = data.plant_id ? data.plant_id : -1;
          setMainResult({ id: foundId, name: data.plant_name, confidence: data.confidence });
          setSelectedPlantId(foundId); 
          setTopCandidates(data.top_candidates || []);
          
          if (data.fallback_plants && data.fallback_plants.length > 0) {
            setFallbackPlants(data.fallback_plants);
          } else {
            const localFallback = MOCK_PLANTS.map(p => ({
              id: Number(p.id),
              name_ro: p.name,
              name_latin: "Necunoscut"
            }));
            setFallbackPlants(localFallback);
          }
        } else {
          Alert.alert("Eroare de Format", "Serverul nu a recunoscut planta.");
        }
      }
    } catch (error: any) {
      Alert.alert("Eroare la Scanare", "A apărut o eroare la comunicarea cu serverul.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const savePointToDatabase = async () => {
    if (!coords) {
      Alert.alert("Harta este goală", "Nu ai selectat o locație! Mergi în tab-ul 'Hartă', apasă lung pe o zonă pentru a seta locația.");
      return;
    }

    if (selectedPlantId === null) return;

    if (selectedPlantId === -1) {
      Alert.alert(
        "Plantă Neînregistrată ⚠️", 
        "AI-ul a recunoscut planta, dar ea nu există încă în baza de date.\n\nTe rog să apeși pe butonul 'Vezi lista completă' și să selectezi manual specia corectă înainte de a o salva pe hartă!"
      );
      return;
    }

    setIsSaving(true);
    
    let selectedName = "Plantă Necunoscută";
    if (mainResult?.id === selectedPlantId) selectedName = mainResult.name;
    else {
      const foundInTop = topCandidates.find(p => p.id === selectedPlantId);
      const foundInFallback = fallbackPlants.find(p => p.id === selectedPlantId);
      if (foundInTop) selectedName = foundInTop.name_ro;
      if (foundInFallback) selectedName = foundInFallback.name_ro;
    }

    try {
      const formData = new FormData();
      formData.append('latitude', coords.lat.toString());
      formData.append('longitude', coords.lng.toString());
      formData.append('plant_id', selectedPlantId.toString());
      
      // NOU: Folosim comentariul utilizatorului, dacă există. Altfel punem textul default.
      const finalComment = userComment.trim() !== '' 
        ? userComment 
        : `Identificat prin scanare: ${selectedName}`;
      formData.append('comment', finalComment);
      
      formData.append('image', { uri: photoUri, name: 'poi.jpg', type: 'image/jpeg' } as any);

      await api.post('/poi', formData, { transformRequest: (data) => data });
      Alert.alert("Succes! 🎉", `Punctul a fost salvat ca ${selectedName} pe hartă.`);
      resetScan();
    } catch (e: any) {
      Alert.alert("Eroare", "Nu am putut salva locația în baza de date.");
    } finally {
      setIsSaving(false);
    }
  };

  const resetAnalysisState = () => {
    setMainResult(null);
    setTopCandidates([]);
    setFallbackPlants([]);
    setSelectedPlantId(null);
    setShowFallbackList(false);
    setUserComment(''); // Curățăm și comentariul
  };

  const resetScan = () => {
    setPhotoUri(null);
    resetAnalysisState();
  };

  if (mainResult) {
    const combinedCandidates = [
      { id: mainResult.id, name_ro: mainResult.name, name_latin: "Cel mai probabil", confidence: mainResult.confidence },
      ...topCandidates
    ];

    return (
      <SafeAreaView style={styles.resultContainer}>
        <ScrollView contentContainerStyle={{ flexGrow: 1, paddingBottom: 120 }}>
          <Image source={{ uri: photoUri! }} style={styles.previewImage} />
          
          <View style={styles.resultCard}>
            <Text style={styles.resultTitle}>Rezultat Analiză (Selectează Planta):</Text>
            
            <FlatList
              data={combinedCandidates}
              keyExtractor={(item, index) => `${item.id}-${index}`}
              style={styles.candidatesList}
              scrollEnabled={false} 
              renderItem={({ item, index }) => {
                const isSelected = item.id === selectedPlantId;
                return (
                  <TouchableOpacity 
                    style={[styles.candidateItem, isSelected && styles.candidateItemSelected]} 
                    onPress={() => setSelectedPlantId(item.id)}
                  >
                    <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
                      <Text style={[styles.candidateName, isSelected && styles.candidateNameSelected]}>
                        {index === 0 ? `🥇 ${item.name_ro}` : `${index + 1}. ${item.name_ro} (${item.name_latin})`}
                      </Text>
                      {item.confidence !== undefined && (
                        <Text style={[styles.confidenceLabel, isSelected && {color: '#fff'}]}>
                          {(item.confidence * 100).toFixed(0)}%
                        </Text>
                      )}
                    </View>
                  </TouchableOpacity>
                );
              }}
            />

            <TouchableOpacity style={styles.fallbackTextButton} onPress={() => setShowFallbackList(!showFallbackList)}>
              <Text style={styles.fallbackText}>Nu este aici? Vezi lista completă (Fallback) 🔍</Text>
            </TouchableOpacity>

            {/* NOU: Căsuța de text pentru comentariu */}
            <View style={styles.commentInputContainer}>
              <Text style={styles.commentInputLabel}>📝 Adaugă o notiță (opțional):</Text>
              <TextInput
                style={styles.commentInput}
                placeholder="Ex: Găsită lângă stejarul bătrân..."
                value={userComment}
                onChangeText={setUserComment}
                multiline
                numberOfLines={2}
                placeholderTextColor="#999"
              />
            </View>

            <TouchableOpacity 
              style={[styles.primaryButton, {marginTop: 10}]} 
              onPress={savePointToDatabase} 
              disabled={isSaving}
            >
              {isSaving ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>📍 Salvează pe Hartă</Text>}
            </TouchableOpacity>

            <TouchableOpacity style={styles.secondaryButton} onPress={resetScan}>
              <Text style={styles.secondaryButtonText}>Anulează / Altă Scanare</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {showFallbackList && (
            <View style={styles.fallbackModal}>
                <View style={styles.fallbackContent}>
                    <Text style={styles.fallbackHeader}>Dicționar Fallback:</Text>
                    <FlatList
                        data={fallbackPlants}
                        keyExtractor={(item) => item.id.toString()}
                        renderItem={({ item }) => {
                            const isSelected = item.id === selectedPlantId;
                            return (
                                <TouchableOpacity 
                                    style={[styles.candidateItem, isSelected && styles.candidateItemSelected]} 
                                    onPress={() => {
                                        setSelectedPlantId(item.id);
                                        setShowFallbackList(false);
                                    }}
                                >
                                    <Text style={[styles.candidateName, isSelected && styles.candidateNameSelected, {fontSize: 14}]}>
                                        {item.name_ro} ({item.name_latin})
                                    </Text>
                                </TouchableOpacity>
                            );
                        }}
                    />
                     <TouchableOpacity style={[styles.secondaryButton, {marginTop: 10}]} onPress={() => setShowFallbackList(false)}>
                        <Text style={styles.secondaryButtonText}>Închide Lista</Text>
                     </TouchableOpacity>
                </View>
            </View>
        )}
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      {!photoUri ? (
        <CameraView style={styles.camera} ref={cameraRef}>
          <View style={styles.cameraOverlay}><View style={styles.targetBox} /></View>
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
  previewImage: { width: '100%', height: 300 },
  resultCard: { backgroundColor: '#fff', margin: 20, marginTop: -30, borderRadius: 25, padding: 20, elevation: 10 },
  resultTitle: { fontSize: 14, color: '#666', marginBottom: 15, fontWeight: 'bold' },
  candidatesList: { marginBottom: 10 },
  candidateItem: { padding: 12, backgroundColor: '#eee', borderRadius: 12, marginBottom: 8 },
  candidateItemSelected: { backgroundColor: '#2e7d32' },
  candidateName: { fontSize: 16, color: '#333' },
  candidateNameSelected: { color: '#fff', fontWeight: 'bold' },
  confidenceLabel: { fontSize: 12, color: '#666', fontWeight: 'bold' },
  fallbackTextButton: { paddingVertical: 15, alignItems: 'center', borderTopWidth: 1, borderTopColor: '#eee', marginTop: 10 },
  fallbackText: { color: '#2e7d32', textDecorationLine: 'underline', fontSize: 13, fontWeight: 'bold' },
  
  // NOU: Stiluri pentru input-ul de comentariu
  commentInputContainer: { marginTop: 15, marginBottom: 10 },
  commentInputLabel: { fontSize: 13, fontWeight: 'bold', color: '#666', marginBottom: 8 },
  commentInput: { backgroundColor: '#f9fbe7', borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 12, padding: 12, fontSize: 14, color: '#333', minHeight: 60, textAlignVertical: 'top' },

  fallbackModal: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', zIndex: 100 },
  fallbackContent: { width: '90%', maxHeight: '80%', backgroundColor: '#fff', borderRadius: 20, padding: 15 },
  fallbackHeader: { fontSize: 18, fontWeight: 'bold', marginBottom: 15, color: '#2e7d32', textAlign: 'center' },
  primaryButton: { backgroundColor: '#2e7d32', padding: 18, borderRadius: 30, alignItems: 'center' },
  secondaryButton: { padding: 15, alignItems: 'center', marginTop: 15 },
  secondaryButtonText: { color: '#d32f2f', fontWeight: 'bold', fontSize: 16 },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  permissionText: { textAlign: 'center', marginBottom: 20 }
});