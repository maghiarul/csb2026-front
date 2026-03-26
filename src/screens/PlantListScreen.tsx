import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, Image, Modal, ScrollView, SafeAreaView, ActivityIndicator, Alert } from 'react-native';
// IMPORTĂM ICONIȚELE LUCIDE
import { 
  Leaf, 
  BookOpen, 
  CheckCircle2, 
  AlertTriangle, 
  Trash2, 
  Info, 
  ChevronRight,
  XCircle
} from 'lucide-react-native';
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
      console.error("Eroare Enciclopedie:", error);
      Alert.alert("Eroare", "Nu am putut descărca plantele.");
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
      console.log("Eroare detalii:", error);
    } finally {
      setIsLoadingInfo(false);
    }
  };

  const handleDeletePlant = (plantId: number) => {
    if (!isUserAdmin) return; 
    Alert.alert("Ștergere", "Ești sigur că vrei să elimini planta?", [
      { text: "Anulează", style: "cancel" },
      { text: "Șterge", style: "destructive", onPress: async () => {
          try {
            await api.delete(`/admin/plants/${plantId}`);
            Alert.alert("Succes", "Planta a fost ștearsă!");
            setSelectedPlant(null);
            fetchPlants();
          } catch (error) { Alert.alert("Eroare", "Eroare la ștergere."); }
      }}
    ]);
  };

  const renderPlantCard = ({ item }: { item: Plant }) => {
    const imageUrl = item.image_url ? { uri: item.image_url } : { uri: 'https://via.placeholder.com/150/2e7d32/FFFFFF?text=EcoScan' };

    return (
      <TouchableOpacity style={styles.card} onPress={() => handleSelectPlant(item)}>
        <Image source={imageUrl} style={styles.cardImage} resizeMode="cover" />
        <View style={styles.cardContent}>
          <Text style={styles.plantName}>{item.name_ro || "Nume Necunoscut"}</Text>
          <Text style={styles.scientificName}>{item.name_latin || "Specie Necunoscută"}</Text>
          <View style={styles.tapToReadContainer}>
            <Text style={styles.tapToRead}>DETALII</Text>
            <ChevronRight color="#A1887F" size={14} style={{marginLeft: 4}} />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const getSafeText = (text: string | null | undefined, fallback: string) => (!text || text.trim() === '') ? fallback : text;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Leaf color="#1b5e20" size={28} style={{marginBottom: 5}} />
        <Text style={styles.headerTitle}>Enciclopedia Plantelor</Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2e7d32" />
          <Text style={{ marginTop: 15, color: '#666' }}>Se descarcă datele...</Text>
        </View>
      ) : (
        <FlatList
          data={plants}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContainer}
          renderItem={renderPlantCard}
          onRefresh={fetchPlants}
          refreshing={loading}
          ListEmptyComponent={<Text style={styles.emptyText}>Nu există plante în baza de date.</Text>}
        />
      )}

      <Modal visible={!!selectedPlant} animationType="slide" transparent={true} onRequestClose={() => setSelectedPlant(null)}>
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={() => setSelectedPlant(null)} />
          <View style={styles.modalContent}>
            {selectedPlant && (
              <>
                <Text style={styles.modalTitle}>{selectedPlant.name_ro}</Text>
                <Text style={styles.modalScientificName}>{selectedPlant.name_latin}</Text>
                
                <ScrollView style={styles.scrollArea} showsVerticalScrollIndicator={true} contentContainerStyle={{ paddingBottom: 20 }}>
                  <Image source={selectedPlant.image_url ? { uri: selectedPlant.image_url } : { uri: 'https://via.placeholder.com/400x300/e0e0e0/888888?text=Fara+Poza' }} style={styles.modalImage} resizeMode="cover" />
                  
                  {isLoadingInfo ? (
                     <View style={{padding: 20, alignItems: 'center'}}>
                       <ActivityIndicator size="small" color="#2e7d32" />
                       <Text style={{color: '#666', marginTop: 10}}>Se încarcă...</Text>
                     </View>
                  ) : fullPlantInfo ? (
                    <View style={styles.encyclopediaSection}>
                      <View style={styles.sectionHeaderRow}>
                        <Info color="#2e7d32" size={18} />
                        <Text style={styles.sectionSubtitle}>DESCRIERE</Text>
                      </View>
                      <Text style={styles.sectionText}>{getSafeText(fullPlantInfo.description, "Fără descriere.")}</Text>

                      <View style={styles.sectionHeaderRow}>
                        <Leaf color="#2e7d32" size={18} />
                        <Text style={styles.sectionSubtitle}>PĂRȚI UTILIZABILE</Text>
                      </View>
                      <Text style={styles.sectionText}>{getSafeText(fullPlantInfo.usable_parts, "Nu sunt specificate.")}</Text>

                      <View style={styles.sectionHeaderRow}>
                        <CheckCircle2 color="#2e7d32" size={18} />
                        <Text style={styles.sectionSubtitle}>BENEFICII</Text>
                      </View>
                      <Text style={styles.sectionText}>{getSafeText(fullPlantInfo.health_benefits, "Nu sunt documentate.")}</Text>

                      <View style={styles.sectionHeaderRow}>
                        <AlertTriangle color="#c62828" size={18} />
                        <Text style={[styles.sectionSubtitle, {color: '#c62828'}]}>CONTRAINDICAȚII</Text>
                      </View>
                      <Text style={[styles.sectionText, {backgroundColor: '#ffebee', color: '#c62828'}]}>{getSafeText(fullPlantInfo.contraindications, "Consultați un medic.")}</Text>
                    </View>
                  ) : null}
                </ScrollView>

                <View style={styles.modalButtonsRow}>
                  <TouchableOpacity style={[styles.actionButton, {backgroundColor: '#2e7d32'}]} onPress={() => setSelectedPlant(null)}>
                    <Text style={styles.actionButtonText}>Închide</Text>
                  </TouchableOpacity>
                  {isUserAdmin && (
                    <TouchableOpacity style={[styles.actionButton, {backgroundColor: '#d32f2f'}]} onPress={() => handleDeletePlant(selectedPlant.id)}>
                      <Trash2 color="#fff" size={20} />
                    </TouchableOpacity>
                  )}
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F1F8E9' }, 
  header: { paddingTop: 60, paddingBottom: 10, paddingHorizontal: 20, alignItems: 'center' },
  headerTitle: { fontSize: 26, fontWeight: '900', color: '#1b5e20', textAlign: 'center', letterSpacing: -0.5 },
  listContainer: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 100 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { textAlign: 'center', marginTop: 50, color: '#666' },
  card: { 
    backgroundColor: '#fff', borderRadius: 25, marginBottom: 20, overflow: 'hidden', 
    flexDirection: 'column', alignItems: 'center', elevation: 4
  },
  cardImage: { width: '100%', height: 160, backgroundColor: '#f5f5f5' },
  cardContent: { padding: 20, alignItems: 'center', width: '100%' },
  plantName: { fontSize: 20, fontWeight: '800', color: '#2e7d32', marginBottom: 4, textAlign: 'center' },
  scientificName: { fontSize: 14, fontStyle: 'italic', color: '#888', marginBottom: 12, textAlign: 'center' },
  tapToReadContainer: { flexDirection: 'row', alignItems: 'center' },
  tapToRead: { fontSize: 11, color: '#A1887F', fontWeight: '800', letterSpacing: 1 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalContent: { 
    backgroundColor: '#fff', borderTopLeftRadius: 35, borderTopRightRadius: 35, 
    paddingHorizontal: 25, paddingTop: 25, paddingBottom: 40, maxHeight: '90%'
  },
  modalTitle: { fontSize: 28, fontWeight: '900', color: '#1b5e20', textAlign: 'center' },
  modalScientificName: { fontSize: 18, fontStyle: 'italic', color: '#888', textAlign: 'center', marginBottom: 20 },
  scrollArea: { flexShrink: 1, marginBottom: 15 },
  modalImage: { width: '100%', height: 240, borderRadius: 25, marginBottom: 20 },
  encyclopediaSection: { width: '100%', alignItems: 'center' },
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', marginTop: 20, marginBottom: 8 },
  sectionSubtitle: { fontSize: 13, fontWeight: '900', color: '#2e7d32', marginLeft: 8, letterSpacing: 1 },
  sectionText: { 
    fontSize: 15, color: '#444', lineHeight: 22, backgroundColor: '#F9FBE7', 
    padding: 15, borderRadius: 15, width: '100%', textAlign: 'center'
  },
  modalButtonsRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, paddingTop: 15, borderTopWidth: 1, borderTopColor: '#eee' },
  actionButton: { flex: 1, padding: 18, borderRadius: 18, alignItems: 'center', justifyContent: 'center', flexDirection: 'row' },
  actionButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});