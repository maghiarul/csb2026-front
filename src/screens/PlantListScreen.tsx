import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, Image, Modal, ScrollView, SafeAreaView, ActivityIndicator, Alert } from 'react-native';
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
  
  // State-uri pentru Modal
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
      Alert.alert("Eroare", "Nu am putut descărca plantele de pe server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlants();
  }, []);

  // Funcția care se apelează când dai click pe o plantă din listă
  const handleSelectPlant = async (plant: Plant) => {
    setSelectedPlant(plant);
    setFullPlantInfo(null); // Resetăm datele vechi
    setIsLoadingInfo(true);
    
    try {
      // Cerem de la server toate detaliile pentru planta selectată
      const res = await api.get(`/plants/${plant.id}`);
      setFullPlantInfo(res.data);
    } catch (error) {
      console.log("Nu am putut aduce detaliile complete:", error);
    } finally {
      setIsLoadingInfo(false);
    }
  };

  const handleDeletePlant = (plantId: number) => {
    if (!isUserAdmin) return; 

    Alert.alert(
      "Confirmare Ștergere",
      "Ești sigur că vrei să ștergi definitiv această plantă din Enciclopedie?",
      [
        { text: "Anulează", style: "cancel" },
        {
          text: "Șterge",
          style: "destructive",
          onPress: async () => {
            try {
              await api.delete(`/admin/plants/${plantId}`);
              Alert.alert("Succes", "Planta a fost ștearsă definitiv!");
              setSelectedPlant(null);
              fetchPlants(); // Reîncărcăm lista generală
            } catch (error) {
              Alert.alert("Eroare", "Nu poți șterge planta. Asigură-te că ești logat ca Admin.");
            }
          }
        }
      ]
    );
  };

  const renderPlantCard = ({ item }: { item: Plant }) => {
    const imageUrl = item.image_url 
      ? { uri: item.image_url } 
      : { uri: 'https://via.placeholder.com/150/2e7d32/FFFFFF?text=Fara+Poza' };

    return (
      <TouchableOpacity style={styles.card} onPress={() => handleSelectPlant(item)}>
        <Image source={imageUrl} style={styles.cardImage} />
        <View style={styles.cardContent}>
          <Text style={styles.plantName}>{item.name_ro || "Nume Necunoscut"}</Text>
          <Text style={styles.scientificName}>{item.name_latin || "Specie Necunoscută"}</Text>
          <Text style={styles.tapToRead}>Apasă pentru detalii 📖</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const getSafeText = (text: string | null | undefined, fallback: string) => {
    if (!text || text.trim() === '') return fallback;
    return text;
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Enciclopedia Plantelor 🌿</Text>
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
          ListEmptyComponent={<Text style={styles.emptyText}>Nu există nicio plantă în baza de date.</Text>}
        />
      )}

      {/* MODAL DETALII (Arhitectură nouă, la fel ca pe Hartă) */}
      <Modal 
        visible={!!selectedPlant} 
        animationType="slide" 
        transparent={true}
        onRequestClose={() => setSelectedPlant(null)}
      >
        <View style={styles.modalOverlay}>
          {/* Fundal apăsabil pentru închidere */}
          <TouchableOpacity 
            style={StyleSheet.absoluteFill} 
            activeOpacity={1} 
            onPress={() => setSelectedPlant(null)} 
          />

          <View style={styles.modalContent}>
            {selectedPlant && (
              <>
                <Text style={styles.modalTitle}>{selectedPlant.name_ro || "Nume Necunoscut"}</Text>
                <Text style={[styles.scientificName, {fontSize: 18, marginBottom: 15, textAlign: 'center'}]}>
                  {selectedPlant.name_latin || "Specie Necunoscută"}
                </Text>
                
                <ScrollView 
                  style={styles.scrollArea} 
                  showsVerticalScrollIndicator={true}
                  contentContainerStyle={{ paddingBottom: 20 }}
                >
                  <Image 
                    source={selectedPlant.image_url ? { uri: selectedPlant.image_url } : { uri: 'https://via.placeholder.com/400x300/e0e0e0/888888?text=Fara+Poza' }} 
                    style={styles.modalImage} 
                    resizeMode="cover"
                  />
                  
                  {/* Zona de descărcare date */}
                  {isLoadingInfo ? (
                     <View style={{padding: 20, alignItems: 'center'}}>
                       <ActivityIndicator size="small" color="#2e7d32" />
                       <Text style={{color: '#666', marginTop: 10, fontSize: 12}}>Aducem filele enciclopediei...</Text>
                     </View>
                  ) : fullPlantInfo ? (
                    <View style={styles.encyclopediaSection}>
                      <Text style={styles.sectionSubtitle}>📖 Descriere:</Text>
                      <Text style={styles.sectionText}>
                        {getSafeText(fullPlantInfo.description, "Informația nu a fost adăugată încă.")}
                      </Text>

                      <Text style={styles.sectionSubtitle}>🌿 Părți utilizabile:</Text>
                      <Text style={styles.sectionText}>
                         {getSafeText(fullPlantInfo.usable_parts, "Nu sunt specificate.")}
                      </Text>

                      <Text style={styles.sectionSubtitle}>✅ Beneficii pentru sănătate:</Text>
                      <Text style={styles.sectionText}>
                         {getSafeText(fullPlantInfo.health_benefits, "Nu au fost documentate beneficii specifice.")}
                      </Text>

                      <Text style={styles.sectionSubtitle}>⚠️ Contraindicații:</Text>
                      <Text style={[styles.sectionText, {backgroundColor: '#ffebee', color: '#c62828'}]}>
                        {getSafeText(fullPlantInfo.contraindications, "Nu sunt cunoscute contraindicații. Consultă un medic.")}
                      </Text>
                    </View>
                  ) : (
                    <Text style={{textAlign: 'center', color: '#999', marginTop: 20}}>
                      Nu am putut încărca detaliile.
                    </Text>
                  )}
                </ScrollView>

                <View style={styles.modalButtonsRow}>
                  <TouchableOpacity style={[styles.actionButton, {backgroundColor: '#2e7d32'}]} onPress={() => setSelectedPlant(null)}>
                    <Text style={styles.actionButtonText}>Închide</Text>
                  </TouchableOpacity>

                  {isUserAdmin && (
                    <TouchableOpacity style={[styles.actionButton, {backgroundColor: '#d32f2f'}]} onPress={() => handleDeletePlant(selectedPlant.id)}>
                      <Text style={styles.actionButtonText}>🗑️ Șterge</Text>
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
  header: { 
    paddingTop: 50, 
    paddingBottom: 20, 
    paddingHorizontal: 20,
    backgroundColor: '#fff', 
    borderBottomLeftRadius: 30, 
    borderBottomRightRadius: 30, 
    shadowColor: '#2e7d32', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.05, shadowRadius: 20, elevation: 8, zIndex: 10
  },
  headerTitle: { fontSize: 26, fontWeight: '900', color: '#1b5e20', textAlign: 'left', letterSpacing: -0.5 },
  listContainer: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 100 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { textAlign: 'center', marginTop: 50, color: '#666', fontSize: 16 },
  card: { backgroundColor: '#fff', borderRadius: 20, marginBottom: 15, overflow: 'hidden', flexDirection: 'row', shadowColor: '#000', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 3 },
  cardImage: { width: 100, height: 100, borderRadius: 15, margin: 10 },
  cardContent: { flex: 1, padding: 15, paddingLeft: 5, justifyContent: 'center' },
  plantName: { fontSize: 18, fontWeight: '800', color: '#2e7d32', marginBottom: 2 },
  scientificName: { fontSize: 13, fontStyle: 'italic', color: '#888', marginBottom: 6 },
  tapToRead: { fontSize: 11, color: '#A1887F', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
  
  // Stiluri actualizate pentru Modal (la fel ca la Hartă)
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalContent: { 
    backgroundColor: '#fff', 
    borderTopLeftRadius: 30, 
    borderTopRightRadius: 30, 
    paddingHorizontal: 25, 
    paddingTop: 25,
    paddingBottom: 40, // Deasupra barei iPhone
    maxHeight: '88%', 
    elevation: 20 
  },
  modalTitle: { fontSize: 26, fontWeight: '900', color: '#1b5e20', marginBottom: 2, textAlign: 'center' },
  
  scrollArea: { 
    flexShrink: 1, 
    marginBottom: 15 
  },
  
  modalImage: { width: '100%', height: 220, borderRadius: 25, marginBottom: 15, backgroundColor: '#f5f5f5' },
  
  encyclopediaSection: { marginTop: 5 },
  sectionSubtitle: { fontSize: 12, fontWeight: '800', color: '#2e7d32', marginTop: 10, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
  sectionText: { fontSize: 14, color: '#444', lineHeight: 20, backgroundColor: '#F9FBE7', padding: 12, borderRadius: 12, overflow: 'hidden' },
  
  modalButtonsRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 10, paddingTop: 15, borderTopWidth: 1, borderTopColor: '#eee' },
  actionButton: { flex: 1, padding: 16, borderRadius: 15, alignItems: 'center' },
  actionButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});