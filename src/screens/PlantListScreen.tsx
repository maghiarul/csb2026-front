import React, { useState } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, Image, Modal, ScrollView, SafeAreaView } from 'react-native';


export default function PlantListScreen() {
  const [selectedPlant, setSelectedPlant] = useState<any>(null);

  // Cum arată un "card" de plantă în listă
  const renderPlantCard = ({ item }: { item: any }) => (
    <TouchableOpacity style={styles.card} onPress={() => setSelectedPlant(item)}>
      <Image source={{ uri: item.image }} style={styles.cardImage} />
      <SafeAreaView style={styles.cardContent}>
        <Text style={styles.plantName}>{item.name}</Text>
        <Text style={styles.tapToRead}>Apasă pentru detalii 📖</Text>
      </SafeAreaView>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.headerTitle}>Enciclopedia Plantelor 🌿</Text>
      

      {/* Pop-up-ul cu detalii complete (Modal) */}
      <Modal visible={!!selectedPlant} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedPlant && (
              <ScrollView showsVerticalScrollIndicator={false}>
                <Image source={{ uri: selectedPlant.image }} style={styles.modalImage} />
                <Text style={styles.modalTitle}>{selectedPlant.name}</Text>
                
                <Text style={styles.sectionSubtitle}>Părți utilizabile:</Text>
                <Text style={styles.sectionText}>{selectedPlant.partsUsed}</Text>

                <Text style={styles.sectionSubtitle}>Beneficii pentru sănătate:</Text>
                <Text style={styles.sectionText}>✅ {selectedPlant.benefits}</Text>

                <Text style={styles.sectionSubtitle}>Contraindicații:</Text>
                <Text style={styles.sectionText}>⚠️ {selectedPlant.contraindications}</Text>

                <TouchableOpacity 
                  style={styles.closeButton} 
                  onPress={() => setSelectedPlant(null)}
                >
                  <Text style={styles.closeButtonText}>Închide</Text>
                </TouchableOpacity>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f4f0' },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#2e7d32', textAlign: 'center', marginVertical: 20 },
  listContainer: { paddingHorizontal: 15, paddingBottom: 20 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 15,
    marginBottom: 15,
    overflow: 'hidden',
    elevation: 3, // Umbră pe Android
    shadowColor: '#000', // Umbră pe iOS
    shadowOpacity: 0.1,
    shadowRadius: 5,
    flexDirection: 'row',
  },
  cardImage: { width: 100, height: 100 },
  cardContent: { flex: 1, padding: 15, justifyContent: 'center' },
  plantName: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 5 },
  tapToRead: { fontSize: 12, color: '#2e7d32', fontStyle: 'italic' },
  
  // Stiluri Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { 
    backgroundColor: '#fff', 
    borderTopLeftRadius: 25, 
    borderTopRightRadius: 25, 
    padding: 25,
    maxHeight: '85%' 
  },
  modalImage: { width: '100%', height: 200, borderRadius: 15, marginBottom: 15 },
  modalTitle: { fontSize: 22, fontWeight: 'bold', color: '#2e7d32', marginBottom: 15 },
  sectionSubtitle: { fontSize: 16, fontWeight: 'bold', color: '#555', marginTop: 10, marginBottom: 5 },
  sectionText: { fontSize: 15, color: '#333', lineHeight: 22, marginBottom: 10 },
  closeButton: { 
    backgroundColor: '#2e7d32', 
    padding: 15, 
    borderRadius: 10, 
    alignItems: 'center', 
    marginTop: 20,
    marginBottom: 10
  },
  closeButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});