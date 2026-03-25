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
  container: { 
    flex: 1, 
    backgroundColor: '#F1F8E9' // Rămânem pe verdele tău soft
  }, 
  
  header: { 
    paddingTop: 60, // Spațiu pentru notch
    paddingBottom: 25, 
    paddingHorizontal: 20,
    backgroundColor: '#fff', 
    borderBottomLeftRadius: 35, 
    borderBottomRightRadius: 35, 
    // Umbră mai fină și mai lungă pentru profunzime
    shadowColor: '#2e7d32',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 8,
      zIndex: 10
  },

  headerTitle: { 
    fontSize: 28, 
    fontWeight: '900', // Extra bold pentru impact
    color: '#1b5e20', 
    textAlign: 'left', // Alinierea la stânga e mai modernă
    letterSpacing: -0.5
  },

  listContainer: { 
    paddingHorizontal: 20, 
    paddingTop: 20,
    paddingBottom: 100 // Spațiu pentru Tab Bar-ul plutitor
  },

  card: {
    backgroundColor: '#fff',
    borderRadius: 24, // Mai rotunjit = mai "friendly"
    marginBottom: 20,
    overflow: 'hidden',
    flexDirection: 'row',
    // Umbră stil "Floating"
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(46, 125, 50, 0.05)', // Bordură verde aproape invizibilă
  },

  cardImage: { 
    width: 110, 
    height: 110,
    borderRadius: 20,
    margin: 10 // Imaginea "plutește" în interiorul cardului
  },

  cardContent: { 
    flex: 1, 
    padding: 15, 
    paddingLeft: 5,
    justifyContent: 'center' 
  },

  plantName: { 
    fontSize: 20, 
    fontWeight: '800', 
    color: '#2e7d32',
    marginBottom: 4
  },

  scientificName: { // Adăugat pentru rutele din Postman
    fontSize: 13,
    fontStyle: 'italic',
    color: '#888',
    marginBottom: 8
  },

  tapToRead: { 
    fontSize: 12, 
    color: '#A1887F', // Accent maro-pământiu
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1
  },
  
  // Stiluri Modal (Bottom Sheet Style)
  modalOverlay: { 
    flex: 1, 
    backgroundColor: 'rgba(27, 94, 32, 0.4)', // Overlay cu tentă verde
    justifyContent: 'flex-end' 
  },

  modalContent: { 
    backgroundColor: '#fff', 
    borderTopLeftRadius: 40, 
    borderTopRightRadius: 40, 
    padding: 30,
    maxHeight: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 20
  },

  modalImage: { 
    width: '100%', 
    height: 250, 
    borderRadius: 30, 
    marginBottom: 20 
  },

  modalTitle: { 
    fontSize: 26, 
    fontWeight: '900', 
    color: '#1b5e20', 
    marginBottom: 5 
  },

  sectionSubtitle: { 
    fontSize: 14, 
    fontWeight: '800', 
    color: '#2e7d32', 
    marginTop: 20, 
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1.5
  },

  sectionText: { 
    fontSize: 16, 
    color: '#444', 
    lineHeight: 24, // Mai mult spațiu între rânduri pentru citire ușoară
    backgroundColor: '#F9FBE7', // Fundal discret pentru text
    padding: 15,
    borderRadius: 15
  },

  closeButton: { 
    backgroundColor: '#2e7d32', 
    padding: 20, 
    borderRadius: 20, 
    alignItems: 'center', 
    marginTop: 30,
    marginBottom: 20,
    // Efect de "Glow" pe buton
    shadowColor: '#2e7d32',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8
  },

  closeButtonText: { 
    color: '#fff', 
    fontSize: 18, 
    fontWeight: 'bold' 
  }
});