import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Alert, SafeAreaView, Modal, FlatList, Image, ScrollView, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';
import * as Location from 'expo-location'; 
import { useLocation } from '../services/LocationContext';
import { MOCK_PLANTS } from '../services/plantData';
import api from '../services/api'; 

interface MapProps {
  isAdmin?: boolean;
}

export default function MapComponent({ isAdmin = false }: MapProps) {
  const webViewRef = useRef<WebView>(null);
  const [selectedLocation, setSelectedLocation] = useState<{lat: number, lng: number} | null>(null);
  const [markers, setMarkers] = useState<any[]>([]);
  const [activeFilterName, setActiveFilterName] = useState('Toate');
  const [activeFilterId, setActiveFilterId] = useState<string | number | null>(null);
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  
  // State-uri pentru Modalul de Detalii
  const [selectedPoiDetails, setSelectedPoiDetails] = useState<any | null>(null);
  const [fullPlantInfo, setFullPlantInfo] = useState<any | null>(null);
  const [isLoadingInfo, setIsLoadingInfo] = useState(false);
  
  const { setCoords } = useLocation();

  const fetchNearbyPOIs = async (radius: number = 5) => {
    try {
      const lat = selectedLocation?.lat || 45.4353;
      const lng = selectedLocation?.lng || 28.0079;

      let url = `/poi?lat=${lat}&lng=${lng}&radius_km=${radius}`;
      if (activeFilterId && activeFilterId !== 'all') {
        url += `&plant_id=${activeFilterId}`;
      }

      const response = await api.get(url);
      setMarkers(response.data);
      
      const dataForWebview = {
        points: response.data,
        isAdmin: isAdmin
      };
      
      const pointsStr = JSON.stringify(dataForWebview);
      
      if (webViewRef.current) {
        webViewRef.current.injectJavaScript(`updateMarkers('${pointsStr}'); true;`);
      }
    } catch (error) {
      console.error("Eroare Scan:", error);
    }
  };

  const handleDeletePOI = (poiId: number) => {
    if (!isAdmin) return;
    
    Alert.alert(
      "Confirmare Admin",
      "Sigur vrei să elimini acest punct de pe hartă?",
      [
        { text: "Anulează", style: "cancel" },
        { 
          text: "Șterge", 
          style: "destructive", 
          onPress: async () => {
            try {
              await api.delete(`/admin/poi/${poiId}`);
              const updated = markers.filter(m => m.id !== poiId);
              setMarkers(updated);
              
              const dataForWebview = { points: updated, isAdmin: isAdmin };
              webViewRef.current?.injectJavaScript(`updateMarkers('${JSON.stringify(dataForWebview)}'); true;`);
              
              setSelectedPoiDetails(null); 
              Alert.alert("Succes", "Punctul a fost șters.");
            } catch (error) {
              Alert.alert("Eroare", "Eroare la ștergere. Verifică drepturile.");
            }
          }
        }
      ]
    );
  };

  const handleSetPoint = () => {
    if (!selectedLocation) return;
    setCoords(selectedLocation); 
    Alert.alert(
      "📍 Locație Pregătită!", 
      "Am memorat acest punct. Mergi la tab-ul 'Scanează' pentru a face o poză plantei și a salva totul pe hartă."
    );
  };

  const mapHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
      <style> 
        body { padding: 0; margin: 0; } 
        #map { height: 100vh; width: 100vw; } 
        .custom-popup { text-align: center; font-family: sans-serif; }
        .popup-title { font-weight: bold; font-size: 14px; color: #2e7d32; margin-bottom: 2px; }
        .popup-user { font-size: 11px; color: #666; margin-bottom: 10px; }
        .popup-btn { background: #2e7d32; color: white; border: none; padding: 6px 12px; border-radius: 6px; cursor: pointer; width: 100%; font-weight: bold; }
      </style>
    </head>
    <body>
      <div id="map"></div>
      <script>
        var map = L.map('map', { zoomControl: false }).setView([45.4353, 28.0080], 13);
        L.control.zoom({ position: 'topleft' }).addTo(map);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
        var currentMarker = null;
        var markersLayer = L.layerGroup().addTo(map);

        function updateMarkers(dataJson) {
          markersLayer.clearLayers();
          const data = JSON.parse(dataJson);
          const locations = data.points;
          
          locations.forEach(loc => {
            const lat = loc.lat || loc.latitude;
            const lng = loc.lng || loc.longitude;
            
            let extName = null;
            if (loc.comment && loc.comment.includes(': ')) {
                extName = loc.comment.split(': ')[1];
            }
            const plantName = loc.plant?.name_ro || loc.plant?.name || extName || "Plantă Scanată";
            const userName = loc.user?.username || loc.user?.email || loc.username || loc.email || "Anonim";
            
            const popupContent = 
              "<div class='custom-popup'>" +
                "<div class='popup-title'>🌿 " + plantName + "</div>" +
                "<div class='popup-user'>📍 adăugat de " + userName + "</div>" +
                "<button class='popup-btn' onclick='window.ReactNativeWebView.postMessage(JSON.stringify({type: \\"show_details\\", poi: " + JSON.stringify(loc) + "}))'>Vezi Detalii & Poză</button>" +
              "</div>";

            L.marker([lat, lng]).addTo(markersLayer).bindPopup(popupContent);
          });
        }

        map.on('click', function(e) {
          if (currentMarker) { currentMarker.setLatLng(e.latlng); } 
          else { currentMarker = L.marker(e.latlng).addTo(map); }
          window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'map_click', lat: e.latlng.lat, lng: e.latlng.lng }));
        });

        function setViewAndMarker(lat, lng) {
          map.setView([lat, lng], 16);
          if (currentMarker) { currentMarker.setLatLng([lat, lng]); } 
          else { currentMarker = L.marker([lat, lng]).addTo(map); }
        }
      </script>
    </body>
    </html>
  `;

  // === AICI SE ÎNTÂMPLĂ MAGIA CU DATELE DE LA COLEGUL TĂU ===
  const handleMessage = async (event: any) => {
    const data = JSON.parse(event.nativeEvent.data);
    
    if (data.type === 'map_click') {
      setSelectedLocation({ lat: data.lat, lng: data.lng });
    }
    
    if (data.type === 'show_details') {
      // 1. Setăm imediat POI-ul ca să se deschidă Modalul
      setSelectedPoiDetails(data.poi);
      setFullPlantInfo(null); // Resetăm datele vechi
      
      // 2. Facem request-ul direct către /plants/{id}
      if (data.poi.plant_id) {
        setIsLoadingInfo(true);
        try {
          const res = await api.get(`/plants/${data.poi.plant_id}`);
          setFullPlantInfo(res.data); // Aici se salvează descrierea, beneficiile, etc.
        } catch (err) {
          console.log("Nu am putut aduce detaliile plantei de la server:", err);
        } finally {
          setIsLoadingInfo(false);
        }
      }
    }
  };

  const getCurrentLocation = async () => {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return;
    let location = await Location.getCurrentPositionAsync({});
    setSelectedLocation({ lat: location.coords.latitude, lng: location.coords.longitude });
    webViewRef.current?.injectJavaScript(`setViewAndMarker(${location.coords.latitude}, ${location.coords.longitude}); true;`);
  };

  useEffect(() => { fetchNearbyPOIs(5); }, [activeFilterId]);

  const getDisplayPlantName = (poi: any) => {
    // Dacă am descărcat detalii complete, luăm numele oficial de acolo
    if (fullPlantInfo?.name_ro) return fullPlantInfo.name_ro;
    if (poi.plant?.name_ro) return poi.plant.name_ro;
    if (poi.comment && poi.comment.includes(': ')) return poi.comment.split(': ')[1];
    return "Plantă Scanată";
  };

  const getDisplayUserName = (poi: any) => {
    return poi.user?.username || poi.user?.email || poi.username || poi.email || "Anonim";
  };

  // Funcție de siguranță pentru textele goale
  const getSafeText = (text: string | null | undefined, fallback: string) => {
    if (!text || text.trim() === '') return fallback;
    return text;
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Filtre Sus */}
      <View style={styles.filterArea}>
        <TouchableOpacity style={styles.mainFilterButton} onPress={() => setIsMenuVisible(true)}>
          <Text style={styles.mainFilterText} numberOfLines={1}>🔍 {activeFilterName}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.scanButton} onPress={() => fetchNearbyPOIs(5)}>
          <Text style={styles.scanButtonText}>📡 Scan 5km</Text>
        </TouchableOpacity>
      </View>

      {/* Modal Filtre */}
      <Modal visible={isMenuVisible} animationType="fade" transparent={true}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setIsMenuVisible(false)}>
          <View style={styles.menuContent}>
            <Text style={styles.menuTitle}>Filtrează Harta:</Text>
            <FlatList
              data={[{ id: 'all', name: 'Toate Plantele' }, ...MOCK_PLANTS]} 
              keyExtractor={(item: any) => item.id.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  style={styles.menuItem} 
                  onPress={() => {
                    if (item.id === 'all') {
                      setActiveFilterName('Toate');
                      setActiveFilterId(null);
                    } else {
                      setActiveFilterName(item.name);
                      setActiveFilterId(item.id);
                    }
                    setIsMenuVisible(false);
                  }}
                >
                  <Text style={[styles.menuItemText, activeFilterName === (item.name === 'Toate Plantele' ? 'Toate' : item.name) && styles.activeMenuText]}>
                    {item.name}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>

      {/* MODAL DETALII PIN & ENCICLOPEDIE */}
      <Modal 
        visible={!!selectedPoiDetails} 
        animationType="slide" 
        transparent={true}
        onRequestClose={() => setSelectedPoiDetails(null)}
      >
        <View style={styles.detailsModalOverlay}>
          
          {/* 1. Butonul invizibil de pe tot ecranul care închide meniul la click în afară */}
          <TouchableOpacity 
            style={StyleSheet.absoluteFill} 
            activeOpacity={1} 
            onPress={() => setSelectedPoiDetails(null)} 
          />

          {/* 2. Chenarul alb - Acum e un VIEW normal, nu Touchable, deci respectă perfect înălțimea! */}
          <View style={styles.detailsModalContent}>
            {selectedPoiDetails && (
              <>
                <Text style={styles.detailsTitle}>{getDisplayPlantName(selectedPoiDetails)}</Text>
                <Text style={styles.detailsUser}>📍 Adăugat de: {getDisplayUserName(selectedPoiDetails)}</Text>
                
                {/* 3. ScrollView cu flexShrink forțat */}
                <ScrollView 
                  style={styles.scrollArea} 
                  showsVerticalScrollIndicator={true}
                  contentContainerStyle={{ paddingBottom: 20 }}
                >
                  <View style={styles.imageContainer}>
                    <Image 
                      source={selectedPoiDetails.image_url ? { uri: selectedPoiDetails.image_url } : { uri: 'https://via.placeholder.com/400x300/e0e0e0/888888?text=Fara+Poza' }} 
                      style={styles.detailsImage} 
                      resizeMode="cover"
                    />
                  </View>

                  <View style={styles.commentBox}>
                    <Text style={styles.commentLabel}>📝 Notițe utilizator:</Text>
                    <Text style={styles.commentText}>{selectedPoiDetails.comment || "Niciun comentariu."}</Text>
                  </View>

                  {/* ZONA DE DATE DE LA SERVER */}
                  {isLoadingInfo ? (
                    <View style={{padding: 20, alignItems: 'center'}}>
                      <ActivityIndicator size="small" color="#2e7d32" />
                      <Text style={{color: '#666', marginTop: 10, fontSize: 12}}>Se încarcă detaliile plantei...</Text>
                    </View>
                  ) : fullPlantInfo ? (
                    <View style={styles.encyclopediaSection}>
                      <Text style={styles.encyclopediaHeader}>📚 Date din Enciclopedie</Text>

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
                  ) : null}
                </ScrollView>

                {/* 4. Butoanele Fixe - Vor sta MEREU jos, indiferent cât de mult text e sus */}
                <View style={styles.actionButtonsRow}>
                  <TouchableOpacity style={[styles.actionBtn, {backgroundColor: '#2e7d32'}]} onPress={() => setSelectedPoiDetails(null)}>
                    <Text style={styles.actionBtnText}>Închide</Text>
                  </TouchableOpacity>

                  {isAdmin && (
                    <TouchableOpacity style={[styles.actionBtn, {backgroundColor: '#d32f2f'}]} onPress={() => handleDeletePOI(selectedPoiDetails.id)}>
                      <Text style={styles.actionBtnText}>🗑️ Șterge Pin</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
      <WebView ref={webViewRef} source={{ html: mapHTML }} onMessage={handleMessage} javaScriptEnabled={true} />
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.gpsButton} onPress={getCurrentLocation}>
          <Text style={{fontSize: 24}}>🎯</Text>
        </TouchableOpacity>
        {selectedLocation && (
          <TouchableOpacity style={styles.setPointButton} onPress={handleSetPoint}>
            <Text style={{fontSize: 24, color: '#fff'}}>📍</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  filterArea: { position: 'absolute', top: 70, left: 20, right: 20, flexDirection: 'row', justifyContent: 'center', zIndex: 10 },
  mainFilterButton: { backgroundColor: '#fff', padding: 12, borderRadius: 25, elevation: 5, marginRight: 10, minWidth: 120 },
  scanButton: { backgroundColor: '#fff', padding: 12, borderRadius: 25, elevation: 5 },
  mainFilterText: { color: '#2e7d32', fontWeight: 'bold', textAlign: 'center' },
  scanButtonText: { color: '#2e7d32', fontWeight: 'bold', textAlign: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  menuContent: { width: '80%', backgroundColor: '#fff', borderRadius: 20, padding: 20, maxHeight: '60%' },
  menuTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15, textAlign: 'center' },
  menuItem: { paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#eee' },
  menuItemText: { fontSize: 16, color: '#444' },
  activeMenuText: { color: '#2e7d32', fontWeight: 'bold' },
  buttonContainer: { position: 'absolute', bottom: 120, right: 20, gap: 15, zIndex: 10 },
  gpsButton: { backgroundColor: '#fff', width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', elevation: 8 },
  setPointButton: { backgroundColor: '#2e7d32', width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', elevation: 8 },
  detailsModalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  detailsModalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 25,
    paddingTop: 25,
    paddingBottom: 40, // Asta ridică butoanele peste bara de jos a iPhone-ului!
    maxHeight: '88%',
  }, // Limitează cardul alb să nu iasă din ecran},
  detailsTitle: { fontSize: 24, fontWeight: '900', color: '#1b5e20', textAlign: 'center', marginBottom: 2 },
  detailsUser: { fontSize: 13, color: '#666', textAlign: 'center', marginBottom: 15, fontStyle: 'italic' },
  scrollArea: { flexShrink: 1, marginBottom: 15 },
  imageContainer: { width: '100%', height: 220, borderRadius: 15, overflow: 'hidden', marginBottom: 20, backgroundColor: '#f5f5f5' },
  detailsImage: { width: '100%', height: '100%' },
  commentBox: { backgroundColor: '#f5f5f5', padding: 15, borderRadius: 15, marginBottom: 15, borderWidth: 1, borderColor: '#eee' },
  commentLabel: { fontSize: 12, fontWeight: 'bold', color: '#666', marginBottom: 5, textTransform: 'uppercase' },
  commentText: { fontSize: 15, color: '#333', fontStyle: 'italic' },
  encyclopediaSection: { marginTop: 10 },
  encyclopediaHeader: { fontSize: 18, fontWeight: 'bold', color: '#2e7d32', marginBottom: 10, textAlign: 'center', borderBottomWidth: 1, borderBottomColor: '#eee', paddingBottom: 10 },
  sectionSubtitle: { fontSize: 12, fontWeight: '800', color: '#2e7d32', marginTop: 10, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
  sectionText: { fontSize: 14, color: '#444', lineHeight: 20, backgroundColor: '#F9FBE7', padding: 12, borderRadius: 12, overflow: 'hidden' },
  actionButtonsRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 10, paddingTop: 15, borderTopWidth: 1, borderTopColor: '#eee' },
  actionBtn: { flex: 1, padding: 16, borderRadius: 15, alignItems: 'center' },
  actionBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 }
});