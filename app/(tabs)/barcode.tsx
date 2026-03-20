import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, StatusBar, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import QRCode from 'react-native-qrcode-svg';

import { COLORS } from '@/constants/colors';
import { api } from '@/services/api';

export default function BarcodeScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({ qr_string: '', nama_mitra: '', alamat_mitra: '' });

  const loadData = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);

      const res = await api.get('/pegawai/barcode_data.php');
      if (res.data.success) {
        setData(res.data.data);
      }
    } catch (error: any) {
      if (showLoading) {
        Alert.alert('Error', 'Gagal memuat data QR');
      }
    } finally {
      if (showLoading) setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      // Saat halaman dibuka / difokuskan
      loadData(true);

      // Auto refresh selama halaman masih terbuka
      const interval = setInterval(() => {
        loadData(false);
      }, 60000); // refresh tiap 60 detik

      // Cleanup saat keluar dari halaman
      return () => {
        clearInterval(interval);
      };
    }, [loadData])
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

      <View style={styles.headerBackground}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <View>
            <Text style={styles.headerTitle}>QR Code Pegawai</Text>
          </View>
        </View>
      </View>

      <View style={styles.contentContainer}>
        <View style={styles.content}>
          <View style={styles.qrCard}>
            <Text style={styles.instansiName}>{data.nama_pegawai || 'Memuat...'}</Text>
            <Text style={styles.instansiName}>{data.nama_mitra || 'Memuat...'}</Text>
            <Text style={styles.lokasiName}>{data.alamat_mitra || '-'}</Text>

            <View style={styles.qrWrapper}>
              {loading ? (
                <View style={styles.loaderBox}>
                  <ActivityIndicator size="large" color={COLORS.primary} />
                </View>
              ) : data.qr_string ? (
                <QRCode
                  value={data.qr_string}
                  size={220}
                  color="black"
                  backgroundColor="white"
                />
              ) : null}
            </View>

          </View>
        </View>

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.primary },
  headerBackground: {
    backgroundColor: COLORS.primary,
    paddingBottom: 30,
    borderBottomRightRadius: 44
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10
  },
  backBtn: { marginRight: 15 },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#FFF' },
  headerSubtitle: { fontSize: 13, color: '#E5E7EB' },
  contentContainer: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderTopLeftRadius: 34,
    marginTop: -10
  },
  content: { flex: 1, padding: 20, justifyContent: 'center' },
  qrCard: {
    backgroundColor: '#FFF',
    paddingVertical: 40,
    paddingHorizontal: 20,
    borderRadius: 32,
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 15,
  },
  instansiName: { fontSize: 18, fontWeight: '800', color: COLORS.primary, textAlign: 'center' },
  lokasiName: { fontSize: 13, color: '#6B7280', marginTop: 4, marginBottom: 25, textAlign: 'center' },
  qrWrapper: {
    padding: 15,
    backgroundColor: '#FFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#F1F5F9'
  },
  loaderBox: { width: 220, height: 220, justifyContent: 'center' },
  qrFooterText: {
    marginTop: 20,
    fontSize: 11,
    color: '#9CA3AF',
    fontFamily: 'monospace'
  },
  floatingHome: {
    position: 'absolute',
    bottom: 30,
    left: 20,
    backgroundColor: COLORS.accentOrange,
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
});