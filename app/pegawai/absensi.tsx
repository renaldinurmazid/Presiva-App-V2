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
  ScrollView,
  Image,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { Swipeable } from 'react-native-gesture-handler'

import { COLORS } from '@/constants/colors'
import { useAuthStore } from '@/store/auth.store'
import { api, setAuthToken } from '@/services/api'

type AbsensiItem = {
  id_absensi: number | string
  id_lokasi: number | string
  nama_lokasi: string
  tanggal: string
  waktu_absensi: string
  latitude: string
  longitude: string
  distance_meter: string
  foto_absensi: string
  device_info: string
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

function formatTanggalIndonesia(dateStr: string) {
  if (!dateStr) return '-'
  const date = new Date(`${dateStr}T00:00:00`)
  const bulan = [
    'Januari',
    'Februari',
    'Maret',
    'April',
    'Mei',
    'Juni',
    'Juli',
    'Agustus',
    'September',
    'Oktober',
    'November',
    'Desember',
  ]
  const dd = String(date.getDate()).padStart(2, '0')
  const mm = bulan[date.getMonth()] || '-'
  const yyyy = date.getFullYear()
  return `${dd} ${mm} ${yyyy}`
}

export default function AbsensiScreen() {
  const router = useRouter()
  const user = useAuthStore((state) => state.user)
  const clearSession = useAuthStore((state) => state.clearSession)

  const namaMitra =
    (user as any)?.nama_mitra ||
    (user as any)?.mitra?.nama_mitra ||
    '-'

  const namaPegawai =
    (user as any)?.nama_pegawai ||
    (user as any)?.pegawai?.nama_pegawai ||
    '-'

  const FOTO_BASE_URL = 'https://gosukses.com/'

  const [list, setList] = useState<AbsensiItem[]>([])
  const [loading, setLoading] = useState(true)

  const [modalVisible, setModalVisible] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editingItem, setEditingItem] = useState<AbsensiItem | null>(null)

  const [tanggal, setTanggal] = useState('')
  const [waktuAbsensi, setWaktuAbsensi] = useState('')
  const [namaLokasi, setNamaLokasi] = useState('')
  const [latitude, setLatitude] = useState('')
  const [longitude, setLongitude] = useState('')
  const [distanceMeter, setDistanceMeter] = useState('')
  const [fotoAbsensi, setFotoAbsensi] = useState('')
  const [deviceInfo, setDeviceInfo] = useState('')
  const [remark, setRemark] = useState('')

  const handleUnauthorized = async () => {
    await clearSession()
    setAuthToken(undefined)
    Alert.alert('Session Expired', 'Silakan login kembali.')
    router.replace('/auth/login')
  }

  const loadData = async () => {
    try {
      setLoading(true)

      const res = await api.get('/pegawai/absensi/list.php')

      if (!res?.data?.success) {
        throw new Error(res?.data?.message || 'Gagal mengambil data absensi.')
      }

      setList(Array.isArray(res.data.data) ? res.data.data : [])
    } catch (error: any) {
      console.log('PEGAWAI ABSENSI LIST ERROR:', error?.response?.data || error?.message)

      if (error?.response?.status === 401) {
        await handleUnauthorized()
        return
      }

      Alert.alert(
        'Error',
        error?.response?.data?.message ||
          error?.message ||
          'Gagal mengambil data absensi.'
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const resetForm = () => {
    setEditingItem(null)
    setTanggal('')
    setWaktuAbsensi('')
    setNamaLokasi('')
    setLatitude('')
    setLongitude('')
    setDistanceMeter('')
    setFotoAbsensi('')
    setDeviceInfo('')
    setRemark('')
  }

  const openEditModal = (item: AbsensiItem) => {
    setEditingItem(item)
    setTanggal(item.tanggal || '')
    setWaktuAbsensi(item.waktu_absensi || '')
    setNamaLokasi(item.nama_lokasi || '')
    setLatitude(item.latitude || '')
    setLongitude(item.longitude || '')
    setDistanceMeter(item.distance_meter || '')
    setFotoAbsensi(item.foto_absensi || '')
    setDeviceInfo(item.device_info || '')
    setRemark(item.remark || '')
    setModalVisible(true)
  }

  const closeModal = () => {
    if (saving) return
    setModalVisible(false)
    resetForm()
  }

  const handleDelete = (item: AbsensiItem) => {
    Alert.alert(
      'Hapus Absensi',
      `Yakin ingin menghapus absensi tanggal "${formatTanggalIndonesia(item.tanggal)}"?`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: async () => {
            try {
              const res = await api.post('/pegawai/absensi/delete.php', {
                id_absensi: item.id_absensi,
              })

              if (!res?.data?.success) {
                Alert.alert('Gagal', res?.data?.message || 'Gagal menghapus absensi.')
                return
              }

              setList((prev) =>
                prev.filter((x) => String(x.id_absensi) !== String(item.id_absensi))
              )
            } catch (error: any) {
              console.log('PEGAWAI ABSENSI DELETE ERROR:', error?.response?.data || error?.message)

              if (error?.response?.status === 401) {
                await handleUnauthorized()
                return
              }

              Alert.alert(
                'Error',
                error?.response?.data?.message ||
                  error?.message ||
                  'Terjadi kesalahan saat menghapus absensi.'
              )
            }
          },
        },
      ]
    )
  }

  const renderRightActions = (item: AbsensiItem) => (
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
    item: AbsensiItem
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
            <Ionicons name="finger-print-outline" size={24} color={COLORS.primary} />
          </View>

          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>{formatTanggalIndonesia(item.tanggal)}</Text>
            <Text style={styles.cardSubtitle} numberOfLines={4}>
              Waktu: {item.waktu_absensi?.trim() ? item.waktu_absensi : '-'}
              {'\n'}
              Lokasi: {item.nama_lokasi?.trim() ? item.nama_lokasi : '-'}
              {'\n'}
              Jarak: {item.distance_meter?.trim() ? `${item.distance_meter} m` : '-'}
              {'\n'}
              {item.remark?.trim() ? item.remark : 'Tanpa remark'}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.editButton}
            onPress={() => openEditModal(item)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="eye-outline" size={20} color={COLORS.accentOrange} />
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
          <Text style={styles.headerTitle}>Absensi</Text>
          <Text style={styles.headerSubtitle}>{namaPegawai}</Text>
          <Text style={styles.headerSubtitle}>{namaMitra}</Text>
        </View>
      </View>

      <View style={styles.contentContainer}>
        <View style={styles.content}>
          {loading ? (
            <View style={styles.centerState}>
              <ActivityIndicator size="large" color={COLORS.primary} />
              <Text style={styles.centerStateText}>Memuat data absensi...</Text>
            </View>
          ) : list.length === 0 ? (
            <View style={styles.centerState}>
              <Ionicons name="finger-print-outline" size={48} color="#9CA3AF" />
              <Text style={styles.centerStateTitle}>Belum ada data absensi</Text>
              <Text style={styles.centerStateText}>
                Data absensi pegawai belum tersedia.
              </Text>
            </View>
          ) : (
            <FlatList
              data={list}
              keyExtractor={(item) => String(item.id_absensi)}
              renderItem={renderItem}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.listContent}
            />
          )}
        </View>

        <TouchableOpacity
          style={styles.floatingHome}
          onPress={() => router.replace('/(tabs)')}
          activeOpacity={0.8}
        >
          <Text style={styles.homeIcon}>🏠</Text>
        </TouchableOpacity>
      </View>

      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={closeModal}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Detail Absensi</Text>
              <TouchableOpacity onPress={closeModal} disabled={saving}>
                <Ionicons name="close-outline" size={26} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.infoUserLabel}>Pegawai Login</Text>
              <View style={styles.infoUserBox}>
                <Ionicons name="person-outline" size={18} color={COLORS.primary} />
                <Text style={styles.infoUserText}>{namaPegawai}</Text>
              </View>

              <TextInput
                placeholder="Tanggal"
                style={styles.input}
                placeholderTextColor="#999"
                value={tanggal}
                editable={false}
              />

              <TextInput
                placeholder="Waktu Absensi"
                style={styles.input}
                placeholderTextColor="#999"
                value={waktuAbsensi}
                editable={false}
              />

              <TextInput
                placeholder="Nama Lokasi"
                style={styles.input}
                placeholderTextColor="#999"
                value={namaLokasi}
                editable={false}
              />

              <View style={styles.rowTwoCol}>
                <TextInput
                  placeholder="Latitude"
                  style={[styles.input, styles.flexHalf]}
                  placeholderTextColor="#999"
                  value={latitude}
                  editable={false}
                />

                <TextInput
                  placeholder="Longitude"
                  style={[styles.input, styles.flexHalf]}
                  placeholderTextColor="#999"
                  value={longitude}
                  editable={false}
                />
              </View>

              <TextInput
                placeholder="Distance Meter"
                style={styles.input}
                placeholderTextColor="#999"
                value={distanceMeter}
                editable={false}
              />

              <Text style={styles.sectionLabel}>Foto Absensi</Text>
              {fotoAbsensi?.trim() ? (
                <View style={styles.photoPreviewWrap}>
                  <Image
                    source={{ uri: `${FOTO_BASE_URL}${fotoAbsensi}` }}
                    style={styles.photoPreview}
                    resizeMode="cover"
                  />
                </View>
              ) : (
                <View style={styles.photoEmptyBox}>
                  <Ionicons name="image-outline" size={24} color="#9CA3AF" />
                  <Text style={styles.photoEmptyText}>Foto absensi tidak tersedia</Text>
                </View>
              )}

              <TextInput
                placeholder="Device Info"
                style={[styles.input, styles.textArea]}
                placeholderTextColor="#999"
                value={deviceInfo}
                editable={false}
                multiline
              />

              <TextInput
                placeholder="Remark"
                style={[styles.input, styles.textArea]}
                placeholderTextColor="#999"
                value={remark}
                editable={false}
                multiline
              />

              <TouchableOpacity
                style={styles.cancelButton}
                onPress={closeModal}
                disabled={saving}
              >
                <Text style={styles.cancelButtonText}>Tutup</Text>
              </TouchableOpacity>
            </ScrollView>
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
    maxHeight: '90%',
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

  infoUserLabel: {
    marginBottom: 8,
    fontSize: 13,
    fontWeight: '700',
    color: '#374151',
  },

  infoUserBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#DBEAFE',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },

  infoUserText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
  },

  rowTwoCol: {
    flexDirection: 'row',
    gap: 10,
  },

  flexHalf: {
    flex: 1,
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
    backgroundColor: '#F9FAFB',
  },

  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },

  sectionLabel: {
    marginTop: 14,
    marginBottom: 8,
    fontSize: 13,
    fontWeight: '700',
    color: '#374151',
  },

  photoPreviewWrap: {
    marginTop: 10,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },

  photoPreview: {
    width: '100%',
    height: 220,
    backgroundColor: '#E5E7EB',
  },

  photoFileName: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 12,
    color: '#6B7280',
  },

  photoEmptyBox: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
    borderRadius: 14,
    paddingVertical: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F9FAFB',
  },

  photoEmptyText: {
    marginTop: 8,
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '600',
  },

  cancelButton: {
    marginTop: 18,
    alignItems: 'center',
    marginBottom: 8,
  },

  cancelButtonText: {
    color: '#6B7280',
    fontWeight: '700',
    fontSize: 14,
  },
})