import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, FlatList, TouchableOpacity, Alert, ActivityIndicator, SafeAreaView } from 'react-native';
import api from '../services/api';

export default function AdminScreen() {
  const [users, setUsers] = useState([]);
  const [pois, setPois] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'users' | 'pois'>('users');

  // Încărcăm datele de pe server
  const fetchData = async () => {
    setLoading(true);
    try {
      const usersRes = await api.get('/admin/users'); 
      const poisRes = await api.get('/poi', { 
        params: { lat: 45.4353, lng: 28.0079, radius_km: 50 } 
      });
      
      setUsers(usersRes.data);
      setPois(poisRes.data);

      console.log("Primul User din listă arată așa:", usersRes.data[0]);
      console.log("Primul Punct din listă arată așa:", poisRes.data[0]);

    } catch (error) {
      console.error(error);
      Alert.alert("Eroare", "Nu am putut prelua datele de admin.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const deleteUser = (userId: string) => {
    Alert.alert("Confirmare", "Sigur vrei să ștergi acest utilizator?", [
      { text: "Anulează", style: "cancel" },
      { text: "Șterge", style: "destructive", onPress: async () => {
          try {
            await api.delete(`/admin/users/${userId}`); 
            Alert.alert("Succes", "Utilizator șters.");
            fetchData();
          } catch (e) { Alert.alert("Eroare", "Ștergerea nu a funcționat."); }
      }}
    ]);
  };

  const deletePOI = (poiId: string) => {
    Alert.alert("Confirmare", "Sigur vrei să ștergi acest punct?", [
      { text: "Anulează", style: "cancel" },
      { text: "Șterge", style: "destructive", onPress: async () => {
          try {
            await api.delete(`/admin/poi/${poiId}`);
            Alert.alert("Succes", "Punct șters.");
            fetchData();
          } catch (e) { Alert.alert("Eroare", "Verifică dacă ești logat ca admin."); }
      }}
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.header}>Admin Panel</Text>
      
      {/* Comutator Tab-uri */}
      <View style={styles.tabBar}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'users' && styles.activeTab]} 
          onPress={() => setActiveTab('users')}
        >
          <Text style={activeTab === 'users' ? styles.activeTabText : styles.tabText}>Utilizatori</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'pois' && styles.activeTab]} 
          onPress={() => setActiveTab('pois')}
        >
          <Text style={activeTab === 'pois' ? styles.activeTabText : styles.tabText}>Puncte (POI)</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#2e7d32" style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={activeTab === 'users' ? users : pois}
          keyExtractor={(item: any) => item.id.toString()}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={{flex: 1}}>
                <Text style={styles.cardTitle}>
                  {activeTab === 'users' 
                    ? (item.email || item.username || `User #${item.id}`) 
                    : (item.plant?.name_ro || item.plant?.name || `Plantă ID: ${item.plant_id || 'Necunoscut'}`)}
                </Text>
                
                <Text style={styles.cardSubtitle}>
                  {activeTab === 'users' 
                    ? `ID: ${item.id}` 
                    : `Lat: ${item.latitude || item.lat}, Lng: ${item.longitude || item.lng}`}
                </Text>
              </View>
              <TouchableOpacity 
                style={styles.deleteButton} 
                onPress={() => activeTab === 'users' ? deleteUser(item.id) : deletePOI(item.id)}
              >
                <Text style={styles.deleteText}>Șterge</Text>
              </TouchableOpacity>
            </View>
          )}
          onRefresh={fetchData}
          refreshing={loading}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5', padding: 20 },
  header: { fontSize: 24, fontWeight: 'bold', color: '#2e7d32', marginBottom: 20, textAlign: 'center', marginTop: 10 },
  tabBar: { flexDirection: 'row', marginBottom: 20, backgroundColor: '#ddd', borderRadius: 10, padding: 5 },
  tab: { flex: 1, padding: 10, alignItems: 'center', borderRadius: 8 },
  activeTab: { backgroundColor: '#2e7d32' },
  tabText: { color: '#555', fontWeight: 'bold' },
  activeTabText: { color: '#fff', fontWeight: 'bold' },
  card: { backgroundColor: '#fff', padding: 15, borderRadius: 10, marginBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', elevation: 2 },
  cardTitle: { fontSize: 16, fontWeight: 'bold' },
  cardSubtitle: { fontSize: 14, color: '#666' },
  deleteButton: { backgroundColor: '#ffeded', padding: 8, borderRadius: 5, borderWidth: 1, borderColor: '#ff4444', marginLeft: 10 },
  deleteText: { color: '#ff4444', fontWeight: 'bold', fontSize: 12 }
});