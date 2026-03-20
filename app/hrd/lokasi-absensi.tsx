import React, { useEffect, useMemo, useRef, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Modal,
  TextInput,
  Alert,
  StatusBar,
  ActivityIndicator,
  Animated,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { Swipeable } from 'react-native-gesture-handler'
import * as Location from 'expo-location'

import { COLORS } from '@/constants/colors'
import { useAuthStore } from '@/store/auth.store'
import { api, setAuthToken } from '@/services/api'

type LokasiAbsensiItem = {
  id_lokasi: number | string
  nama_lokasi: string
  alamat: string | null
  latitude: number | string
  longitude: number | string
  radius_meter: number | string
  status_lokasi: 'AKTIF' | 'NONAKTIF'
  remark: string | null
}

function CardAnimated({
  children,
  index,
}: {
  children: React.ReactNode
  index: number
}) {
  const opacity = useRef(new Animated.Value(0)).current
  const translateY = useRef(new Animated.Value(18)).current

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 250,
        delay: index * 40,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 250,
        delay: index * 40,
        useNativeDriver: true,
      }),
    ]).start()
  }, [index, opacity, translateY])

  return (
    <Animated.View
      style={{
        opacity,
        transform: [{ translateY }],
      }}
    >
      {children}
    </Animated.View>
  )
}

export default function LokasiAbsensiScreen() {
  const router = useRouter()
  const user = useAuthStore((state) => state.user)
  const clearSession = useAuthStore((state) => state.clearSession)

  const namaMitra =
    (user as any)?.nama_mitra ||
    (user as any)?.mitra?.nama_mitra ||
    '-'

  const [statusFilter, setStatusFilter] = useState<'AKTIF' | 'NONAKTIF'>('AKTIF')
  const [list, setList] = useState<LokasiAbsensiItem[]>([])
  const [loading, setLoading] = useState(true)

  const [modalVisible, setModalVisible] = useState(false)
  const [saving, setSaving] = useState(false)
  const [gpsLoading, setGpsLoading] = useState(false)
  const [editingItem, setEditingItem] = useState<LokasiAbsensiItem | null>(null)

  const [namaLokasi, setNamaLokasi] = useState('')
  const [alamat, setAlamat] = useState('')
  const [latitude, setLatitude] = useState('')
  const [longitude, setLongitude] = useState('')
  const [radiusMeter, setRadiusMeter] = useState('100')
  const [statusLokasi, setStatusLokasi] = useState<'AKTIF' | 'NONAKTIF'>('AKTIF')
  const [remark, setRemark] = useState('')

  const canSave = useMemo(() => {
    return (
      namaLokasi.trim() !== '' &&
      latitude.trim() !== '' &&
      longitude.trim() !== '' &&
      radiusMeter.trim() !== ''
    )
  }, [namaLokasi, latitude, longitude, radiusMeter])

  const handleUnauthorized = async () => {
    await clearSession()
    setAuthToken(undefined)
    Alert.alert('Session Expired', 'Silakan login kembali.')
    router.replace('/auth/login')
  }

  const loadData = async () => {
    try {
      setLoading(true)

      const res = await api.get(
        `/hrd/lokasi-absensi/list.php?status=${statusFilter}`
      )

      if (!res?.data?.success) {
        throw new Error(res?.data?.message || 'Gagal mengambil data lokasi absensi.')
      }

      setList(Array.isArray(res.data.data) ? res.data.data : [])
    } catch (error: any) {
      console.log('HRD LOKASI LIST ERROR:', error?.response?.data || error?.message)

      if (error?.response?.status === 401) {
        await handleUnauthorized()
        return
      }

      Alert.alert(
        'Error',
        error?.response?.data?.message ||
          error?.message ||
          'Gagal mengambil data lokasi absensi.'
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [statusFilter])

  const handleGetCurrentLocation = async () => {
    try {
      setGpsLoading(true)

      const permission = await Location.requestForegroundPermissionsAsync()

      if (permission.status !== 'granted') {
        Alert.alert(
          'Izin Lokasi',
          'Izin lokasi ditolak. Anda masih bisa isi latitude dan longitude manual.'
        )
        return
      }

      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      })

      setLatitude(String(loc.coords.latitude))
      setLongitude(String(loc.coords.longitude))

      Alert.alert('Berhasil', 'Lokasi berhasil diambil dari GPS.')
    } catch (error: any) {
      Alert.alert(
        'GPS Gagal',
        error?.message || 'Tidak bisa mengambil lokasi saat ini. Silakan isi manual.'
      )
    } finally {
      setGpsLoading(false)
    }
  }

  const openAddModal = () => {
    setEditingItem(null)
    setNamaLokasi('')
    setAlamat('')
    setLatitude('')
    setLongitude('')
    setRadiusMeter('100')
    setStatusLokasi('AKTIF')
    setRemark('')
    setModalVisible(true)
  }

  const openEditModal = (item: LokasiAbsensiItem) => {
    setEditingItem(item)
    setNamaLokasi(item.nama_lokasi || '')
    setAlamat(item.alamat || '')
    setLatitude(String(item.latitude || ''))
    setLongitude(String(item.longitude || ''))
    setRadiusMeter(String(item.radius_meter || '100'))
    setStatusLokasi(item.status_lokasi || 'AKTIF')
    setRemark(item.remark || '')
    setModalVisible(true)
  }

  const closeModal = () => {
    if (saving || gpsLoading) return
    setModalVisible(false)
    setEditingItem(null)
    setNamaLokasi('')
    setAlamat('')
    setLatitude('')
    setLongitude('')
    setRadiusMeter('100')
    setStatusLokasi('AKTIF')
    setRemark('')
  }

  const handleSave = async () => {
    if (!canSave) {
      Alert.alert('Validasi', 'Nama lokasi, latitude, longitude, dan radius wajib diisi.')
      return
    }

    const latNum = Number(latitude)
    const lngNum = Number(longitude)
    const radiusNum = Number(radiusMeter)

    if (Number.isNaN(latNum) || Number.isNaN(lngNum)) {
      Alert.alert('Validasi', 'Latitude dan longitude harus berupa angka yang valid.')
      return
    }

    if (Number.isNaN(radiusNum) || radiusNum <= 0) {
      Alert.alert('Validasi', 'Radius meter harus lebih dari 0.')
      return
    }

    try {
      setSaving(true)

      const payload = {
        id_lokasi: editingItem?.id_lokasi,
        nama_lokasi: namaLokasi.trim(),
        alamat: alamat.trim(),
        latitude: latNum,
        longitude: lngNum,
        radius_meter: radiusNum,
        status_lokasi: statusLokasi,
        remark: remark.trim(),
      }

      const endpoint = editingItem
        ? '/hrd/lokasi-absensi/update.php'
        : '/hrd/lokasi-absensi/create.php'

      const res = await api.post(endpoint, payload)

      if (!res?.data?.success) {
        Alert.alert('Gagal', res?.data?.message || 'Gagal menyimpan lokasi absensi.')
        return
      }

      closeModal()
      await loadData()
    } catch (error: any) {
      console.log('HRD LOKASI SAVE ERROR:', error?.response?.data || error?.message)

      if (error?.response?.status === 401) {
        await handleUnauthorized()
        return
      }

      Alert.alert(
        'Error',
        error?.response?.data?.message ||
          error?.message ||
          'Terjadi kesalahan saat menyimpan lokasi absensi.'
      )
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = (item: LokasiAbsensiItem) => {
    Alert.alert(
      'Hapus Lokasi',
      `Yakin ingin menghapus lokasi ${item.nama_lokasi}?`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: async () => {
            try {
              const res = await api.post('/hrd/lokasi-absensi/delete.php', {
                id_lokasi: item.id_lokasi,
              })

              if (!res?.data?.success) {
                Alert.alert('Gagal', res?.data?.message || 'Gagal menghapus lokasi.')
                return
              }

              setList((prev) =>
                prev.filter((x) => String(x.id_lokasi) !== String(item.id_lokasi))
              )
            } catch (error: any) {
              console.log('HRD LOKASI DELETE ERROR:', error?.response?.data || error?.message)

              if (error?.response?.status === 401) {
                await handleUnauthorized()
                return
              }

              Alert.alert(
                'Error',
                error?.response?.data?.message ||
                  error?.message ||
                  'Terjadi kesalahan saat menghapus lokasi.'
              )
            }
          },
        },
      ]
    )
  }

  const renderRightActions = (item: LokasiAbsensiItem) => (
    <TouchableOpacity
      style={styles.deleteSwipeAction}
      onPress={() => handleDelete(item)}
      activeOpacity={0.85}
    >
      <Ionicons name="trash-outline" size={22} color="#FFF" />
      <Text style={styles.deleteSwipeText}>Hapus</Text>
    </TouchableOpacity>
  )

  const renderItem = ({
    item,
    index,
  }: {
    item: LokasiAbsensiItem
    index: number
  }) => (
    <CardAnimated index={index}>
      <Swipeable renderRightActions={() => renderRightActions(item)} overshootRight={false}>
        <TouchableOpacity
          style={styles.card}
          activeOpacity={0.92}
          onPress={() => openEditModal(item)}
        >
          <View style={styles.cardIconWrap}>
            <Ionicons name="location-outline" size={24} color={COLORS.primary} />
          </View>

          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>{item.nama_lokasi}</Text>
            <Text style={styles.cardSubtitle}>
              {item.alamat?.trim() ? item.alamat : 'Alamat belum diisi'}
            </Text>

            <Text style={styles.cardMeta}>
              Lat: {item.latitude} | Lng: {item.longitude}
            </Text>

            <Text style={styles.cardMeta}>
              Radius: {item.radius_meter} m
            </Text>

            <View
              style={[
                styles.statusBadge,
                item.status_lokasi === 'AKTIF'
                  ? styles.statusAktif
                  : styles.statusNonaktif,
              ]}
            >
              <Text style={styles.statusBadgeText}>{item.status_lokasi}</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.editButton}
            onPress={() => openEditModal(item)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="create-outline" size={20} color={COLORS.accentOrange} />
          </TouchableOpacity>
        </TouchableOpacity>
      </Swipeable>
    </CardAnimated>
  )

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

      <View style={styles.headerBackground}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Lokasi Absen</Text>
          <Text style={styles.headerSubtitle}>{namaMitra}</Text>
        </View>
      </View>

      <View style={styles.contentContainer}>
        <View style={styles.content}>
          <View style={styles.topBar}>
            <View style={styles.filterWrap}>
              <TouchableOpacity
                style={[
                  styles.filterBtn,
                  statusFilter === 'AKTIF' && styles.filterActive,
                ]}
                onPress={() => setStatusFilter('AKTIF')}
              >
                <Text
                  style={[
                    styles.filterText,
                    statusFilter === 'AKTIF' && styles.filterTextActive,
                  ]}
                >
                  AKTIF
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.filterBtn,
                  statusFilter === 'NONAKTIF' && styles.filterActive,
                ]}
                onPress={() => setStatusFilter('NONAKTIF')}
              >
                <Text
                  style={[
                    styles.filterText,
                    statusFilter === 'NONAKTIF' && styles.filterTextActive,
                  ]}
                >
                  NONAKTIF
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.addButton} onPress={openAddModal}>
              <Ionicons name="add" size={18} color="#FFF" />
              <Text style={styles.addButtonText}>Tambah</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.centerState}>
              <ActivityIndicator size="large" color={COLORS.primary} />
              <Text style={styles.centerStateText}>Memuat lokasi absensi...</Text>
            </View>
          ) : list.length === 0 ? (
            <View style={styles.centerState}>
              <Ionicons name="location-outline" size={48} color="#9CA3AF" />
              <Text style={styles.centerStateTitle}>Belum ada lokasi absensi</Text>
              <Text style={styles.centerStateText}>
                Tambahkan data lokasi absensi untuk status {statusFilter.toLowerCase()}.
              </Text>
            </View>
          ) : (
            <FlatList
              data={list}
              keyExtractor={(item) => String(item.id_lokasi)}
              renderItem={renderItem}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.listContent}
            />
          )}
        </View>

        <TouchableOpacity
          style={styles.floatingHome}
          onPress={() => router.replace('/hrd')}
          activeOpacity={0.8}
        >
          <Text style={styles.homeIcon}>🏠</Text>
        </TouchableOpacity>
      </View>

      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={closeModal}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingItem ? 'Update Lokasi Absen' : 'Tambah Lokasi Absen'}
              </Text>
              <TouchableOpacity onPress={closeModal} disabled={saving || gpsLoading}>
                <Ionicons name="close-outline" size={26} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <TextInput
              placeholder="Nama Lokasi"
              style={styles.input}
              placeholderTextColor="#999"
              value={namaLokasi}
              onChangeText={setNamaLokasi}
              editable={!saving && !gpsLoading}
            />

            <TextInput
              placeholder="Alamat"
              style={[styles.input, styles.textArea]}
              placeholderTextColor="#999"
              value={alamat}
              onChangeText={setAlamat}
              editable={!saving && !gpsLoading}
              multiline
            />

            <TouchableOpacity
              style={[styles.gpsButton, gpsLoading && styles.gpsButtonDisabled]}
              onPress={handleGetCurrentLocation}
              disabled={gpsLoading || saving}
            >
              {gpsLoading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <>
                  <Ionicons name="locate-outline" size={18} color="#FFF" />
                  <Text style={styles.gpsButtonText}>Ambil Lokasi Saya</Text>
                </>
              )}
            </TouchableOpacity>

            <TextInput
              placeholder="Latitude"
              style={styles.input}
              placeholderTextColor="#999"
              value={latitude}
              onChangeText={setLatitude}
              editable={!saving && !gpsLoading}
              keyboardType="numeric"
            />

            <TextInput
              placeholder="Longitude"
              style={styles.input}
              placeholderTextColor="#999"
              value={longitude}
              onChangeText={setLongitude}
              editable={!saving && !gpsLoading}
              keyboardType="numeric"
            />

            <TextInput
              placeholder="Radius Meter"
              style={styles.input}
              placeholderTextColor="#999"
              value={radiusMeter}
              onChangeText={setRadiusMeter}
              editable={!saving && !gpsLoading}
              keyboardType="numeric"
            />

            <View style={styles.statusSwitchWrap}>
              <TouchableOpacity
                style={[
                  styles.statusSwitchBtn,
                  statusLokasi === 'AKTIF' && styles.statusSwitchActive,
                ]}
                onPress={() => setStatusLokasi('AKTIF')}
                disabled={saving || gpsLoading}
              >
                <Text
                  style={[
                    styles.statusSwitchText,
                    statusLokasi === 'AKTIF' && styles.statusSwitchTextActive,
                  ]}
                >
                  AKTIF
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.statusSwitchBtn,
                  statusLokasi === 'NONAKTIF' && styles.statusSwitchActive,
                ]}
                onPress={() => setStatusLokasi('NONAKTIF')}
                disabled={saving || gpsLoading}
              >
                <Text
                  style={[
                    styles.statusSwitchText,
                    statusLokasi === 'NONAKTIF' && styles.statusSwitchTextActive,
                  ]}
                >
                  NONAKTIF
                </Text>
              </TouchableOpacity>
            </View>

            <TextInput
              placeholder="Remark"
              style={[styles.input, styles.textArea]}
              placeholderTextColor="#999"
              value={remark}
              onChangeText={setRemark}
              editable={!saving && !gpsLoading}
              multiline
            />

            <TouchableOpacity
              style={[styles.saveButton, (saving || gpsLoading) && styles.saveButtonDisabled]}
              onPress={handleSave}
              disabled={saving || gpsLoading}
            >
              {saving ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.saveButtonText}>
                  {editingItem ? 'UPDATE' : 'SIMPAN'}
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={closeModal}
              disabled={saving || gpsLoading}
            >
              <Text style={styles.cancelButtonText}>Batal</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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

  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 18,
  },

  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFF',
  },

  headerSubtitle: {
    marginTop: 4,
    fontSize: 14,
    color: '#E5E7EB',
  },

  contentContainer: {
    flex: 1,
    backgroundColor: '#f5f7fb',
    borderTopLeftRadius: 34,
    marginTop: -6,
    paddingTop: 8,
  },

  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
  },

  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
    gap: 12,
  },

  filterWrap: {
    flexDirection: 'row',
    flex: 1,
    gap: 10,
  },

  filterBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
  },

  filterActive: {
    backgroundColor: COLORS.primary,
  },

  filterText: {
    fontWeight: '700',
    color: '#111827',
    fontSize: 13,
  },

  filterTextActive: {
    color: '#FFF',
  },

  addButton: {
    backgroundColor: COLORS.accentOrange,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },

  addButtonText: {
    color: '#FFF',
    fontWeight: '800',
    fontSize: 13,
  },

  listContent: {
    paddingBottom: 100,
  },

  card: {
    backgroundColor: '#FFF',
    borderRadius: 22,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },

  cardIconWrap: {
    width: 54,
    height: 54,
    borderRadius: 16,
    backgroundColor: '#EAF3FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },

  cardContent: {
    flex: 1,
  },

  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
  },

  cardSubtitle: {
    marginTop: 4,
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
  },

  cardMeta: {
    marginTop: 4,
    fontSize: 12,
    color: '#374151',
  },

  statusBadge: {
    marginTop: 8,
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },

  statusAktif: {
    backgroundColor: '#DCFCE7',
  },

  statusNonaktif: {
    backgroundColor: '#FEE2E2',
  },

  statusBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#111827',
  },

  editButton: {
    paddingLeft: 12,
    alignSelf: 'center',
  },

  deleteSwipeAction: {
    width: 96,
    marginBottom: 12,
    borderRadius: 22,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
  },

  deleteSwipeText: {
    color: '#FFF',
    marginTop: 4,
    fontWeight: '700',
    fontSize: 12,
  },

  centerState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },

  centerStateTitle: {
    marginTop: 12,
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
  },

  centerStateText: {
    marginTop: 6,
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
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

  modalOverlay: {
    flex: 1,
    backgroundColor: '#00000066',
    justifyContent: 'center',
    padding: 18,
  },

  modalCard: {
    backgroundColor: '#FFF',
    borderRadius: 22,
    padding: 18,
  },

  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },

  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
  },

  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: COLORS.textPrimary,
    marginTop: 10,
  },

  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },

  gpsButton: {
    marginTop: 12,
    backgroundColor: COLORS.accentOrange,
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },

  gpsButtonDisabled: {
    opacity: 0.7,
  },

  gpsButtonText: {
    color: '#FFF',
    fontWeight: '800',
    fontSize: 14,
  },

  statusSwitchWrap: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },

  statusSwitchBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
  },

  statusSwitchActive: {
    backgroundColor: COLORS.primary,
  },

  statusSwitchText: {
    fontWeight: '700',
    fontSize: 13,
    color: '#111827',
  },

  statusSwitchTextActive: {
    color: '#FFF',
  },

  saveButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 16,
  },

  saveButtonDisabled: {
    opacity: 0.7,
  },

  saveButtonText: {
    color: '#FFF',
    fontWeight: '800',
    fontSize: 14,
  },

  cancelButton: {
    marginTop: 14,
    alignItems: 'center',
  },

  cancelButtonText: {
    color: '#6B7280',
    fontWeight: '700',
    fontSize: 14,
  },
})