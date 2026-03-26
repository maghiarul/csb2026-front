import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, Image, Modal, ScrollView, SafeAreaView, ActivityIndicator, Alert } from 'react-native';
import { Leaf, BookOpen, CheckCircle2, AlertTriangle, Trash2, Info, ChevronRight, XCircle } from 'lucide-react-native';
import api from '../services/api';

interface PlantListProps {
  isAdmin?: boolean; 
  route?: any; 
}

interface Plant {
  id: number;
  name_ro: string;
  name_latin: string;
  image_url: string | null;
}

// NORMALIZATOR STRICT: "Buruiana Cârtiței" devine "buruianacartite"
const normalizePlantName = (name: string) => {
  if (!name) return "";
  let cleaned = name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Elimină diacriticele
    .replace(/[^a-zA-Z0-9]/g, "")    // Elimină absolut toate spațiile
    .toLowerCase();
    
  // Asigurăm potrivirea exactă pentru poza ta care se termină în "e"
  if (cleaned === "buruianacartitei") return "buruianacartite";
  
  return cleaned;
};

// Dicționarul REPARAT: FĂRĂ SPAȚII ȘI CU NUMELE EXACTE
const localPlantImages: { [key: string]: any } = {
  "buruianadecartite": require('../../assets/imagini/buruianadecartite.jpg'),
  "ferigadepadure": require('../../assets/imagini/ferigadepadure.jpg'),
  "ferigaregala": require('../../assets/imagini/ferigaregala.jpg'),
  "galbenele": require('../../assets/imagini/galbenele.jpg'),
  "laptucasalbatica": require('../../assets/imagini/laptucasalbatica.jpg'),
  "macaspru": require('../../assets/imagini/macaspru.jpg'),
  "macdecamp": require('../../assets/imagini/macdecamp.jpg'),
  "macdubios": require('../../assets/imagini/macdubios.jpg'),
  "morcovsalbatic": require('../../assets/imagini/morcovsalbatic.jpg'),
  "palamida": require('../../assets/imagini/palamida.jpg'),
  "piciorulcaprei": require('../../assets/imagini/piciorulcaprei.jpg'),
  "scaiete": require('../../assets/imagini/scaiete.jpg'),
  "sugel": require('../../assets/imagini/sugel.jpg'),
  "sunatoare": require('../../assets/imagini/sunatoare.jpg'),
  "susaipaduret": require('../../assets/imagini/susaipaduret.jpg'),
  "trepadatoareanuala": require('../../assets/imagini/trepadatoareanuala.jpg'),
  "trifoialb": require('../../assets/imagini/trifoialb.jpg'),
  "trifoifrag": require('../../assets/imagini/trifoifrag.jpg'),
  "trifoirosu": require('../../assets/imagini/trifoirosu.jpg'),
  "urzicamoartaalba": require('../../assets/imagini/urzicamoartaalba.jpg'),
  "usturoita": require('../../assets/imagini/usturoita.jpg'),
};

export default function PlantListScreen({ isAdmin = false, route }: PlantListProps) {
  const isUserAdmin = isAdmin || route?.params?.isAdmin || false;

  const [plants, setPlants] = useState<Plant[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedPlant, setSelectedPlant] = useState<Plant | null>(null);
  const [fullPlantInfo, setFullPlantInfo] = useState<any | null>(null);
  const [isLoadingInfo, setIsLoadingInfo] = useState(false);

  const fetchPlants = async () => {
    setLoading(true);
    try {
      const response = await api.get('/plants');
      setPlants(response.data);
    } catch (error) {
      Alert.alert('Eroare', 'Nu am putut încărca plantele.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlants();
  }, []);

  const handleSelectPlant = async (plant: Plant) => {
    setSelectedPlant(plant);
    setFullPlantInfo(null);
    setIsLoadingInfo(true);
    
    try {
      const res = await api.get(`/plants/${plant.id}`);
      setFullPlantInfo(res.data);
    } catch (error) {
      console.log("Nu am putut aduce detaliile plantei");
    } finally {
      setIsLoadingInfo(false);
    }
  };

  const getPlantImage = (plantName: string) => {
    const normalized = normalizePlantName(plantName);
    if (localPlantImages[normalized]) {
      return localPlantImages[normalized];
    }
    return { uri: `https://via.placeholder.com/400x300/e0f2f1/2e7d32?text=${encodeURIComponent(plantName)}` }; 
  };

  const getSafeText = (text: string | null | undefined, fallback: string) => {
    if (!text || text.trim() === '') return fallback;
    return text;
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.headerTitle}>Enciclopedie Botanică</Text>
      
      {loading ? (
        <ActivityIndicator size="large" color="#2e7d32" style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={plants}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={{ padding: 15, paddingBottom: 100 }}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.plantCard} onPress={() => handleSelectPlant(item)}>
              <Image source={getPlantImage(item.name_ro)} style={styles.thumbnail} resizeMode="cover" />
              
              <View style={styles.cardInfo}>
                <Text style={styles.plantName}>{item.name_ro}</Text>
                <Text style={styles.plantLatin}>{item.name_latin}</Text>
              </View>
              <ChevronRight color="#2e7d32" size={24} />
            </TouchableOpacity>
          )}
        />
      )}

      {/* Modal Detalii Plantă */}
      <Modal visible={!!selectedPlant} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedPlant && (
              <>
                <TouchableOpacity style={styles.closeIcon} onPress={() => setSelectedPlant(null)}>
                  <XCircle color="#d32f2f" size={32} />
                </TouchableOpacity>

                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
                  <Text style={styles.modalTitle}>{selectedPlant.name_ro}</Text>
                  <Text style={styles.modalScientificName}>{selectedPlant.name_latin}</Text>
                  
                  <Image source={getPlantImage(selectedPlant.name_ro)} style={styles.modalImage} resizeMode="cover" />

                  {isLoadingInfo ? (
                    <ActivityIndicator size="large" color="#2e7d32" style={{ marginVertical: 30 }} />
                  ) : fullPlantInfo ? (
                    <View style={styles.encyclopediaSection}>
                      <View style={styles.sectionHeaderRow}>
                        <Info color="#2e7d32" size={20} />
                        <Text style={styles.sectionSubtitle}>DESCRIERE</Text>
                      </View>
                      <Text style={styles.sectionText}>{getSafeText(fullPlantInfo.description, "Informație indisponibilă.")}</Text>

                      <View style={styles.sectionHeaderRow}>
                        <Leaf color="#2e7d32" size={20} />
                        <Text style={styles.sectionSubtitle}>PĂRȚI UTILIZABILE</Text>
                      </View>
                      <Text style={styles.sectionText}>{getSafeText(fullPlantInfo.usable_parts, "Nespecificat.")}</Text>

                      <View style={styles.sectionHeaderRow}>
                        <CheckCircle2 color="#2e7d32" size={20} />
                        <Text style={styles.sectionSubtitle}>BENEFICII</Text>
                      </View>
                      <Text style={styles.sectionText}>{getSafeText(fullPlantInfo.health_benefits, "Nu sunt documentate.")}</Text>

                      <View style={styles.sectionHeaderRow}>
                        <AlertTriangle color="#c62828" size={20} />
                        <Text style={[styles.sectionSubtitle, { color: '#c62828' }]}>CONTRAINDICAȚII</Text>
                      </View>
                      <Text style={[styles.sectionText, { backgroundColor: '#ffebee', color: '#c62828' }]}>
                        {getSafeText(fullPlantInfo.contraindications, "Consultă un medic.")}
                      </Text>
                    </View>
                  ) : (
                    <Text style={{textAlign: 'center', color: '#666', marginTop: 20}}>Eroare la încărcarea datelor.</Text>
                  )}
                </ScrollView>
              </>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fbe7' },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#2e7d32', textAlign: 'center', marginVertical: 15 },
  plantCard: { backgroundColor: '#fff', flexDirection: 'row', alignItems: 'center', padding: 15, borderRadius: 20, marginBottom: 15, elevation: 3 },
  thumbnail: { width: 70, height: 70, borderRadius: 35, marginRight: 15, backgroundColor: '#eee' },
  cardInfo: { flex: 1 },
  plantName: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  plantLatin: { fontSize: 14, color: '#888', fontStyle: 'italic' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 35, borderTopRightRadius: 35, padding: 25, maxHeight: '90%' },
  closeIcon: { position: 'absolute', top: 15, right: 15, zIndex: 10 },
  modalTitle: { fontSize: 28, fontWeight: '900', color: '#1b5e20', textAlign: 'center', marginTop: 10 },
  modalScientificName: { fontSize: 18, fontStyle: 'italic', color: '#888', textAlign: 'center', marginBottom: 20 },
  modalImage: { width: '100%', height: 250, borderRadius: 25, marginBottom: 20, backgroundColor: '#eee' },
  encyclopediaSection: { width: '100%' },
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', marginTop: 20, marginBottom: 8 },
  sectionSubtitle: { fontSize: 13, fontWeight: '900', color: '#2e7d32', marginLeft: 8, letterSpacing: 1 },
  sectionText: { fontSize: 15, color: '#444', lineHeight: 22, backgroundColor: '#f1f8e9', padding: 15, borderRadius: 15 },
});