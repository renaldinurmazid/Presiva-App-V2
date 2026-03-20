import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  Image,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { useFocusEffect, useRouter } from 'expo-router'
import * as Location from 'expo-location'
import * as Device from 'expo-device'
import { CameraView, useCameraPermissions } from 'expo-camera'

import { COLORS } from '@/constants/colors'
import DashboardHeader from '@/components/home/DashboardHeader'
import ProfileSummaryCard from '@/components/home/ProfileSummaryCard'

import AbsensiMap from '@/components/absensi/AbsensiMap'
import LokasiPicker from '@/components/absensi/LokasiPicker'
import JarakInfoCard from '@/components/absensi/JarakInfoCard'

import { getLokasiAbsensi, createAbsensi } from '@/services/absensi.service'
import { haversineDistance } from '@/utils/distance'
import { LokasiAbsensi, UserCoordinate } from '@/types/absensi'
import { useAuthStore } from '@/store/auth.store'

export default function AbsensiScreen() {
  const router = useRouter()
  const user = useAuthStore((state) => state.user)

  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [cameraLoading, setCameraLoading] = useState(false)

  const [currentTime, setCurrentTime] = useState('')
  const [currentLocation, setCurrentLocation] = useState<UserCoordinate | null>(null)
  const [lokasiList, setLokasiList] = useState<LokasiAbsensi[]>([])
  const [selectedLokasi, setSelectedLokasi] = useState<LokasiAbsensi | null>(null)

  const [selfieUri, setSelfieUri] = useState<string | null>(null)
  const [selfieBase64, setSelfieBase64] = useState<string | null>(null)
  const [selfieChecked, setSelfieChecked] = useState(false)
  const [locationStatusMessage, setLocationStatusMessage] = useState('')

  const cameraRef = useRef<CameraView | null>(null)
  const locationSubscriptionRef = useRef<Location.LocationSubscription | null>(null)

  const [cameraPermission, requestCameraPermission] = useCameraPermissions()

  const updateClock = useCallback(() => {
    const now = new Date()
    const formatted = now.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
    setCurrentTime(formatted)
  }, [])

  useEffect(() => {
    updateClock()
    const interval = setInterval(updateClock, 1000)
    return () => clearInterval(interval)
  }, [updateClock])

  const getLatestLocation = useCallback(async () => {
    const loc = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
    })

    const coords = {
      latitude: loc.coords.latitude,
      longitude: loc.coords.longitude,
    }

    setCurrentLocation(coords)
    return coords
  }, [])

  const startLocationWatcher = useCallback(async () => {
    if (locationSubscriptionRef.current) {
      locationSubscriptionRef.current.remove()
      locationSubscriptionRef.current = null
    }

    const permission = await Location.requestForegroundPermissionsAsync()

    if (permission.status !== 'granted') {
      throw new Error('Izin lokasi ditolak. Aktifkan GPS untuk melakukan absensi.')
    }

    await getLatestLocation()

    const watcher = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.High,
        timeInterval: 3000,
        distanceInterval: 2,
      },
      (loc) => {
        setCurrentLocation({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        })
      }
    )

    locationSubscriptionRef.current = watcher
  }, [getLatestLocation])

  const loadInitialData = useCallback(async () => {
    const res = await getLokasiAbsensi()

    if (!res || !res.success) {
      throw new Error(res?.message || 'Gagal mengambil lokasi absensi.')
    }

    const list = Array.isArray(res.data) ? res.data : []
    setLokasiList(list)

    if (list.length === 0) {
      setSelectedLokasi(null)
      return
    }

    if (list.length === 1) {
      setSelectedLokasi(list[0])
      return
    }

    setSelectedLokasi((prev) => {
      if (!prev) return list[0] || null

      const existingSelected = list.find(
        (item) => String(item.id_lokasi) === String(prev.id_lokasi)
      )

      return existingSelected || list[0] || null
    })
  }, [])

  const resetScreenState = useCallback(() => {
    setSelfieUri(null)
    setSelfieBase64(null)
    setSelfieChecked(false)
    setLocationStatusMessage('')
    setSubmitting(false)
    setCameraLoading(false)
  }, [])

  const initScreen = useCallback(async () => {
    try {
      setLoading(true)
      resetScreenState()
      await Promise.all([startLocationWatcher(), loadInitialData()])
    } catch (error: any) {
      Alert.alert('Error', error?.message || 'Gagal memuat halaman absensi.')
    } finally {
      setLoading(false)
    }
  }, [loadInitialData, resetScreenState, startLocationWatcher])

  const onRefresh = useCallback(async () => {
    try {
      setRefreshing(true)
      await Promise.all([getLatestLocation(), loadInitialData()])
    } catch (error: any) {
      Alert.alert('Error', error?.message || 'Gagal refresh data absensi.')
    } finally {
      setRefreshing(false)
    }
  }, [getLatestLocation, loadInitialData])

  useFocusEffect(
    useCallback(() => {
      initScreen()

      return () => {
        if (locationSubscriptionRef.current) {
          locationSubscriptionRef.current.remove()
          locationSubscriptionRef.current = null
        }
      }
    }, [initScreen])
  )

  const distanceMeter = useMemo(() => {
    if (!currentLocation || !selectedLokasi) return null

    return haversineDistance(
      currentLocation.latitude,
      currentLocation.longitude,
      selectedLokasi.latitude,
      selectedLokasi.longitude
    )
  }, [currentLocation, selectedLokasi])

  const isWithinRadius = useMemo(() => {
    if (!selectedLokasi || distanceMeter === null) return false
    return distanceMeter <= selectedLokasi.radius_meter
  }, [selectedLokasi, distanceMeter])

  const submitAbsensi = useCallback(
    async (
      fotoUri: string,
      fotoBase64: string,
      coords: UserCoordinate,
      lokasi: LokasiAbsensi,
      distance: number
    ) => {
      try {
        setSubmitting(true)

        const deviceInfo = [
          Device.brand || 'Unknown Brand',
          Device.modelName || 'Unknown Model',
          `${Device.osName || 'Unknown OS'} ${Device.osVersion || ''}`.trim(),
        ].join(' | ')

        const res = await createAbsensi({
          id_lokasi: String(lokasi.id_lokasi),
          latitude: coords.latitude,
          longitude: coords.longitude,
          foto_absensi: fotoBase64,
          device_info: deviceInfo,
        })

        if (!res.success) {
          throw new Error(res.message || 'Absensi gagal dikirim.')
        }

        router.replace({
          pathname: '/absensi/success',
          params: {
            foto: fotoUri,
            nama_lokasi: lokasi.nama_lokasi,
            alamat: lokasi.alamat || '',
            waktu: res.data?.waktu_absensi || res.data?.tanggal || new Date().toISOString(),
            distance: res.data?.distance_meter?.toString() || distance.toFixed(2) || '0',
          },
        })
      } catch (error: any) {
        Alert.alert('Gagal', error?.message || 'Absensi gagal dikirim.')
      } finally {
        setSubmitting(false)
      }
    },
    [router]
  )

  const handleTakeSelfie = useCallback(async () => {
    try {
      if (!cameraPermission?.granted) {
        const permissionResult = await requestCameraPermission()
        if (!permissionResult.granted) {
          Alert.alert('Izin Kamera', 'Aplikasi membutuhkan akses kamera untuk selfie absensi.')
          return
        }
      }

      if (!cameraRef.current) {
        Alert.alert('Error', 'Kamera belum siap.')
        return
      }

      if (!selectedLokasi) {
        Alert.alert('Validasi', 'Lokasi kantor belum dipilih.')
        return
      }

      setCameraLoading(true)

      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.6,
        base64: true,
      })

      if (!photo?.uri || !photo?.base64) {
        throw new Error('Foto selfie gagal diambil.')
      }

      const latestCoords = await getLatestLocation()

      const finalDistance = haversineDistance(
        latestCoords.latitude,
        latestCoords.longitude,
        selectedLokasi.latitude,
        selectedLokasi.longitude
      )

      const withinRadius = finalDistance <= selectedLokasi.radius_meter
      const finalBase64 = `data:image/jpeg;base64,${photo.base64}`

      setSelfieUri(photo.uri)
      setSelfieBase64(finalBase64)
      setSelfieChecked(true)

      if (!withinRadius) {
        setLocationStatusMessage(
          `Anda di luar jangkauan. Jarak ${finalDistance.toFixed(2)} meter dari lokasi absensi. Maksimal radius ${selectedLokasi.radius_meter} meter.`
        )
        return
      }

      setLocationStatusMessage('Lokasi valid. Mengirim absensi...')

      await submitAbsensi(
        photo.uri,
        finalBase64,
        latestCoords,
        selectedLokasi,
        finalDistance
      )
    } catch (error: any) {
      Alert.alert('Error', error?.message || 'Gagal mengambil foto selfie.')
    } finally {
      setCameraLoading(false)
    }
  }, [
    cameraPermission,
    getLatestLocation,
    requestCameraPermission,
    selectedLokasi,
    submitAbsensi,
  ])

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Memuat halaman absensi...</Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.headerBackground}>
        <DashboardHeader />

        <ProfileSummaryCard
          namaPegawai={user?.nama_pegawai || '-'}
          namaMitra={user?.nama_mitra || '-'}
          noTelp={user?.no_telp || '-'}
          foto={user?.foto || null}
        />
      </View>

      <View style={styles.contentContainer}>
        <ScrollView
          contentContainerStyle={styles.container}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          <Text style={styles.title}>Absensi</Text>
          <Text style={styles.subtitle}>
            Ambil selfie pada kotak kamera. Jika lokasi dalam jangkauan, absensi langsung otomatis terkirim.
          </Text>

          <View style={styles.timeCard}>
            <Text style={styles.timeLabel}>Jam Saat Ini</Text>
            <Text style={styles.timeValue}>{currentTime || '-'}</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Selfie Absensi</Text>

            <View style={styles.cameraBox}>
              {selfieUri ? (
                <Image source={{ uri: selfieUri }} style={styles.previewImage} />
              ) : cameraPermission?.granted ? (
                <CameraView
                  ref={cameraRef}
                  style={styles.camera}
                  facing="front"
                />
              ) : (
                <View style={styles.cameraPlaceholder}>
                  <Text style={styles.cameraPlaceholderText}>
                    Izin kamera dibutuhkan untuk selfie absensi
                  </Text>
                  <TouchableOpacity
                    style={styles.permissionButton}
                    onPress={requestCameraPermission}
                  >
                    <Text style={styles.permissionButtonText}>Izinkan Kamera</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            <TouchableOpacity
              style={styles.selfieButton}
              onPress={handleTakeSelfie}
              disabled={cameraLoading || submitting || !selectedLokasi}
            >
              {cameraLoading || submitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.selfieButtonText}>
                  {selfieUri ? 'Ambil Ulang Selfie' : 'Ambil Selfie'}
                </Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Lokasi Kantor</Text>
            <LokasiPicker
              lokasiList={lokasiList}
              selectedLokasi={selectedLokasi}
              onSelect={(item) => {
                setSelectedLokasi(item)
                setSelfieChecked(false)
                setLocationStatusMessage('')
              }}
            />
          </View>

          <JarakInfoCard
            currentLocation={currentLocation}
            selectedLokasi={selectedLokasi}
            distanceMeter={distanceMeter}
            isWithinRadius={selfieChecked ? isWithinRadius : false}
          />

          {!!locationStatusMessage && (
            <View style={styles.statusCard}>
              <Text
                style={[
                  styles.statusText,
                  isWithinRadius ? styles.statusSuccess : styles.statusDanger,
                ]}
              >
                {locationStatusMessage}
              </Text>
            </View>
          )}

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Lokasi Selfie</Text>
            <AbsensiMap currentLocation={currentLocation} selectedLokasi={selectedLokasi} />
          </View>
        </ScrollView>

        <TouchableOpacity
          style={styles.floatingHome}
          onPress={() => router.replace('/(tabs)')}
          activeOpacity={0.8}
        >
          <Text style={styles.homeIcon}>🏠</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.primary,
  },
  headerBackground: {
    backgroundColor: COLORS.primary,
    paddingBottom: 28,
    borderBottomRightRadius: 44,
  },
  contentContainer: {
    flex: 1,
    backgroundColor: '#f5f7fb',
    borderTopLeftRadius: 34,
    marginTop: -6,
    paddingTop: 8,
  },
  container: {
    padding: 16,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    color: '#64748b',
    fontSize: 14,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0f172a',
  },
  subtitle: {
    marginTop: 4,
    marginBottom: 16,
    color: '#64748b',
    lineHeight: 20,
  },
  timeCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
  },
  timeLabel: {
    fontSize: 13,
    color: '#64748b',
    marginBottom: 4,
  },
  timeValue: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.primary,
    letterSpacing: 1,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
    color: '#0f172a',
  },
  cameraBox: {
    height: 360,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: '#111827',
  },
  camera: {
    flex: 1,
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  cameraPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  cameraPlaceholderText: {
    color: '#fff',
    textAlign: 'center',
    marginBottom: 12,
  },
  permissionButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 12,
  },
  permissionButtonText: {
    color: '#fff',
    fontWeight: '700',
  },
  selfieButton: {
    marginTop: 14,
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  selfieButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
  statusCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  statusText: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '700',
  },
  statusSuccess: {
    color: '#16a34a',
  },
  statusDanger: {
    color: '#dc2626',
  },
  floatingHome: {
    position: 'absolute',
    bottom: 24,
    left: 16,
    backgroundColor: 'rgba(37, 99, 235, 0.85)',
    padding: 14,
    borderRadius: 50,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 5,
  },
  homeIcon: {
    fontSize: 18,
    color: '#fff',
  },
})