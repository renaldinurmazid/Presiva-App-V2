import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  Image,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { useFocusEffect, useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import * as Location from 'expo-location'
import * as Device from 'expo-device'
import { CameraView, useCameraPermissions } from 'expo-camera'

import { COLORS } from '@/constants/colors'
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
  const [cameraReady, setCameraReady] = useState(false)

  const [currentTime, setCurrentTime] = useState('')
  const [currentLocation, setCurrentLocation] = useState<UserCoordinate | null>(null)
  const [lokasiList, setLokasiList] = useState<LokasiAbsensi[]>([])
  const [selectedLokasi, setSelectedLokasi] = useState<LokasiAbsensi | null>(null)

  const [selfieUri, setSelfieUri] = useState<string | null>(null)
  const [selfieBase64, setSelfieBase64] = useState<string | null>(null)
  const [selfieChecked, setSelfieChecked] = useState(false)
  const [hasTakenSelfie, setHasTakenSelfie] = useState(false)

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
        accuracy: Location.Accuracy.BestForNavigation,
        timeInterval: 2000,
        distanceInterval: 1,
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

  const ensureCameraPermission = useCallback(async () => {
    if (!cameraPermission?.granted) {
      const result = await requestCameraPermission()
      return result.granted
    }
    return true
  }, [cameraPermission?.granted, requestCameraPermission])

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

    const defaultLokasiId = user?.id_lokasi_absen_default

    if (defaultLokasiId) {
      const defaultLokasi = list.find(
        (item) => String(item.id_lokasi) === String(defaultLokasiId)
      )

      if (defaultLokasi) {
        setSelectedLokasi(defaultLokasi)
        return
      }
    }

    setSelectedLokasi((prev) => {
      if (!prev) return list[0] || null

      const existingSelected = list.find(
        (item) => String(item.id_lokasi) === String(prev.id_lokasi)
      )

      return existingSelected || list[0] || null
    })
  }, [user?.id_lokasi_absen_default])

  const resetScreenState = useCallback(() => {
    setSelfieUri(null)
    setSelfieBase64(null)
    setSelfieChecked(false)
    setCameraLoading(false)
    setCameraReady(false)
    setHasTakenSelfie(false)
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
      resetScreenState()
      await Promise.all([getLatestLocation(), loadInitialData()])
    } catch (error: any) {
      Alert.alert('Error', error?.message || 'Gagal refresh data absensi.')
    } finally {
      setRefreshing(false)
    }
  }, [getLatestLocation, loadInitialData, resetScreenState])

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

  useEffect(() => {
    const prepareCamera = async () => {
      if (!selectedLokasi) return

      setCameraReady(false)
      const granted = await ensureCameraPermission()
      if (granted) {
        setCameraReady(true)
      }
    }

    prepareCamera()
  }, [selectedLokasi, ensureCameraPermission])

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

  const dynamicDistanceText = useMemo(() => {
    if (!selectedLokasi || distanceMeter === null) return '-'
    return `${distanceMeter.toFixed(2)} meter`
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
            distance: res.data?.distance_meter?.toString() || distance.toFixed(2),
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

  const handleSelectLokasi = useCallback(async (item: LokasiAbsensi) => {
    setSelectedLokasi(item)
    setSelfieUri(null)
    setSelfieBase64(null)
    setSelfieChecked(false)
    setCameraReady(false)
    setHasTakenSelfie(false)
  }, [])

  const handleTakeSelfie = useCallback(async () => {
    try {
      const granted = await ensureCameraPermission()
      if (!granted) {
        Alert.alert('Izin Kamera', 'Aplikasi membutuhkan akses kamera untuk selfie absensi.')
        return
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
      setHasTakenSelfie(true)

      if (!withinRadius) {
        Alert.alert(
          'Informasi',
          `Anda di luar jangkauan. Jarak Anda ${finalDistance.toFixed(2)} meter, maksimal radius ${selectedLokasi.radius_meter} meter.`,
          [
            {
              text: 'OK',
              onPress: () => {
                setSelfieUri(null)
                setSelfieBase64(null)
                setCameraReady(false)

                requestAnimationFrame(() => {
                  setCameraReady(true)
                })
              },
            },
          ]
        )
        return
      }

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
  }, [ensureCameraPermission, getLatestLocation, selectedLokasi, submitAbsensi])

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
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

      <View style={styles.headerBackground}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <View>
            <Text style={styles.headerSubtitle}></Text>
            <Text style={styles.headerTitle}>Absensi Pegawai</Text>
          </View>
        </View>
      </View>

      <View style={styles.contentContainer}>
        <ScrollView
          contentContainerStyle={styles.container}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          <View style={styles.profileCard}>
            <Text style={styles.profileName}>{user?.nama_pegawai || '-'}</Text>
          </View>

          <View style={styles.timeCard}>
            <Text style={styles.timeValue}>{currentTime || '-'}</Text>
            <Text style={styles.distanceDynamicText}>
              Jarak ke lokasi: {dynamicDistanceText}
            </Text>
          </View>

          <View style={styles.card}>
            <View style={styles.cameraBox}>
              {selfieUri ? (
                <Image source={{ uri: selfieUri }} style={styles.previewImage} />
              ) : cameraPermission?.granted && selectedLokasi ? (
                <CameraView
                  ref={cameraRef}
                  style={styles.camera}
                  facing="front"
                  onCameraReady={() => setCameraReady(true)}
                />
              ) : (
                <View style={styles.cameraPlaceholder}>
                  <Ionicons name="camera-outline" size={42} color="#FFF" />
                  <Text style={styles.cameraPlaceholderText}>
                    {selectedLokasi
                      ? 'Izinkan kamera untuk mulai selfie absensi'
                      : 'Pilih lokasi kantor terlebih dahulu agar kamera siap'}
                  </Text>

                  {selectedLokasi && (
                    <TouchableOpacity
                      style={styles.permissionButton}
                      onPress={async () => {
                        const granted = await ensureCameraPermission()
                        if (granted) setCameraReady(true)
                      }}
                    >
                      <Text style={styles.permissionButtonText}>Izinkan Kamera</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </View>

            <TouchableOpacity
              style={[
                styles.selfieButton,
                (!selectedLokasi || !cameraReady || cameraLoading || submitting) &&
                  styles.selfieButtonDisabled,
              ]}
              onPress={handleTakeSelfie}
              disabled={!selectedLokasi || !cameraReady || cameraLoading || submitting}
            >
              {cameraLoading || submitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.selfieButtonText}>
                  {hasTakenSelfie ? 'Ambil Ulang Selfie' : 'Ambil Selfie'}
                </Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Lokasi Kantor</Text>
            <LokasiPicker
              lokasiList={lokasiList}
              selectedLokasi={selectedLokasi}
              onSelect={handleSelectLokasi}
            />

            <View style={styles.jarakCardWrapper}>
              <JarakInfoCard
                currentLocation={currentLocation}
                selectedLokasi={selectedLokasi}
                distanceMeter={distanceMeter}
                isWithinRadius={selfieChecked ? isWithinRadius : false}
              />
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Lokasi Selfie</Text>
            <AbsensiMap currentLocation={currentLocation} selectedLokasi={selectedLokasi} />
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  )
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
  container: {
    padding: 20,
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

  profileCard: {
    backgroundColor: '#FFF',
    paddingVertical: 18,
    paddingHorizontal: 18,
    borderRadius: 22,
    marginBottom: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 10,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.primary,
    textAlign: 'center',
  },

  timeCard: {
    backgroundColor: '#FFF',
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
  },
  timeValue: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.primary,
    letterSpacing: 1,
  },
  coordinateText: {
    fontSize: 14,
    color: '#111827',
    marginTop: 4,
    fontWeight: '600',
  },
  distanceDynamicText: {
    fontSize: 14,
    color: COLORS.primary,
    marginTop: 8,
    fontWeight: '700',
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
    color: '#0f172a',
  },

  card: {
    backgroundColor: '#FFF',
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
  },

  cameraBox: {
    height: 360,
    borderRadius: 20,
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
    color: '#FFF',
    textAlign: 'center',
    marginTop: 12,
    marginBottom: 14,
    lineHeight: 20,
  },
  permissionButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 12,
  },
  permissionButtonText: {
    color: '#FFF',
    fontWeight: '700',
  },

  selfieButton: {
    marginTop: 14,
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  selfieButtonDisabled: {
    backgroundColor: '#94A3B8',
  },
  selfieButtonText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 15,
  },

  jarakCardWrapper: {
    marginTop: 14,
  },
})