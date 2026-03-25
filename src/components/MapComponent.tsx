import React, { useState, useRef } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Alert, SafeAreaView } from 'react-native';
import { WebView } from 'react-native-webview';
import * as Location from 'expo-location'; // Pachetul pentru senzorul GPS

export default function MapComponent() {
  const webViewRef = useRef<WebView>(null);
  const [selectedLocation, setSelectedLocation] = useState<{lat: number, lng: number} | null>(null);

  // Codul HTML/JS pentru hartă
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
        var map = L.map('map').setView([45.4353, 28.0080], 13); // Galați default
        
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution: '© OpenStreetMap'
        }).addTo(map);

        var currentMarker = null;

        // 1. Când utilizatorul apasă pe hartă
        map.on('click', function(e) {
          var lat = e.latlng.lat;
          var lng = e.latlng.lng;

          // Mutăm sau creăm pin-ul
          if (currentMarker) {
            currentMarker.setLatLng(e.latlng);
          } else {
            currentMarker = L.marker(e.latlng).addTo(map);
          }

          // Trimitem coordonatele către React Native
          window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'map_click', lat: lat, lng: lng }));
        });

        // 2. Funcție apelată de React Native când folosim GPS-ul
        function setViewAndMarker(lat, lng) {
          map.setView([lat, lng], 16);
          if (currentMarker) {
            currentMarker.setLatLng([lat, lng]);
          } else {
            currentMarker = L.marker([lat, lng]).addTo(map);
          }
        }
      </script>
    </body>
    </html>
  `;

  // Ascultăm mesajele care vin de la hartă (când dai click)
  const handleMessage = (event: any) => {
    const data = JSON.parse(event.nativeEvent.data);
    if (data.type === 'map_click') {
      setSelectedLocation({ lat: data.lat, lng: data.lng });
    }
  };

  // Funcția pentru butonul de GPS
  const getCurrentLocation = async () => {
    // Cerem permisiunea de locație de la telefon
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Eroare', 'Aplicația are nevoie de permisiunea de locație pentru GPS.');
      return;
    }

    // Citim senzorul
    let location = await Location.getCurrentPositionAsync({});
    const lat = location.coords.latitude;
    const lng = location.coords.longitude;

    setSelectedLocation({ lat, lng });

    // Injectăm cod în WebView ca să mute harta pe GPS
    webViewRef.current?.injectJavaScript(`setViewAndMarker(${lat}, ${lng}); true;`);
  };

// Funcția pentru salvarea punctului
  const handleSetPoint = () => {
    if (selectedLocation) {
      Alert.alert(
        "Punct Salvat!", 
        `Coordonate: ${selectedLocation.lat.toFixed(4)}, ${selectedLocation.lng.toFixed(4)}\n\nUrmătorul pas: Deschidem Camera!`
      );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <WebView
        ref={webViewRef}
        source={{ html: mapHTML }}
        style={styles.map}
        onMessage={handleMessage}
        scrollEnabled={false}
        originWhitelist={['*']}
        javaScriptEnabled={true}
        domStorageEnabled={true}
      />
      
      {/* Container pentru butoanele care stau peste hartă */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.gpsButton} onPress={getCurrentLocation}>
          <Text style={styles.buttonText}>📍 Locația Mea</Text>
        </TouchableOpacity>

        {/* Butonul Set Point apare doar dacă ai pus un pin pe hartă */}
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
  container: { flex: 1, width: '100%' },
  map: { flex: 1 },
  buttonContainer: {
    position: 'absolute',
    bottom: 30,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    paddingHorizontal: 20,
  },
  gpsButton: {
    backgroundColor: '#ffffff',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    elevation: 5, // umbră pentru Android
    shadowColor: '#000', // umbră pentru iOS
    shadowOpacity: 0.3,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  setPointButton: {
    backgroundColor: '#2e7d32', // verde
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  buttonText: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#333',
  }
});