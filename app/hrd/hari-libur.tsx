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
  Platform,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import DateTimePicker from '@react-native-community/datetimepicker'
import { Swipeable } from 'react-native-gesture-handler'

import { COLORS } from '@/constants/colors'
import { useAuthStore } from '@/store/auth.store'
import { api, setAuthToken } from '@/services/api'

type HariLiburItem = {
  id: number | string
  tanggal: string
  remark: string | null
}

const BULAN_ID = [
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

const HARI_ID = [
  'Minggu',
  'Senin',
  'Selasa',
  'Rabu',
  'Kamis',
  'Jumat',
  'Sabtu',
]

function getHariIndonesia(dateStr: string) {
  const date = new Date(`${dateStr}T00:00:00`)
  return HARI_ID[date.getDay()]
}

function formatTanggalIndonesia(dateStr: string) {
  const date = new Date(`${dateStr}T00:00:00`)
  const dd = String(date.getDate()).padStart(2, '0')
  const mm = BULAN_ID[date.getMonth()]
  const yyyy = date.getFullYear()
  return `${dd} ${mm} ${yyyy}`
}

function toInputDate(date: Date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
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

export default function HariLiburScreen() {
  const router = useRouter()
  const user = useAuthStore((state) => state.user)
  const clearSession = useAuthStore((state) => state.clearSession)

  const namaMitra =
    (user as any)?.nama_mitra ||
    (user as any)?.mitra?.nama_mitra ||
    '-'

  const [tahun, setTahun] = useState(new Date().getFullYear())
  const [list, setList] = useState<HariLiburItem[]>([])
  const [loading, setLoading] = useState(true)

  const [modalVisible, setModalVisible] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editingItem, setEditingItem] = useState<HariLiburItem | null>(null)

  const [tanggal, setTanggal] = useState('')
  const [remark, setRemark] = useState('')
  const [showDatePicker, setShowDatePicker] = useState(false)

  const selectedDate = useMemo(() => {
    if (!tanggal) return new Date()
    const parsed = new Date(`${tanggal}T00:00:00`)
    return Number.isNaN(parsed.getTime()) ? new Date() : parsed
  }, [tanggal])

  const handleUnauthorized = async () => {
    await clearSession()
    setAuthToken(undefined)
    Alert.alert('Session Expired', 'Silakan login kembali.')
    router.replace('/auth/login')
  }

  const loadData = async () => {
    try {
      setLoading(true)

      const res = await api.get(`/hrd/tanggal-libur/list.php?tahun=${tahun}`)

      if (!res?.data?.success) {
        throw new Error(res?.data?.message || 'Gagal mengambil data hari libur.')
      }

      const result = Array.isArray(res.data.data) ? res.data.data : []
      setList(result)
    } catch (error: any) {
      console.log('HRD HARI LIBUR LIST ERROR:', error?.response?.data || error?.message)

      if (error?.response?.status === 401) {
        await handleUnauthorized()
        return
      }

      Alert.alert(
        'Error',
        error?.response?.data?.message || error?.message || 'Gagal mengambil data hari libur.'
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [tahun])

  const openAddModal = () => {
    setEditingItem(null)
    setTanggal('')
    setRemark('')
    setShowDatePicker(false)
    setModalVisible(true)
  }

  const openEditModal = (item: HariLiburItem) => {
    setEditingItem(item)
    setTanggal(item.tanggal)
    setRemark(item.remark || '')
    setShowDatePicker(false)
    setModalVisible(true)
  }

  const closeModal = () => {
    if (saving) return
    setModalVisible(false)
    setEditingItem(null)
    setTanggal('')
    setRemark('')
    setShowDatePicker(false)
  }

  const handleSave = async () => {
    if (!tanggal) {
      Alert.alert('Validasi', 'Tanggal wajib diisi.')
      return
    }

    try {
      setSaving(true)

      const payload = {
        id: editingItem?.id,
        tanggal,
        remark: remark.trim(),
      }

      const endpoint = editingItem
        ? '/hrd/tanggal-libur/update.php'
        : '/hrd/tanggal-libur/create.php'

      const res = await api.post(endpoint, payload)

      if (!res?.data?.success) {
        Alert.alert('Gagal', res?.data?.message || 'Gagal menyimpan data.')
        return
      }

      closeModal()
      await loadData()
    } catch (error: any) {
      console.log('HRD HARI LIBUR SAVE ERROR:', error?.response?.data || error?.message)

      if (error?.response?.status === 401) {
        await handleUnauthorized()
        return
      }

      Alert.alert(
        'Error',
        error?.response?.data?.message || error?.message || 'Terjadi kesalahan saat menyimpan.'
      )
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = (item: HariLiburItem) => {
    Alert.alert(
      'Hapus Hari Libur',
      `Yakin ingin menghapus hari libur ${formatTanggalIndonesia(item.tanggal)}?`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: async () => {
            try {
              const res = await api.post('/hrd/tanggal-libur/delete.php', {
                id: item.id,
              })

              if (!res?.data?.success) {
                Alert.alert('Gagal', res?.data?.message || 'Gagal menghapus data.')
                return
              }

              setList((prev) => prev.filter((x) => String(x.id) !== String(item.id)))
            } catch (error: any) {
              console.log('HRD HARI LIBUR DELETE ERROR:', error?.response?.data || error?.message)

              if (error?.response?.status === 401) {
                await handleUnauthorized()
                return
              }

              Alert.alert(
                'Error',
                error?.response?.data?.message || error?.message || 'Terjadi kesalahan saat menghapus.'
              )
            }
          },
        },
      ]
    )
  }

  const handleDeleteFromModal = () => {
    if (!editingItem) return

    Alert.alert(
      'Hapus Hari Libur',
      `Yakin ingin menghapus hari libur ${formatTanggalIndonesia(editingItem.tanggal)}?`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: async () => {
            try {
              setSaving(true)

              const res = await api.post('/hrd/tanggal-libur/delete.php', {
                id: editingItem.id,
              })

              if (!res?.data?.success) {
                Alert.alert('Gagal', res?.data?.message || 'Gagal menghapus data.')
                return
              }

              const deletedId = editingItem.id
              closeModal()
              setList((prev) => prev.filter((x) => String(x.id) !== String(deletedId)))
            } catch (error: any) {
              console.log(
                'HRD HARI LIBUR DELETE FROM MODAL ERROR:',
                error?.response?.data || error?.message
              )

              if (error?.response?.status === 401) {
                await handleUnauthorized()
                return
              }

              Alert.alert(
                'Error',
                error?.response?.data?.message || error?.message || 'Terjadi kesalahan saat menghapus.'
              )
            } finally {
              setSaving(false)
            }
          },
        },
      ]
    )
  }

  const renderRightActions = (item: HariLiburItem) => (
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
    item: HariLiburItem
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
            <Ionicons name="calendar-outline" size={24} color={COLORS.primary} />
          </View>

          <View style={styles.cardContent}>
            <Text style={styles.cardDate}>{formatTanggalIndonesia(item.tanggal)}</Text>
            <Text style={styles.cardDay}>{getHariIndonesia(item.tanggal)}</Text>
            <Text style={styles.cardRemark}>
              {item.remark?.trim() ? item.remark : 'Tidak ada keterangan'}
            </Text>
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
          <Text style={styles.headerTitle}>Hari Libur</Text>
          <Text style={styles.headerSubtitle}>{namaMitra}</Text>
        </View>
      </View>

      <View style={styles.contentContainer}>
        <View style={styles.content}>
          <View style={styles.topBar}>
            <View style={styles.yearFilter}>
              <TouchableOpacity
                style={styles.yearButton}
                onPress={() => setTahun((prev) => prev - 1)}
              >
                <Ionicons name="chevron-back" size={20} color={COLORS.primary} />
              </TouchableOpacity>

              <View style={styles.yearValueWrap}>
                <Ionicons name="calendar-clear-outline" size={18} color={COLORS.primary} />
                <Text style={styles.yearText}>{tahun}</Text>
              </View>

              <TouchableOpacity
                style={styles.yearButton}
                onPress={() => setTahun((prev) => prev + 1)}
              >
                <Ionicons name="chevron-forward" size={20} color={COLORS.primary} />
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
              <Text style={styles.centerStateText}>Memuat hari libur...</Text>
            </View>
          ) : list.length === 0 ? (
            <View style={styles.centerState}>
              <Ionicons name="calendar-clear-outline" size={48} color="#9CA3AF" />
              <Text style={styles.centerStateTitle}>Belum ada hari libur</Text>
              <Text style={styles.centerStateText}>
                Tambahkan data hari libur untuk tahun {tahun}.
              </Text>
            </View>
          ) : (
            <FlatList
              data={list}
              keyExtractor={(item) => String(item.id)}
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
                {editingItem ? 'Update Hari Libur' : 'Tambah Hari Libur'}
              </Text>
              <TouchableOpacity onPress={closeModal} disabled={saving}>
                <Ionicons name="close-outline" size={26} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.dateInputButton}
              onPress={() => setShowDatePicker(true)}
              activeOpacity={0.85}
            >
              <View style={styles.dateInputLeft}>
                <Ionicons name="calendar-outline" size={20} color={COLORS.primary} />
                <View>
                  <Text style={styles.dateInputLabel}>Tanggal Libur</Text>
                  <Text style={styles.dateInputValue}>
                    {tanggal ? formatTanggalIndonesia(tanggal) : 'Pilih tanggal'}
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward-outline" size={20} color="#9CA3AF" />
            </TouchableOpacity>

            {tanggal ? (
              <View style={styles.dayInfoBox}>
                <Ionicons name="today-outline" size={18} color={COLORS.accentOrange} />
                <Text style={styles.dayInfoText}>Hari: {getHariIndonesia(tanggal)}</Text>
              </View>
            ) : null}

            <TextInput
              placeholder="Keterangan / remark"
              style={[styles.input, styles.textArea]}
              placeholderTextColor="#999"
              value={remark}
              onChangeText={setRemark}
              editable={!saving}
              multiline
            />

            <TouchableOpacity
              style={[styles.saveButton, saving && styles.saveButtonDisabled]}
              onPress={handleSave}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.saveButtonText}>
                  {editingItem ? 'UPDATE' : 'SIMPAN'}
                </Text>
              )}
            </TouchableOpacity>

            {editingItem ? (
              <TouchableOpacity
                style={[styles.deleteButton, saving && styles.saveButtonDisabled]}
                onPress={handleDeleteFromModal}
                disabled={saving}
              >
                <Text style={styles.deleteButtonText}>HAPUS</Text>
              </TouchableOpacity>
            ) : null}

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={closeModal}
              disabled={saving}
            >
              <Text style={styles.cancelButtonText}>Batal</Text>
            </TouchableOpacity>

            {showDatePicker && (
              <DateTimePicker
                value={selectedDate}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={(_, date) => {
                  if (Platform.OS !== 'ios') {
                    setShowDatePicker(false)
                  }

                  if (date) {
                    setTanggal(toInputDate(date))
                  }
                }}
              />
            )}

            {Platform.OS === 'ios' && showDatePicker && (
              <TouchableOpacity
                style={styles.iosDateDoneButton}
                onPress={() => setShowDatePicker(false)}
              >
                <Text style={styles.iosDateDoneText}>Selesai</Text>
              </TouchableOpacity>
            )}
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

  yearFilter: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 16,
    paddingHorizontal: 6,
    paddingVertical: 6,
    flex: 1,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },

  yearButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },

  yearValueWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },

  yearText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
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

  cardDate: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
  },

  cardDay: {
    marginTop: 3,
    fontSize: 13,
    color: COLORS.accentOrange,
    fontWeight: '700',
  },

  cardRemark: {
    marginTop: 6,
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

  dateInputButton: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  dateInputLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  dateInputLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2,
  },

  dateInputValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },

  dayInfoBox: {
    marginTop: 12,
    marginBottom: 12,
    backgroundColor: '#FFF7ED',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  dayInfoText: {
    fontSize: 13,
    color: '#9A3412',
    fontWeight: '700',
  },

  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: COLORS.textPrimary,
    marginTop: 4,
  },

  textArea: {
    minHeight: 90,
    textAlignVertical: 'top',
    marginTop: 12,
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

  deleteButton: {
    backgroundColor: '#EF4444',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 12,
  },

  deleteButtonText: {
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

  iosDateDoneButton: {
    marginTop: 10,
    alignSelf: 'flex-end',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },

  iosDateDoneText: {
    color: COLORS.primary,
    fontWeight: '800',
    fontSize: 14,
  },
})