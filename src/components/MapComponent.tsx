import React, { useState, useRef } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Alert, SafeAreaView, Modal, FlatList } from 'react-native';
import { WebView } from 'react-native-webview';
import * as Location from 'expo-location'; 
import { useLocation } from '../services/LocationContext';
import { MOCK_LOCATIONS, MOCK_PLANTS } from '../services/plantData';
import api from '../services/api'; // Importăm serviciul API creat anterior

export default function MapComponent() {
  const webViewRef = useRef<WebView>(null);
  const [selectedLocation, setSelectedLocation] = useState<{lat: number, lng: number} | null>(null);
  const [activeFilter, setActiveFilter] = useState('Toate');
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const { setCoords } = useLocation();

  // --- LOGICA PENTRU SERVER (API) ---

  // Funcția mutată ÎN INTERIORUL componentei pentru a avea acces la state-uri
  const fetchNearbyPOIs = async (radius: number = 5) => {
    try {
      const lat = selectedLocation?.lat || 45.4353;
      const lng = selectedLocation?.lng || 28.0079;

      // Cerere reală către FastAPI folosind parametrii din Postman
      const response = await api.get(`/poi`, {
        params: {
          lat: lat,
          lng: lng,
          radius_km: radius
        }
      });

      const points = JSON.stringify(response.data);
      webViewRef.current?.injectJavaScript(`updateMarkers('${points}'); true;`);
      
      Alert.alert("Scanare Completă", `Am găsit ${response.data.length} puncte de interes în raza de ${radius} km.`);
    } catch (error) {
      console.error(error);
      Alert.alert("Eroare Server", "Asigură-te că backend-ul este pornit și IP-ul în api.ts este corect.");
    }
  };

  // --- LOGICA HARTĂ ---

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
      </style>
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
            L.marker([loc.lat, loc.lng]).addTo(markersLayer).bindPopup("<b>" + (loc.name || loc.plant?.name || "Plantă") + "</b>");
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

  const handleFilterSelect = (filterName: string) => {
    setActiveFilter(filterName);
    setIsMenuVisible(false);
    const filtered = filterName === 'Toate' 
      ? MOCK_LOCATIONS 
      : MOCK_LOCATIONS.filter(l => l.name === filterName);
    webViewRef.current?.injectJavaScript(`updateMarkers('${JSON.stringify(filtered)}'); true;`);
  };

  const handleMessage = (event: any) => {
    const data = JSON.parse(event.nativeEvent.data);
    if (data.type === 'map_click') { setSelectedLocation({ lat: data.lat, lng: data.lng }); }
  };

  const getCurrentLocation = async () => {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return;
    let location = await Location.getCurrentPositionAsync({});
    const { latitude, longitude } = location.coords;
    setSelectedLocation({ lat: latitude, lng: longitude });
    webViewRef.current?.injectJavaScript(`setViewAndMarker(${latitude}, ${longitude}); true;`);
  };

  const handleSetPoint = () => {
    if (selectedLocation) {
      setCoords(selectedLocation);
      Alert.alert("Locație Salvată!", "Mergi la tab-ul 'Scanează'.");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.filterArea}>
        {/* Butonul de Filtru Plantă */}
        <TouchableOpacity style={styles.mainFilterButton} onPress={() => setIsMenuVisible(true)}>
          <Text style={styles.mainFilterText} numberOfLines={1} ellipsizeMode='tail'>🔍 {activeFilter}</Text>
        </TouchableOpacity>

        {/* Butonul nou pentru Scanare Spațială (5km) */}
        <TouchableOpacity style={styles.scanButton} onPress={() => fetchNearbyPOIs(5)}>
          <Text style={styles.scanButtonText}>📡 Scan 5km</Text>
        </TouchableOpacity>
      </View>

      <Modal visible={isMenuVisible} animationType="fade" transparent={true}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setIsMenuVisible(false)}>
          <View style={styles.menuContent}>
            <Text style={styles.menuTitle}>Alege planta:</Text>
            <FlatList
              data={['Toate', ...MOCK_PLANTS.map(p => p.name)]}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.menuItem} onPress={() => handleFilterSelect(item)}>
                  <Text style={[styles.menuItemText, activeFilter === item && styles.activeMenuText]}>{item}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>

      <WebView
        ref={webViewRef}
        source={{ html: mapHTML }}
        onMessage={handleMessage}
        onLoad={() => webViewRef.current?.injectJavaScript(`updateMarkers('${JSON.stringify(MOCK_LOCATIONS)}'); true;`)}
        javaScriptEnabled={true}
        domStorageEnabled={true}
      />
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.gpsButton} onPress={getCurrentLocation}>
          <Text style={styles.buttonText}>📍 Locația Mea</Text>
        </TouchableOpacity>
        {selectedLocation && (
          <TouchableOpacity style={styles.setPointButton} onPress={handleSetPoint}>
            <Text style={styles.buttonText}>✅ Set Point</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  filterArea: {
    position: 'absolute',
    top: 70,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'center',
    zIndex: 10,
  },
  mainFilterButton: {
    backgroundColor: '#fff',
    padding: 12,
    paddingHorizontal: 15,
    borderRadius: 12,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#2e7d32',
    maxWidth: 150,
    marginRight: 10,
  },
  scanButton: {
    backgroundColor: '#007bff', // Albastru pentru Scanare
    padding: 12,
    borderRadius: 12,
    elevation: 5,
    minWidth: 100,
  },
  scanButtonText: { color: '#fff', fontWeight: 'bold', textAlign: 'center' },
  mainFilterText: { color: '#2e7d32', fontWeight: 'bold', fontSize: 14, textAlign: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  menuContent: {
    width: '80%',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    maxHeight: '60%',
    elevation: 10,
  },
  menuTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15, textAlign: 'center' },
  menuItem: { paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#eee' },
  menuItemText: { fontSize: 16, color: '#444' },
  activeMenuText: { color: '#2e7d32', fontWeight: 'bold' },
  buttonContainer: {
    position: 'absolute',
    bottom: 40,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-evenly',
  },
  gpsButton: { backgroundColor: '#fff', padding: 15, borderRadius: 25, elevation: 5 },
  setPointButton: { backgroundColor: '#2e7d32', padding: 15, borderRadius: 25, elevation: 5 },
  buttonText: { fontWeight: 'bold', color: '#333' }
});