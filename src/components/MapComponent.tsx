import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Alert, SafeAreaView, Modal, FlatList } from 'react-native';
import { WebView } from 'react-native-webview';
import * as Location from 'expo-location'; 
import { useLocation } from '../services/LocationContext';
import { MOCK_PLANTS } from '../services/plantData';
import api from '../services/api'; 

export default function MapComponent() {
  const webViewRef = useRef<WebView>(null);
  const [selectedLocation, setSelectedLocation] = useState<{lat: number, lng: number} | null>(null);
  const [markers, setMarkers] = useState<any[]>([]);
  const [activeFilterName, setActiveFilterName] = useState('Toate');
  const [activeFilterId, setActiveFilterId] = useState<string | number | null>(null);
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  
  const { setCoords } = useLocation();

  // --- GET: Aduce punctele pe hartă ---
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
      const pointsStr = JSON.stringify(response.data);
      
      if (webViewRef.current) {
        webViewRef.current.injectJavaScript(`updateMarkers('${pointsStr}'); true;`);
      }
      Alert.alert("Harta Actualizată", `Am găsit ${response.data.length} puncte.`);
    } catch (error) {
      console.error("Eroare Scan:", error);
    }
  };

  // --- DELETE: Ștergere pentru Admin ---
  const handleDeletePOI = (poiId: number) => {
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
              webViewRef.current?.injectJavaScript(`updateMarkers('${JSON.stringify(updated)}'); true;`);
              Alert.alert("Succes", "Punctul a fost șters.");
            } catch (error) {
              Alert.alert("Eroare", "Eroare la ștergere. Ești admin?");
            }
          }
        }
      ]
    );
  };

  // --- PREGĂTIRE PUNCT (Fără POST) ---
  const handleSetPoint = () => {
    if (!selectedLocation) return;

    // Salvăm doar local în memorie (LocationContext)
    setCoords(selectedLocation); 
    
    Alert.alert(
      "📍 Locație Pregătită!", 
      "Am memorat acest punct. Mergi la tab-ul 'Scanează' pentru a face o poză plantei și a salva totul pe hartă."
    );
  };

  // --- HTML HARTĂ ---
  const mapHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
      <style> body { padding: 0; margin: 0; } #map { height: 100vh; width: 100vw; } </style>
    </head>
    <body>
      <div id="map"></div>
      <script>
        var map = L.map('map').setView([45.4353, 28.0080], 13);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
        var currentMarker = null;
        var markersLayer = L.layerGroup().addTo(map);

        function updateMarkers(locationsJson) {
          markersLayer.clearLayers();
          const locations = JSON.parse(locationsJson);
          locations.forEach(loc => {
            const lat = loc.lat || loc.latitude;
            const lng = loc.lng || loc.longitude;
            
            const popupContent = "<b>" + (loc.plant?.name_ro || "Plantă") + "</b><br>" +
                                 "<button onclick=\\"window.ReactNativeWebView.postMessage(JSON.stringify({type: 'delete_poi', id: " + loc.id + "}))\\" " +
                                 "style='margin-top:10px; color:red; border:1px solid red; background:white; padding:5px; border-radius:4px;'>Șterge (Admin)</button>";

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

  const handleMessage = (event: any) => {
    const data = JSON.parse(event.nativeEvent.data);
    if (data.type === 'map_click') setSelectedLocation({ lat: data.lat, lng: data.lng });
    if (data.type === 'delete_poi') handleDeletePOI(data.id);
  };

  const getCurrentLocation = async () => {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return;
    let location = await Location.getCurrentPositionAsync({});
    setSelectedLocation({ lat: location.coords.latitude, lng: location.coords.longitude });
    webViewRef.current?.injectJavaScript(`setViewAndMarker(${location.coords.latitude}, ${location.coords.longitude}); true;`);
  };

  useEffect(() => { fetchNearbyPOIs(5); }, [activeFilterId]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.filterArea}>
        <TouchableOpacity style={styles.mainFilterButton} onPress={() => setIsMenuVisible(true)}>
          <Text style={styles.mainFilterText} numberOfLines={1}>🔍 {activeFilterName}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.scanButton} onPress={() => fetchNearbyPOIs(5)}>
          <Text style={styles.scanButtonText}>📡 Scan 5km</Text>
        </TouchableOpacity>
      </View>

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
  buttonContainer: { position: 'absolute', bottom: 120, right: 20, gap: 15 },
  gpsButton: { backgroundColor: '#fff', width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', elevation: 8 },
  setPointButton: { backgroundColor: '#2e7d32', width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', elevation: 8 }
});