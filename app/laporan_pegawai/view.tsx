import React, { useMemo, useState } from 'react';
import {
  View,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  Text,
  StatusBar,
  Linking,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/constants/colors';

export default function WebViewScreen() {
  const router = useRouter();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const params = useLocalSearchParams();

  const title = params.title ? String(params.title) : 'Detail Laporan';
  const url = params.url ? String(params.url) : '';
  const id_pegawai = params.id_pegawai ? String(params.id_pegawai) : '';
  const id_mitra = params.id_mitra ? String(params.id_mitra) : '';

  const rawUrl = url ? decodeURIComponent(url) : '';
  const validUrl = rawUrl && rawUrl.startsWith('http') ? rawUrl : null;

  const finalUrl = useMemo(() => {
    if (!validUrl) return null;

    try {
      const urlObj = new URL(validUrl);

      if (id_pegawai) {
        urlObj.searchParams.set('id_pegawai', id_pegawai);
      }

      if (id_mitra) {
        urlObj.searchParams.set('id_mitra', id_mitra);
      }

      return urlObj.toString();
    } catch {
      return null;
    }
  }, [validUrl, id_pegawai, id_mitra]);

  const handleOpenBrowser = async () => {
    if (!finalUrl) return;

    try {
      const supported = await Linking.canOpenURL(finalUrl);
      if (supported) {
        await Linking.openURL(finalUrl);
      } else {
        setErrorMsg('URL tidak bisa dibuka di browser.');
      }
    } catch {
      setErrorMsg('Gagal membuka URL di browser.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>

        <Text style={styles.headerTitle} numberOfLines={1}>
          {title}
        </Text>
      </View>

      <View style={styles.webviewContainer}>
        {finalUrl ? (
          <WebView
            source={{ uri: finalUrl }}
            style={styles.webview}
            startInLoadingState
            javaScriptEnabled
            domStorageEnabled
            originWhitelist={['*']}
            mixedContentMode="always"
            setSupportMultipleWindows={false}
            onLoadStart={() => setErrorMsg(null)}
            onError={(syntheticEvent) => {
              const { nativeEvent } = syntheticEvent;
              setErrorMsg(`WebView Error: ${nativeEvent.description}`);
            }}
            onHttpError={(syntheticEvent) => {
              const { nativeEvent } = syntheticEvent;
              setErrorMsg(
                `HTTP Error ${nativeEvent.statusCode}: ${nativeEvent.description}`
              );
            }}
            renderLoading={() => (
              <View style={styles.loading}>
                <ActivityIndicator color={COLORS.primary} size="large" />
                <Text style={styles.loadingText}>Memuat Halaman...</Text>
              </View>
            )}
          />
        ) : (
          <View style={styles.center}>
            <Ionicons name="warning-outline" size={50} color="#EF4444" />
            <Text style={styles.errorText}>URL Laporan Tidak Valid</Text>
            <Text style={styles.invalidUrlText}>{url || '-'}</Text>
          </View>
        )}

        {errorMsg && (
          <View style={styles.errorOverlay}>
            <Text style={styles.errorOverlayTitle}>Terjadi Kesalahan:</Text>
            <Text style={styles.errorOverlayText}>{errorMsg}</Text>

            {finalUrl ? (
              <TouchableOpacity onPress={handleOpenBrowser} style={styles.secondaryBtn}>
                <Text style={styles.secondaryBtnText}>Coba Buka di Browser</Text>
              </TouchableOpacity>
            ) : null}

            <TouchableOpacity
              onPress={() => setErrorMsg(null)}
              style={styles.closeBtn}
            >
              <Text style={styles.closeBtnText}>Tutup</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.primary,
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 12,
    flex: 1,
  },
  webviewContainer: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  webview: {
    flex: 1,
  },
  loading: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF',
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 10,
  },
  invalidUrlText: {
    color: '#999',
    marginTop: 6,
    textAlign: 'center',
  },
  errorOverlay: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(239, 68, 68, 0.92)',
    padding: 15,
    borderRadius: 12,
  },
  errorOverlayTitle: {
    color: '#FFF',
    fontWeight: 'bold',
    marginBottom: 4,
  },
  errorOverlayText: {
    color: '#FFF',
    fontSize: 12,
  },
  secondaryBtn: {
    marginTop: 10,
    backgroundColor: '#1F2937',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  secondaryBtnText: {
    color: '#FFF',
    fontWeight: '600',
  },
  closeBtn: {
    marginTop: 10,
    backgroundColor: '#FFF',
    padding: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  closeBtnText: {
    color: COLORS.primary,
    fontWeight: '600',
  },
});