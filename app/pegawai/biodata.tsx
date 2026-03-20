import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  TextInput, Alert, StatusBar, ActivityIndicator, Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';

import { COLORS } from '@/constants/colors';
import { api } from '@/services/api';

const BASE_URL = 'https://gosukses.com';

export default function BiodataScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [imageUri, setImageUri] = useState<string | null>(null);
  const [form, setForm] = useState({
    nik_pegawai: '',
    nama_pegawai: '',
    no_telp: '',
    jabatan: '',
    divisi: '',
    remark: '',
    foto: '',
  });

  const getFotoUri = (foto?: string | null) => {
    if (!foto || foto === 'null' || foto.trim() === '') return null;

    const cleanFoto = foto.trim();

    if (cleanFoto.startsWith('http://') || cleanFoto.startsWith('https://')) {
      return `${cleanFoto}${cleanFoto.includes('?') ? '&' : '?'}t=${Date.now()}`;
    }

    if (cleanFoto.startsWith('/')) {
      return `${BASE_URL}${cleanFoto}?t=${Date.now()}`;
    }

    if (cleanFoto.startsWith('uploads/')) {
      return `${BASE_URL}/${cleanFoto}?t=${Date.now()}`;
    }

    if (cleanFoto.startsWith('foto_pegawai/')) {
      return `${BASE_URL}/uploads/${cleanFoto}?t=${Date.now()}`;
    }

    return `${BASE_URL}/uploads/foto_pegawai/${encodeURIComponent(cleanFoto)}?t=${Date.now()}`;
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/pegawai/detail.php');

      if (res.data.success) {
        const data = res.data.data || {};

        setForm({
          nik_pegawai: data.nik_pegawai || '',
          nama_pegawai: data.nama_pegawai || '',
          no_telp: data.no_telp || '',
          jabatan: data.jabatan || '',
          divisi: data.divisi || '',
          remark: data.remark || '',
          foto: data.foto || '',
        });

        const previewFoto = getFotoUri(data.foto);
        setImageUri(previewFoto);

        //console.log('foto raw:', data.foto);
        //console.log('foto preview:', previewFoto);
      } else {
        Alert.alert('Error', res.data.message || 'Gagal memuat data');
      }
    } catch (e) {
      Alert.alert('Error', 'Gagal memuat data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const takeSelfie = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      return Alert.alert('Izin Ditolak', 'Butuh akses kamera');
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
      cameraType: ImagePicker.CameraType.front,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    if (!form.nama_pegawai.trim()) {
      return Alert.alert('Validasi', 'Nama wajib diisi');
    }

    try {
      setSaving(true);

      const formData = new FormData();
      formData.append('nik_pegawai', form.nik_pegawai);
      formData.append('nama_pegawai', form.nama_pegawai);
      formData.append('no_telp', form.no_telp);
      formData.append('jabatan', form.jabatan);
      formData.append('divisi', form.divisi);
      formData.append('remark', form.remark);

      if (imageUri && !imageUri.startsWith('http')) {
        const filename = imageUri.split('/').pop() || 'selfie.jpg';
        const ext = filename.split('.').pop()?.toLowerCase() || 'jpg';

        let mimeType = 'image/jpeg';
        if (ext === 'png') mimeType = 'image/png';
        if (ext === 'heic') mimeType = 'image/heic';
        if (ext === 'webp') mimeType = 'image/webp';

        formData.append('foto', {
          uri: imageUri,
          name: `selfie.${ext}`,
          type: mimeType,
        } as any);
      }

      const res = await api.post('/pegawai/update_biodata.php', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data.success) {
        Alert.alert('Sukses', 'Biodata berhasil diperbarui');
        await loadData();
        router.back();
      } else {
        Alert.alert('Error', res.data.message || 'Gagal menyimpan data');
      }
    } catch (error) {
      Alert.alert('Error', 'Gagal menyimpan data');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

      <View style={styles.headerBackground}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <View>
            <Text style={styles.headerTitle}>Update Biodata</Text>
            <Text style={styles.headerSubtitle}>Profil & Selfie Pegawai</Text>
          </View>
        </View>
      </View>

      <View style={styles.contentContainer}>
        {loading ? (
          <ActivityIndicator size="large" style={{ marginTop: 50 }} />
        ) : (
          <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 120 }}>
            <View style={styles.avatarSection}>
              <View style={styles.imageWrapper}>
                {imageUri ? (
                  <Image
                    source={{ uri: imageUri }}
                    style={styles.avatarImage}
                    onError={(e) => console.log('Image load error:', e.nativeEvent)}
                  />
                ) : (
                  <Ionicons name="person-circle-outline" size={120} color="#D1D5DB" />
                )}

                <TouchableOpacity style={styles.cameraBtn} onPress={takeSelfie}>
                  <Ionicons name="camera" size={20} color="#FFF" />
                </TouchableOpacity>
              </View>

              <Text style={styles.avatarHint}>Ketuk kamera untuk ganti selfie</Text>
            </View>

            <Text style={styles.label}>NIK Pegawai</Text>
            <TextInput
              style={styles.input}
              value={form.nik_pegawai}
              onChangeText={(t) => setForm({ ...form, nik_pegawai: t })}
              placeholder="3201..."
            />

            <Text style={styles.label}>Nama Lengkap</Text>
            <TextInput
              style={styles.input}
              value={form.nama_pegawai}
              onChangeText={(t) => setForm({ ...form, nama_pegawai: t })}
            />

            <Text style={styles.label}>No. Telepon / WA</Text>
            <TextInput
              style={styles.input}
              value={form.no_telp}
              keyboardType="phone-pad"
              onChangeText={(t) => setForm({ ...form, no_telp: t })}
            />

            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Jabatan</Text>
                <TextInput
                  style={styles.input}
                  value={form.jabatan}
                  onChangeText={(t) => setForm({ ...form, jabatan: t })}
                />
              </View>

              <View style={{ width: 15 }} />

              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Divisi</Text>
                <TextInput
                  style={styles.input}
                  value={form.divisi}
                  onChangeText={(t) => setForm({ ...form, divisi: t })}
                />
              </View>
            </View>

            <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
              {saving ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.saveBtnText}>SIMPAN PERUBAHAN</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        )}

        <TouchableOpacity style={styles.floatingHome} onPress={() => router.replace('/(tabs)')}>
          <Ionicons name="home-outline" size={26} color="#FFF" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.primary },
  headerBackground: {
    backgroundColor: COLORS.primary,
    paddingBottom: 30,
    borderBottomRightRadius: 44,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  backBtn: { marginRight: 15 },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#FFF' },
  headerSubtitle: { fontSize: 13, color: '#E5E7EB' },
  contentContainer: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderTopLeftRadius: 34,
    marginTop: -10,
  },
  content: { flex: 1, paddingHorizontal: 25 },
  avatarSection: { alignItems: 'center', marginVertical: 20 },
  imageWrapper: {
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: '#FFF',
    elevation: 5,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: 130,
    height: 130,
    borderRadius: 65,
  },
  cameraBtn: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: COLORS.primary,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#F3F4F6',
  },
  avatarHint: {
    marginTop: 10,
    fontSize: 12,
    color: '#6B7280',
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: '#4B5563',
    marginBottom: 8,
    marginTop: 15,
  },
  input: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    padding: 14,
    fontSize: 15,
  },
  row: { flexDirection: 'row' },
  saveBtn: {
    backgroundColor: COLORS.primary,
    padding: 18,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 35,
    elevation: 4,
  },
  saveBtnText: {
    color: '#FFF',
    fontWeight: '800',
    fontSize: 16,
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
  },
});