import React, { useEffect, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  Alert,
  ScrollView,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { COLORS } from '@/constants/colors'
import { authService } from '@/services/auth.service'
import * as Location from 'expo-location'
import { Ionicons } from '@expo/vector-icons'

export default function RegisterMitraScreen() {
  const router = useRouter()

  const [namaMitra, setNamaMitra] = useState('')
  const [noTelpMitra, setNoTelpMitra] = useState('')
  const [alamatMitra, setAlamatMitra] = useState('')
  const [namaPic, setNamaPic] = useState('')
  const [emailPic, setEmailPic] = useState('')
  const [noTelpPic, setNoTelpPic] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [remark, setRemark] = useState('')

  const [latitude, setLatitude] = useState<number | null>(null)
  const [longitude, setLongitude] = useState<number | null>(null)
  const [locationLoading, setLocationLoading] = useState(true)
  const [locationStatus, setLocationStatus] = useState(
    'Mendeteksi lokasi kantor pusat...'
  )

  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const requestLocation = async () => {
    try {
      setLocationLoading(true)
      setLocationStatus('Mendeteksi lokasi kantor pusat...')

      const { status } = await Location.requestForegroundPermissionsAsync()

      if (status !== 'granted') {
        setLatitude(null)
        setLongitude(null)
        setLocationStatus('Izin lokasi tidak diberikan. Pendaftaran tetap bisa dilanjutkan.')
        return
      }

      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      })

      const lat = currentLocation.coords.latitude
      const lng = currentLocation.coords.longitude

      setLatitude(lat)
      setLongitude(lng)
      setLocationStatus('Lokasi berhasil didapatkan untuk Kantor Pusat.')
    } catch {
      setLatitude(null)
      setLongitude(null)
      setLocationStatus('Lokasi tidak tersedia. Pendaftaran tetap bisa dilanjutkan.')
    } finally {
      setLocationLoading(false)
    }
  }

  useEffect(() => {
    requestLocation()
  }, [])

  const handleRegister = async () => {
    if (!namaMitra.trim()) {
      Alert.alert('Validasi', 'Nama mitra wajib diisi.')
      return
    }

    if (!namaPic.trim()) {
      Alert.alert('Validasi', 'Nama PIC wajib diisi.')
      return
    }

    if (!emailPic.trim()) {
      Alert.alert('Validasi', 'Email PIC wajib diisi.')
      return
    }

    if (!noTelpPic.trim()) {
      Alert.alert('Validasi', 'No. telp PIC wajib diisi.')
      return
    }

    if (!password.trim()) {
      Alert.alert('Validasi', 'Password wajib diisi.')
      return
    }

    if (password.length < 6) {
      Alert.alert('Validasi', 'Password minimal 6 karakter.')
      return
    }

    if (password !== confirmPassword) {
      Alert.alert('Validasi', 'Konfirmasi password tidak sama.')
      return
    }

    try {
      setLoading(true)

      const response = await authService.registerMitra({
        nama_mitra: namaMitra.trim(),
        no_telp_mitra: noTelpMitra.trim(),
        alamat_mitra: alamatMitra.trim(),
        nama_pic: namaPic.trim(),
        email_pic: emailPic.trim(),
        no_telp_pic: noTelpPic.trim(),
        password: password.trim(),
        remark: remark.trim(),
        latitude,
        longitude,
      })

      if (!response.success) {
        Alert.alert('Pendaftaran Gagal', response.message || 'Pendaftaran mitra gagal.')
        return
      }

      Alert.alert(
        'Pendaftaran Berhasil',
        response.message ||
          'Terimakasih, sudah berhasil pendaftaran mitra, silahkan login untuk mengelola HRD',
        [
          {
            text: 'OK',
            onPress: () => router.replace('/auth/login'),
          },
        ]
      )
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        'Terjadi kesalahan saat pendaftaran mitra.'
      Alert.alert('Pendaftaran Gagal', message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.container}>
          <View style={styles.headerContainer}>
            <Text style={styles.title}>Daftar Mitra</Text>
            <Text style={styles.subtitle}>Lengkapi data mitra dan PIC HRD pertama</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Data Mitra</Text>

            <TextInput
              placeholder="Nama Mitra"
              style={styles.input}
              placeholderTextColor="#999"
              value={namaMitra}
              onChangeText={setNamaMitra}
              editable={!loading}
            />

            <TextInput
              placeholder="No. Telp Mitra"
              style={styles.input}
              placeholderTextColor="#999"
              keyboardType="phone-pad"
              value={noTelpMitra}
              onChangeText={setNoTelpMitra}
              editable={!loading}
            />

            <TextInput
              placeholder="Alamat Mitra"
              style={[styles.input, styles.textArea]}
              placeholderTextColor="#999"
              multiline
              value={alamatMitra}
              onChangeText={setAlamatMitra}
              editable={!loading}
            />

            <View style={styles.locationCard}>
              <View style={styles.locationHeader}>
                <Ionicons name="location-outline" size={18} color={COLORS.primary} />
                <Text style={styles.locationTitle}>Lokasi Kantor Pusat</Text>
              </View>

              {locationLoading ? (
                <View style={styles.locationLoadingWrap}>
                  <ActivityIndicator size="small" color={COLORS.primary} />
                  <Text style={styles.locationText}>Mendeteksi lokasi...</Text>
                </View>
              ) : (
                <>
                  <Text style={styles.locationText}>{locationStatus}</Text>

                  {latitude !== null && longitude !== null ? (
                    <Text style={styles.locationCoords}>
                      Lat: {latitude.toFixed(6)} | Lng: {longitude.toFixed(6)}
                    </Text>
                  ) : (
                    <Text style={styles.locationMuted}>
                      Lokasi belum tersedia. Anda tetap bisa daftar sekarang.
                    </Text>
                  )}

                  <TouchableOpacity
                    style={styles.retryLocationButton}
                    onPress={requestLocation}
                    disabled={loading}
                  >
                    <Text style={styles.retryLocationText}>Coba Ambil Lokasi Lagi</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>

            <Text style={styles.sectionTitle}>Data PIC / HRD</Text>

            <TextInput
              placeholder="Nama PIC"
              style={styles.input}
              placeholderTextColor="#999"
              value={namaPic}
              onChangeText={setNamaPic}
              editable={!loading}
            />

            <TextInput
              placeholder="Email PIC"
              style={styles.input}
              placeholderTextColor="#999"
              autoCapitalize="none"
              keyboardType="email-address"
              value={emailPic}
              onChangeText={setEmailPic}
              editable={!loading}
            />

            <TextInput
              placeholder="No. Telp PIC"
              style={styles.input}
              placeholderTextColor="#999"
              keyboardType="phone-pad"
              value={noTelpPic}
              onChangeText={setNoTelpPic}
              editable={!loading}
            />

            <View style={styles.passwordWrapper}>
              <TextInput
                placeholder="Password"
                style={styles.passwordInput}
                placeholderTextColor="#999"
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
                editable={!loading}
              />
              <TouchableOpacity
                style={styles.eyeIcon}
                onPress={() => setShowPassword((prev) => !prev)}
                disabled={loading}
              >
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color="#666"
                />
              </TouchableOpacity>
            </View>

            <View style={styles.passwordWrapper}>
              <TextInput
                placeholder="Konfirmasi Password"
                style={styles.passwordInput}
                placeholderTextColor="#999"
                secureTextEntry={!showConfirmPassword}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                editable={!loading}
              />
              <TouchableOpacity
                style={styles.eyeIcon}
                onPress={() => setShowConfirmPassword((prev) => !prev)}
                disabled={loading}
              >
                <Ionicons
                  name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color="#666"
                />
              </TouchableOpacity>
            </View>

            <TextInput
              placeholder="Remark (opsional)"
              style={[styles.input, styles.textArea]}
              placeholderTextColor="#999"
              multiline
              value={remark}
              onChangeText={setRemark}
              editable={!loading}
            />

            <TouchableOpacity
              style={[styles.submitButton, loading && styles.submitButtonDisabled]}
              onPress={handleRegister}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.submitButtonText}>DAFTAR MITRA</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.backWrapper} onPress={() => router.back()}>
              <Text style={styles.backText}>Kembali ke Login</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.footer}>© PRESIVA</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.primary,
  },

  scrollContent: {
    flexGrow: 1,
  },

  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 30,
    justifyContent: 'center',
  },

  headerContainer: {
    alignItems: 'center',
    marginBottom: 28,
  },

  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFF',
  },

  subtitle: {
    fontSize: 14,
    color: '#E5E7EB',
    marginTop: 6,
    textAlign: 'center',
  },

  card: {
    backgroundColor: '#FFF',
    borderRadius: 22,
    padding: 24,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.primary,
    marginBottom: 14,
    marginTop: 4,
  },

  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 14,
    fontSize: 14,
    color: COLORS.textPrimary,
  },

  textArea: {
    minHeight: 90,
    textAlignVertical: 'top',
  },

  locationCard: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
    backgroundColor: '#F9FAFB',
  },

  locationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 6,
  },

  locationTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primary,
  },

  locationLoadingWrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  locationText: {
    fontSize: 13,
    color: '#374151',
    marginLeft: 8,
  },

  locationCoords: {
    marginTop: 8,
    fontSize: 12,
    color: '#111827',
    fontWeight: '600',
  },

  locationMuted: {
    marginTop: 8,
    fontSize: 12,
    color: '#6B7280',
  },

  retryLocationButton: {
    marginTop: 12,
    alignSelf: 'flex-start',
  },

  retryLocationText: {
    color: COLORS.accentOrange,
    fontSize: 13,
    fontWeight: '700',
  },

  passwordWrapper: {
    position: 'relative',
    marginBottom: 14,
  },

  passwordInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    paddingRight: 44,
    fontSize: 14,
    color: COLORS.textPrimary,
  },

  eyeIcon: {
    position: 'absolute',
    right: 14,
    top: 13,
  },

  submitButton: {
    backgroundColor: COLORS.accentOrange,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 6,
  },

  submitButtonDisabled: {
    opacity: 0.7,
  },

  submitButtonText: {
    color: '#FFF',
    fontWeight: '800',
    fontSize: 14,
  },

  backWrapper: {
    marginTop: 16,
    alignItems: 'center',
  },

  backText: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: '700',
  },

  footer: {
    textAlign: 'center',
    color: '#E5E7EB',
    marginTop: 24,
    fontSize: 12,
  },
})