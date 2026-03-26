import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Alert, SafeAreaView, Modal, FlatList, Image, ScrollView, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';
import * as Location from 'expo-location'; 
import { Search, Radio, Target, MapPin, Trash2, Info, Leaf, CheckCircle2, AlertTriangle, BookOpen } from 'lucide-react-native';
import { useLocation } from '../services/LocationContext';
import api from '../services/api'; 

interface MapProps {
  isAdmin?: boolean;
  currentUserName?: string;
}

export default function MapComponent({ isAdmin = false, currentUserName = 'Utilizator' }: MapProps) {
  const webViewRef = useRef<WebView>(null);
  const [selectedLocation, setSelectedLocation] = useState<{lat: number, lng: number} | null>(null);
  const [markers, setMarkers] = useState<any[]>([]);
  const [activeFilterName, setActiveFilterName] = useState('Toate');
  const [activeFilterId, setActiveFilterId] = useState<string | number | null>(null);
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [allPlants, setAllPlants] = useState<any[]>([]); 
  const [selectedPoiDetails, setSelectedPoiDetails] = useState<any | null>(null);
  const [fullPlantInfo, setFullPlantInfo] = useState<any | null>(null);
  const [isLoadingInfo, setIsLoadingInfo] = useState(false);
  const [allUsers, setAllUsers] = useState<any[]>([]); 
  const { setCoords } = useLocation();

  useEffect(() => {
    const loadLookupData = async () => {
      try {
        const [plantsRes, usersRes] = await Promise.all([
          api.get('/plants'),
          api.get('/admin/users').catch(() => ({ data: [] })) 
        ]);
        setAllPlants(plantsRes.data);
        setAllUsers(usersRes.data);
      } catch (e) {
        console.log("Eroare la datele de lookup");
      }
    };
    loadLookupData();
  }, [currentUserName]); 

  useEffect(() => {
    if (markers.length >= 0) {
      const dataForWebview = {
        points: markers,
        isAdmin: isAdmin,
        allPlants: allPlants, 
        allUsers: allUsers,
        currentUserName: currentUserName
      };
      webViewRef.current?.injectJavaScript(`updateMarkers('${JSON.stringify(dataForWebview)}'); true;`);
    }
  }, [markers, allPlants, allUsers]);

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
    } catch (error: any) {
      Alert.alert("Eroare Scanare", error.message);
    }
  };

  const handleDeletePOI = (poiId: number) => {
    if (!isAdmin) return;
    Alert.alert("Confirmare Admin", "Ștergi acest punct?", [
      { text: "Anulează", style: "cancel" },
      { text: "Șterge", style: "destructive", onPress: async () => {
          try {
            await api.delete(`/admin/poi/${poiId}`);
            const updated = markers.filter(m => m.id !== poiId);
            setMarkers(updated);
            setSelectedPoiDetails(null); 
          } catch (error) { Alert.alert("Eroare", "Eroare la ștergere."); }
      }}
    ]);
  };

  const handleSetPoint = () => {
    if (!selectedLocation) return;
    setCoords(selectedLocation); 
    Alert.alert("Locație Pregătită!", "Am memorat acest punct. Mergi la tab-ul 'Scanează' pentru a salva totul pe hartă.");
  };

  const mapHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <link rel="stylesheet" href="https://unpkg.com/leaflet.markercluster@1.4.1/dist/MarkerCluster.css" />
      <link rel="stylesheet" href="https://unpkg.com/leaflet.markercluster@1.4.1/dist/MarkerCluster.Default.css" />
      <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
      <script src="https://unpkg.com/leaflet.markercluster@1.4.1/dist/leaflet.markercluster.js"></script>
      <style> body { padding: 0; margin: 0; } #map { height: 100vh; width: 100vw; } 
        .custom-popup { text-align: center; font-family: sans-serif; }
        .popup-title { font-weight: bold; font-size: 14px; color: #2e7d32; }
        .popup-btn { background: #2e7d32; color: white; border: none; padding: 6px 12px; border-radius: 6px; margin-top: 10px; cursor: pointer; }

        .leaf-marker {
            width: 32px; height: 32px; border-radius: 50% 50% 50% 0;
            background: linear-gradient(135deg, #4caf50, #2e7d32);
            position: absolute; transform: rotate(-45deg);
            left: 50%; top: 50%; margin: -16px 0 0 -16px; border: 2px solid #fff;
            box-shadow: 0 4px 12px rgba(0,0,0,0.35); display: flex; justify-content: center; align-items: center;
        }
        .leaf-marker::after { content: '🌿'; transform: rotate(45deg); font-size: 16px; }
        .target-marker { background: linear-gradient(135deg, #ff5252, #c62828); }
        .target-marker::after { content: '📍'; font-size: 16px; }
      </style>
    </head>
    <body>
      <div id="map"></div>
      <script>
        var map = L.map('map', { zoomControl: false }).setView([45.4353, 28.0080], 13);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
        
        var markersLayer = L.markerClusterGroup({ showCoverageOnHover: false, zoomToBoundsOnClick: true, spiderfyOnMaxZoom: true });
        map.addLayer(markersLayer);
        var currentClickMarker = null;

        const customIcon = L.divIcon({ className: 'custom-div-icon', html: "<div class='leaf-marker'></div>", iconSize: [32, 45], iconAnchor: [16, 45] });
        const targetIcon = L.divIcon({ className: 'custom-div-icon', html: "<div class='leaf-marker target-marker'></div>", iconSize: [32, 45], iconAnchor: [16, 45] });

        function updateMarkers(dataJson) {
          markersLayer.clearLayers();
          const data = JSON.parse(dataJson);
          const plantsDict = data.allPlants || [];
          const usersDict = data.allUsers || [];

          data.points.forEach(loc => {
            const matchedPlant = plantsDict.find(p => p.id === loc.plant_id);
            const matchedUser = usersDict.find(u => u.id === loc.user_id);
            const plantName = matchedPlant ? matchedPlant.name_ro : "Plantă Scanată";
            const userName = matchedUser ? matchedUser.username : (loc.user?.username || loc.username || "Utilizator");
            
            const popupContent = "<div class='custom-popup'><div class='popup-title'>🌿 " + plantName + "</div>" +
              "<div>📍 de " + userName + "</div>" +
              "<button class='popup-btn' onclick='window.ReactNativeWebView.postMessage(JSON.stringify({type: \\"show_details\\", poi: " + JSON.stringify(loc) + "}))'>Vezi Detalii</button></div>";

            L.marker([loc.latitude, loc.longitude], { icon: customIcon }).bindPopup(popupContent).addTo(markersLayer);
          });
        }

        map.on('click', function(e) {
          if (currentClickMarker) { currentClickMarker.setLatLng(e.latlng); }
          else { currentClickMarker = L.marker(e.latlng, { icon: targetIcon }).addTo(map); }
          window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'map_click', lat: e.latlng.lat, lng: e.latlng.lng }));
        });
      </script>
    </body>
    </html>
  `;

  const handleMessage = async (event: any) => {
    const data = JSON.parse(event.nativeEvent.data);
    if (data.type === 'map_click') setSelectedLocation({ lat: data.lat, lng: data.lng });
    if (data.type === 'show_details') {
      setSelectedPoiDetails(data.poi);
      setFullPlantInfo(null);
      if (data.poi.plant_id) {
        setIsLoadingInfo(true);
        try {
          const res = await api.get('/plants/' + data.poi.plant_id);
          setFullPlantInfo(res.data);
        } catch (err) { console.log("Eroare detalii server"); } finally { setIsLoadingInfo(false); }
      }
    }
  };

  const getCurrentLocation = async () => {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return;
    let location = await Location.getCurrentPositionAsync({});
    setSelectedLocation({ lat: location.coords.latitude, lng: location.coords.longitude });
    webViewRef.current?.injectJavaScript(`map.setView([${location.coords.latitude}, ${location.coords.longitude}], 16); true;`);
  };

  useEffect(() => { fetchNearbyPOIs(5); }, [activeFilterId]);

  const getDisplayPlantName = (poi: any) => {
    if (fullPlantInfo?.name_ro) return fullPlantInfo.name_ro;
    if (poi.plant?.name_ro) return poi.plant.name_ro;
    return "Plantă Scanată";
  };

  const getDisplayUserName = (poi: any) => {
    return allUsers.find(u => u.id === poi.user_id)?.username || poi.user?.username || poi.username || "Utilizator";
  };

  const getSafeText = (text: string | null | undefined, fallback: string) => {
    if (!text || text.trim() === '') return fallback;
    return text;
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.filterArea}>
        <TouchableOpacity style={styles.mainFilterButton} onPress={() => setIsMenuVisible(true)}>
          <Search color="#2e7d32" size={18} style={{marginRight: 8}} />
          <Text style={styles.mainFilterText} numberOfLines={1}>{activeFilterName}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.scanButton} onPress={() => fetchNearbyPOIs(5)}>
          <Radio color="#2e7d32" size={18} style={{marginRight: 8}} />
          <Text style={styles.scanButtonText}>Scan 5km</Text>
        </TouchableOpacity>
      </View>

      <Modal visible={isMenuVisible} animationType="fade" transparent={true}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setIsMenuVisible(false)}>
          <View style={styles.menuContent}>
            <Text style={styles.menuTitle}>Filtrează Harta:</Text>
            <FlatList
              data={[{ id: 'all', name_ro: 'Toate Plantele' }, ...allPlants]} 
              keyExtractor={(item: any) => item.id.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.menuItem} onPress={() => {
                    setActiveFilterName(item.id === 'all' ? 'Toate' : item.name_ro);
                    setActiveFilterId(item.id === 'all' ? null : item.id);
                    setIsMenuVisible(false);
                }}>
                  <Text style={[styles.menuItemText, activeFilterId === item.id && styles.activeMenuText]}>{item.name_ro}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal visible={!!selectedPoiDetails} animationType="slide" transparent={true}>
        <View style={styles.detailsModalOverlay}>
          <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={() => setSelectedPoiDetails(null)} />
          <View style={styles.detailsModalContent}>
            {selectedPoiDetails && (
              <>
                <Text style={styles.detailsTitle}>{getDisplayPlantName(selectedPoiDetails)}</Text>
                <Text style={styles.detailsUser}>📍 Adăugat de: {getDisplayUserName(selectedPoiDetails)}</Text>
                <ScrollView style={styles.scrollArea} showsVerticalScrollIndicator={true} contentContainerStyle={{ paddingBottom: 20 }}>
                  <Image source={{ uri: selectedPoiDetails.image_url || 'https://via.placeholder.com/400x300' }} style={styles.detailsImage} resizeMode="cover" />
                  <View style={styles.commentBox}>
                    <Text style={styles.commentLabel}>📝 Notițe utilizator:</Text>
                    <Text style={styles.commentText}>{selectedPoiDetails.comment || "Niciun comentariu."}</Text>
                  </View>
                  {isLoadingInfo ? (
                    <ActivityIndicator size="small" color="#2e7d32" />
                  ) : fullPlantInfo ? (
                    <View style={styles.encyclopediaSection}>
                      <View style={styles.encyclopediaHeaderRow}>
                        <BookOpen color="#2e7d32" size={18} />
                        <Text style={styles.encyclopediaHeader}>Date din Enciclopedie</Text>
                      </View>

                      <View style={styles.sectionRow}><Info color="#2e7d32" size={14} /><Text style={styles.sectionSubtitle}>DESCRIERE:</Text></View>
                      <Text style={styles.sectionText}>{getSafeText(fullPlantInfo.description, "Fără descriere.")}</Text>

                      <View style={styles.sectionRow}><Leaf color="#2e7d32" size={14} /><Text style={styles.sectionSubtitle}>PĂRȚI UTILIZABILE:</Text></View>
                      <Text style={styles.sectionText}>{getSafeText(fullPlantInfo.usable_parts, "Nu sunt specificate.")}</Text>

                      <View style={styles.sectionRow}><CheckCircle2 color="#2e7d32" size={14} /><Text style={styles.sectionSubtitle}>BENEFICII:</Text></View>
                      <Text style={styles.sectionText}>{getSafeText(fullPlantInfo.health_benefits, "Nu sunt documentate.")}</Text>

                      <View style={styles.sectionRow}><AlertTriangle color="#c62828" size={14} /><Text style={[styles.sectionSubtitle, {color: '#c62828'}]}>CONTRAINDICAȚII:</Text></View>
                      <Text style={[styles.sectionText, {backgroundColor: '#ffebee', color: '#c62828'}]}>{getSafeText(fullPlantInfo.contraindications, "Consultați un medic.")}</Text>
                    </View>
                  ) : null}
                </ScrollView>
                <View style={styles.actionButtonsRow}>
                  <TouchableOpacity style={[styles.actionBtn, {backgroundColor: '#2e7d32'}]} onPress={() => setSelectedPoiDetails(null)}>
                    <Text style={styles.actionBtnText}>Închide</Text>
                  </TouchableOpacity>
                  {isAdmin && (
                    <TouchableOpacity style={[styles.actionBtn, {backgroundColor: '#d32f2f'}]} onPress={() => handleDeletePOI(selectedPoiDetails.id)}>
                      <Trash2 color="#fff" size={20} />
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
          <Target color="#c62828" size={32} />
        </TouchableOpacity>
        {selectedLocation && (
          <TouchableOpacity style={styles.setPointButton} onPress={handleSetPoint}>
            <MapPin color="#fff" size={32} />
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  filterArea: { position: 'absolute', top: 70, left: 20, right: 20, flexDirection: 'row', justifyContent: 'center', zIndex: 10 },
  mainFilterButton: { backgroundColor: '#fff', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 25, elevation: 5, marginRight: 10, minWidth: 120, flexDirection: 'row', alignItems: 'center' },
  scanButton: { backgroundColor: '#fff', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 25, elevation: 5, flexDirection: 'row', alignItems: 'center' },
  mainFilterText: { color: '#2e7d32', fontWeight: 'bold' },
  scanButtonText: { color: '#2e7d32', fontWeight: 'bold' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  menuContent: { width: '80%', backgroundColor: '#fff', borderRadius: 20, padding: 20, maxHeight: '60%' },
  menuTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15, textAlign: 'center' },
  menuItem: { paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#eee' },
  menuItemText: { fontSize: 16, color: '#444' },
  activeMenuText: { color: '#2e7d32', fontWeight: 'bold' },
  buttonContainer: { position: 'absolute', bottom: 120, right: 20, gap: 15, zIndex: 10 },
  gpsButton: { backgroundColor: '#fff', width: 66, height: 66, borderRadius: 33, justifyContent: 'center', alignItems: 'center', elevation: 8 },
  setPointButton: { backgroundColor: '#2e7d32', width: 66, height: 66, borderRadius: 33, justifyContent: 'center', alignItems: 'center', elevation: 8 },
  detailsModalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  detailsModalContent: { backgroundColor: '#fff', borderTopLeftRadius: 30, borderTopRightRadius: 30, paddingHorizontal: 25, paddingTop: 25, paddingBottom: 40, maxHeight: '88%', elevation: 20 },
  detailsTitle: { fontSize: 24, fontWeight: '900', color: '#1b5e20', textAlign: 'center', marginBottom: 2 },
  detailsUser: { fontSize: 13, color: '#666', textAlign: 'center', marginBottom: 15, fontStyle: 'italic' },
  scrollArea: { flexShrink: 1, marginBottom: 15 },
  detailsImage: { width: '100%', height: 220, borderRadius: 15, marginBottom: 20 },
  commentBox: { backgroundColor: '#f5f5f5', padding: 15, borderRadius: 15, marginBottom: 15 },
  commentLabel: { fontSize: 12, fontWeight: 'bold', color: '#666', marginBottom: 5 },
  commentText: { fontSize: 15, color: '#333', fontStyle: 'italic' },
  encyclopediaSection: { marginTop: 10 },
  encyclopediaHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 15, borderBottomWidth: 1, borderBottomColor: '#eee', paddingBottom: 10 },
  encyclopediaHeader: { fontSize: 18, fontWeight: 'bold', color: '#2e7d32', marginLeft: 10 },
  sectionRow: { flexDirection: 'row', alignItems: 'center', marginTop: 15, marginBottom: 5 },
  sectionSubtitle: { fontSize: 12, fontWeight: '800', color: '#2e7d32', marginLeft: 8, textTransform: 'uppercase' },
  sectionText: { fontSize: 14, color: '#444', lineHeight: 20, backgroundColor: '#F9FBE7', padding: 12, borderRadius: 12 },
  actionButtonsRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 10, paddingTop: 15, borderTopWidth: 1, borderTopColor: '#eee' },
  actionBtn: { flex: 1, padding: 16, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  actionBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 }
});