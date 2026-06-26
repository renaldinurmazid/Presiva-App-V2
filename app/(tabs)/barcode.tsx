import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, StatusBar, Alert } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft } from 'lucide-react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import QRCode from 'react-native-qrcode-svg';

import { Colors, FontSize, FontFamily, Radius, Spacing } from '@/constants/colors';
import { api } from '@/services/api';

export default function BarcodeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({ qr_string: '', nama_pegawai: '', nama_mitra: '', alamat_mitra: '' });

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
      loadData(true);

      const interval = setInterval(() => {
        loadData(false);
      }, 60000);

      return () => {
        clearInterval(interval);
      };
    }, [loadData])
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.neutral[0]} translucent />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeft size={22} color={Colors.neutral[900]} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>QR Code Pegawai</Text>
      </View>

      <View style={styles.contentContainer}>
        <View style={styles.content}>
          <View style={styles.qrCard}>
            <Text style={styles.employeeName}>{data.nama_pegawai || 'Memuat...'}</Text>
            <Text style={styles.mitraName}>{data.nama_mitra || 'Memuat...'}</Text>
            <Text style={styles.lokasiName}>{data.alamat_mitra || '-'}</Text>

            <View style={styles.qrWrapper}>
              {loading ? (
                <View style={styles.loaderBox}>
                  <ActivityIndicator size="large" color={Colors.primary[500]} />
                </View>
              ) : data.qr_string ? (
                <QRCode
                  value={data.qr_string}
                  size={220}
                  color={Colors.neutral[900]}
                  backgroundColor={Colors.neutral[0]}
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
  safeArea: { 
    flex: 1, 
    backgroundColor: Colors.neutral[0] 
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
    paddingHorizontal: Spacing[4],
    backgroundColor: Colors.neutral[0],
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral[100],
  },
  backBtn: { 
    marginRight: Spacing[4] 
  },
  headerTitle: { 
    fontSize: FontSize.lg, 
    fontFamily: FontFamily.semibold, 
    color: Colors.neutral[900] 
  },
  contentContainer: {
    flex: 1,
    backgroundColor: Colors.neutral[50],
  },
  content: { 
    flex: 1, 
    padding: Spacing[4], 
    justifyContent: 'center' 
  },
  qrCard: {
    backgroundColor: Colors.neutral[0],
    paddingVertical: Spacing[8],
    paddingHorizontal: Spacing[4],
    borderRadius: Radius.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.neutral[100],
    elevation: 0,
    shadowOpacity: 0,
  },
  employeeName: { 
    fontSize: FontSize.lg, 
    fontFamily: FontFamily.bold, 
    color: Colors.neutral[900], 
    textAlign: 'center' 
  },
  mitraName: { 
    fontSize: FontSize.md, 
    fontFamily: FontFamily.semibold, 
    color: Colors.primary[500], 
    textAlign: 'center',
    marginTop: Spacing[1]
  },
  lokasiName: { 
    fontSize: FontSize.sm, 
    fontFamily: FontFamily.regular, 
    color: Colors.neutral[500], 
    marginTop: Spacing[2], 
    marginBottom: Spacing[6], 
    textAlign: 'center' 
  },
  qrWrapper: {
    padding: Spacing[3],
    backgroundColor: Colors.neutral[0],
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.neutral[100]
  },
  loaderBox: { 
    width: 220, 
    height: 220, 
    justifyContent: 'center' 
  },
});