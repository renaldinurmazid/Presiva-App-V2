import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, StatusBar, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import QRCode from 'react-native-qrcode-svg'; // Library QR Code

import { COLORS } from '@/constants/colors';
import { useAuthStore } from '@/store/auth.store';
import { api } from '@/services/api';

export default function BarcodeScreen() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  
  const [loading, setLoading] = useState(true);
  const [qrValue, setQrValue] = useState('');

  const loadBarcodeData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/pegawai/barcode_data.php');
      if (res.data.success) {
        setQrValue(res.data.data.qr_string);
      }
    } catch (error) {
      Alert.alert('Error', 'Gagal memuat data barcode');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBarcodeData();
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      
      {/* Header Melengkung Khas PRESIVA */}
      <View style={styles.headerBackground}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>QR Absensi</Text>
          <Text style={styles.headerSubtitle}>Tunjukkan kode ini ke petugas scanner</Text>
        </View>
      </View>

      <View style={styles.contentContainer}>
        <View style={styles.content}>
          <View style={styles.qrCard}>
            <Text style={styles.instansiName}>PONTREN HUSNUL KHATIMAH</Text>
            <Text style={styles.lokasiName}>KUNINGAN</Text>

            <View style={styles.qrWrapper}>
              {loading ? (
                <ActivityIndicator size="large" color={COLORS.primary} />
              ) : qrValue ? (
                <QRCode
                  value={qrValue}
                  size={240}
                  color="black"
                  backgroundColor="white"
                />
              ) : (
                <Text>Gagal memuat QR</Text>
              )}
            </View>

            <Text style={styles.qrFooterText}>{qrValue}</Text>
            
            <TouchableOpacity 
              style={styles.refreshBtn} 
              onPress={loadBarcodeData}
              disabled={loading}
            >
              <Ionicons name="refresh" size={18} color={COLORS.primary} />
              <Text style={styles.refreshText}>Perbarui Kode</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Tombol Home Melayang Kiri Bawah */}
        <TouchableOpacity
          style={styles.floatingHome}
          onPress={() => router.replace('/(tabs)')}
          activeOpacity={0.8}
        >
          <Ionicons name="home-outline" size={24} color="#FFF" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.primary },
  headerBackground: { backgroundColor: COLORS.primary, paddingBottom: 28, borderBottomRightRadius: 44 },
  header: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 18 },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#FFF' },
  headerSubtitle: { marginTop: 4, fontSize: 14, color: '#E5E7EB' },
  contentContainer: { flex: 1, backgroundColor: '#f5f7fb', borderTopLeftRadius: 34, marginTop: -6 },
  content: { flex: 1, padding: 25, alignItems: 'center', justifyContent: 'center' },
  qrCard: {
    backgroundColor: '#FFF',
    padding: 30,
    borderRadius: 30,
    alignItems: 'center',
    width: '100%',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  instansiName: { fontSize: 16, fontWeight: '800', color: '#4B5563', textAlign: 'center' },
  lokasiName: { fontSize: 14, fontWeight: '700', color: '#6B7280', marginBottom: 20 },
  qrWrapper: {
    padding: 15,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    borderRadius: 20,
    backgroundColor: '#FFF',
  },
  qrFooterText: {
    marginTop: 20,
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    fontFamily: 'monospace'
  },
  refreshBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 25,
    padding: 10,
    gap: 8
  },
  refreshText: { color: COLORS.primary, fontWeight: '700' },
  floatingHome: {
    position: 'absolute',
    bottom: 24,
    left: 20,
    backgroundColor: COLORS.accentOrange,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
});