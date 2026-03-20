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

type JadwalShiftItem = {
  id: number | string
  tanggal: string
  id_pegawai: number | string
  nama_pegawai: string
  kode_shift: string
  nama_shift: string
  remark: string | null
}

type PegawaiOption = {
  id_pegawai: number | string
  nama_pegawai: string
}

type ShiftOption = {
  kode_shift: string
  nama_shift: string
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
    <Animated.View style={{ opacity, transform: [{ translateY }] }}>
      {children}
    </Animated.View>
  )
}

export default function JadwalShiftScreen() {
  const router = useRouter()
  const user = useAuthStore((state) => state.user)
  const clearSession = useAuthStore((state) => state.clearSession)

  const namaMitra =
    (user as any)?.nama_mitra ||
    (user as any)?.mitra?.nama_mitra ||
    '-'

  const todayStr = useMemo(() => toInputDate(new Date()), [])

  const [list, setList] = useState<JadwalShiftItem[]>([])
  const [loading, setLoading] = useState(true)

  const [pegawaiOptions, setPegawaiOptions] = useState<PegawaiOption[]>([])
  const [shiftOptions, setShiftOptions] = useState<ShiftOption[]>([])
  const [loadingPegawai, setLoadingPegawai] = useState(false)
  const [loadingShift, setLoadingShift] = useState(false)

  const [filterTanggalAwal, setFilterTanggalAwal] = useState(todayStr)
  const [filterTanggalAkhir, setFilterTanggalAkhir] = useState(todayStr)

  const [showFilterTanggalAwalPicker, setShowFilterTanggalAwalPicker] = useState(false)
  const [showFilterTanggalAkhirPicker, setShowFilterTanggalAkhirPicker] = useState(false)

  const [modalVisible, setModalVisible] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editingItem, setEditingItem] = useState<JadwalShiftItem | null>(null)

  const [tanggal, setTanggal] = useState('')
  const [idPegawai, setIdPegawai] = useState('')
  const [namaPegawaiDipilih, setNamaPegawaiDipilih] = useState('')
  const [kodeShift, setKodeShift] = useState('')
  const [namaShiftDipilih, setNamaShiftDipilih] = useState('')
  const [remark, setRemark] = useState('')

  const [showDatePicker, setShowDatePicker] = useState(false)

  const [pegawaiPickerVisible, setPegawaiPickerVisible] = useState(false)
  const [shiftPickerVisible, setShiftPickerVisible] = useState(false)
  const [pegawaiQuery, setPegawaiQuery] = useState('')
  const [shiftQuery, setShiftQuery] = useState('')

  const selectedDate = useMemo(() => {
    if (!tanggal) return new Date()
    const parsed = new Date(`${tanggal}T00:00:00`)
    return Number.isNaN(parsed.getTime()) ? new Date() : parsed
  }, [tanggal])

  const selectedFilterTanggalAwal = useMemo(() => {
    const parsed = new Date(`${filterTanggalAwal}T00:00:00`)
    return Number.isNaN(parsed.getTime()) ? new Date() : parsed
  }, [filterTanggalAwal])

  const selectedFilterTanggalAkhir = useMemo(() => {
    const parsed = new Date(`${filterTanggalAkhir}T00:00:00`)
    return Number.isNaN(parsed.getTime()) ? new Date() : parsed
  }, [filterTanggalAkhir])

  const canSave = useMemo(() => {
    return tanggal.trim() !== '' && idPegawai.trim() !== '' && kodeShift.trim() !== ''
  }, [tanggal, idPegawai, kodeShift])

  const handleUnauthorized = async () => {
    await clearSession()
    setAuthToken(undefined)
    Alert.alert('Session Expired', 'Silakan login kembali.')
    router.replace('/auth/login')
  }

  const loadData = async () => {
    try {
      if (!filterTanggalAwal || !filterTanggalAkhir) {
        return
      }

      setLoading(true)

      const res = await api.get(
        `/hrd/pegawai-shift/list.php?tanggal_akhir=${encodeURIComponent(filterTanggalAkhir)}`
      )

      if (!res?.data?.success) {
        throw new Error(res?.data?.message || 'Gagal mengambil data jadwal shift.')
      }

      setList(Array.isArray(res.data.data) ? res.data.data : [])
    } catch (error: any) {
      console.log('HRD JADWAL SHIFT LIST ERROR:', error?.response?.data || error?.message)

      if (error?.response?.status === 401) {
        await handleUnauthorized()
        return
      }

      Alert.alert(
        'Error',
        error?.response?.data?.message || error?.message || 'Gagal mengambil data jadwal shift.'
      )
    } finally {
      setLoading(false)
    }
  }

  const loadPegawai = async (q = '') => {
    try {
      setLoadingPegawai(true)

      const res = await api.get(
        `/hrd/pegawai-shift/pegawai-list.php?q=${encodeURIComponent(q)}`
      )

      if (!res?.data?.success) {
        throw new Error(res?.data?.message || 'Gagal mengambil data pegawai.')
      }

      setPegawaiOptions(Array.isArray(res.data.data) ? res.data.data : [])
    } catch (error: any) {
      console.log('HRD PEGAWAI LOOKUP ERROR:', error?.response?.data || error?.message)
    } finally {
      setLoadingPegawai(false)
    }
  }

  const loadShift = async (q = '') => {
    try {
      setLoadingShift(true)

      const res = await api.get(
        `/hrd/pegawai-shift/shift-list.php?q=${encodeURIComponent(q)}`
      )

      if (!res?.data?.success) {
        throw new Error(res?.data?.message || 'Gagal mengambil data shift.')
      }

      setShiftOptions(Array.isArray(res.data.data) ? res.data.data : [])
    } catch (error: any) {
      console.log('HRD SHIFT LOOKUP ERROR:', error?.response?.data || error?.message)
    } finally {
      setLoadingShift(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [filterTanggalAwal, filterTanggalAkhir])

  useEffect(() => {
    if (pegawaiPickerVisible) {
      loadPegawai(pegawaiQuery)
    }
  }, [pegawaiPickerVisible, pegawaiQuery])

  useEffect(() => {
    if (shiftPickerVisible) {
      loadShift(shiftQuery)
    }
  }, [shiftPickerVisible, shiftQuery])

  const resetForm = () => {
    setEditingItem(null)
    setTanggal('')
    setIdPegawai('')
    setNamaPegawaiDipilih('')
    setKodeShift('')
    setNamaShiftDipilih('')
    setRemark('')
    setPegawaiQuery('')
    setShiftQuery('')
    setShowDatePicker(false)
  }

  const openAddModal = () => {
    resetForm()
    setModalVisible(true)
  }

  const openEditModal = (item: JadwalShiftItem) => {
    setEditingItem(item)
    setTanggal(item.tanggal || '')
    setIdPegawai(String(item.id_pegawai || ''))
    setNamaPegawaiDipilih(item.nama_pegawai || '')
    setKodeShift(item.kode_shift || '')
    setNamaShiftDipilih(item.nama_shift || item.kode_shift || '')
    setRemark(item.remark || '')
    setPegawaiQuery('')
    setShiftQuery('')
    setShowDatePicker(false)
    setModalVisible(true)
  }

  const closeModal = () => {
    if (saving) return
    setModalVisible(false)
    resetForm()
  }

  const handleSave = async () => {
    if (!canSave) {
      Alert.alert('Validasi', 'Tanggal, pegawai, dan shift wajib diisi.')
      return
    }

    try {
      setSaving(true)

      const payload = {
        id: editingItem?.id,
        tanggal: tanggal.trim(),
        id_pegawai: Number(idPegawai),
        kode_shift: kodeShift.trim(),
        remark: remark.trim(),
      }

      const endpoint = editingItem
        ? '/hrd/pegawai-shift/update.php'
        : '/hrd/pegawai-shift/create.php'

      const res = await api.post(endpoint, payload)

      if (!res?.data?.success) {
        Alert.alert('Gagal', res?.data?.message || 'Gagal menyimpan jadwal shift.')
        return
      }

      closeModal()
      await loadData()
    } catch (error: any) {
      console.log('HRD JADWAL SHIFT SAVE ERROR:', error?.response?.data || error?.message)

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

  const handleDelete = (item: JadwalShiftItem) => {
    Alert.alert(
      'Hapus Jadwal Shift',
      `Yakin ingin menghapus jadwal shift ${item.nama_pegawai} pada ${formatTanggalIndonesia(item.tanggal)}?`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: async () => {
            try {
              const res = await api.post('/hrd/pegawai-shift/delete.php', {
                id: item.id,
              })

              if (!res?.data?.success) {
                Alert.alert('Gagal', res?.data?.message || 'Gagal menghapus jadwal shift.')
                return
              }

              setList((prev) => prev.filter((x) => String(x.id) !== String(item.id)))
            } catch (error: any) {
              console.log('HRD JADWAL SHIFT DELETE ERROR:', error?.response?.data || error?.message)

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
      'Hapus Jadwal Shift',
      `Yakin ingin menghapus jadwal shift ${editingItem.nama_pegawai} pada ${formatTanggalIndonesia(editingItem.tanggal)}?`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: async () => {
            try {
              setSaving(true)

              const res = await api.post('/hrd/pegawai-shift/delete.php', {
                id: editingItem.id,
              })

              if (!res?.data?.success) {
                Alert.alert('Gagal', res?.data?.message || 'Gagal menghapus jadwal shift.')
                return
              }

              const deletedId = editingItem.id
              closeModal()
              setList((prev) => prev.filter((x) => String(x.id) !== String(deletedId)))
            } catch (error: any) {
              console.log(
                'HRD JADWAL SHIFT DELETE FROM MODAL ERROR:',
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

  const openPegawaiPicker = () => {
    setPegawaiPickerVisible(true)
    setPegawaiQuery('')
    loadPegawai('')
  }

  const openShiftPicker = () => {
    setShiftPickerVisible(true)
    setShiftQuery('')
    loadShift('')
  }

  const renderRightActions = (item: JadwalShiftItem) => (
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
    item: JadwalShiftItem
    index: number
  }) => (
    <CardAnimated index={index}>
      <Swipeable renderRightActions={() => renderRightActions(item)} overshootRight={false}>
        <TouchableOpacity style={styles.card} activeOpacity={0.92} onPress={() => openEditModal(item)}>
          <View style={styles.cardIconWrap}>
            <Ionicons name="time-outline" size={24} color={COLORS.primary} />
          </View>

          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>{item.nama_pegawai}</Text>
            <Text style={styles.cardSubtitle} numberOfLines={3}>
              Tanggal: {formatTanggalIndonesia(item.tanggal)}
              {'\n'}
              Shift: {item.nama_shift?.trim() ? item.nama_shift : item.kode_shift}
              {'\n'}
              {item.remark?.trim() ? item.remark : 'Tanpa remark'}
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
          <Text style={styles.headerTitle}>Jadwal Shift</Text>
          <Text style={styles.headerSubtitle}>{namaMitra}</Text>
        </View>
      </View>

      <View style={styles.contentContainer}>
        <View style={styles.content}>
          <View style={styles.filterCard}>
            <View style={styles.filterRow}>

              <TouchableOpacity
                style={[styles.dateInputButton, styles.filterDateButton]}
                onPress={() => setShowFilterTanggalAkhirPicker(true)}
                activeOpacity={0.85}
              >
                <View style={styles.dateInputLeft}>
                  <Ionicons name="calendar-outline" size={18} color={COLORS.primary} />
                  <View>
                    <Text style={styles.dateInputLabel}>Tanggal</Text>
                    <Text style={styles.dateInputValue}>
                      {formatTanggalIndonesia(filterTanggalAkhir)}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.topBar}>
            <View style={{ flex: 1 }} />
            <TouchableOpacity style={styles.addButton} onPress={openAddModal}>
              <Ionicons name="add" size={18} color="#FFF" />
              <Text style={styles.addButtonText}>Tambah</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.centerState}>
              <ActivityIndicator size="large" color={COLORS.primary} />
              <Text style={styles.centerStateText}>Memuat jadwal shift...</Text>
            </View>
          ) : list.length === 0 ? (
            <View style={styles.centerState}>
              <Ionicons name="time-outline" size={48} color="#9CA3AF" />
              <Text style={styles.centerStateTitle}>Belum ada jadwal shift</Text>
              <Text style={styles.centerStateText}>
                Tidak ada data pada rentang tanggal yang dipilih.
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
                {editingItem ? 'Update Jadwal Shift' : 'Tambah Jadwal Shift'}
              </Text>
              <TouchableOpacity onPress={closeModal} disabled={saving}>
                <Ionicons name="close-outline" size={26} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <TouchableOpacity
                style={styles.dateInputButton}
                onPress={() => setShowDatePicker(true)}
                activeOpacity={0.85}
              >
                <View style={styles.dateInputLeft}>
                  <Ionicons name="calendar-outline" size={20} color={COLORS.primary} />
                  <View>
                    <Text style={styles.dateInputLabel}>Tanggal Shift</Text>
                    <Text style={styles.dateInputValue}>
                      {tanggal ? formatTanggalIndonesia(tanggal) : 'Pilih tanggal'}
                    </Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward-outline" size={20} color="#9CA3AF" />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.comboButton, { marginTop: 12 }]}
                onPress={openPegawaiPicker}
                activeOpacity={0.85}
                disabled={saving}
              >
                <View style={styles.comboLeft}>
                  <Ionicons name="person-outline" size={20} color={COLORS.primary} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.comboLabel}>Pegawai</Text>
                    <Text style={styles.comboValue}>
                      {namaPegawaiDipilih || 'Pilih pegawai'}
                    </Text>
                  </View>
                </View>
                <Ionicons name="chevron-down-outline" size={20} color="#9CA3AF" />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.comboButton, { marginTop: 12 }]}
                onPress={openShiftPicker}
                activeOpacity={0.85}
                disabled={saving}
              >
                <View style={styles.comboLeft}>
                  <Ionicons name="time-outline" size={20} color={COLORS.primary} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.comboLabel}>Shift</Text>
                    <Text style={styles.comboValue}>
                      {kodeShift
                        ? `${kodeShift} - ${namaShiftDipilih || kodeShift}`
                        : 'Pilih shift'}
                    </Text>
                  </View>
                </View>
                <Ionicons name="chevron-down-outline" size={20} color="#9CA3AF" />
              </TouchableOpacity>

              <TextInput
                placeholder="Remark"
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

              <TouchableOpacity style={styles.cancelButton} onPress={closeModal} disabled={saving}>
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
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal
        visible={pegawaiPickerVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setPegawaiPickerVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.lookupModalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Pilih Pegawai</Text>
              <TouchableOpacity onPress={() => setPegawaiPickerVisible(false)}>
                <Ionicons name="close-outline" size={26} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <TextInput
              placeholder="Cari nama pegawai"
              style={styles.input}
              placeholderTextColor="#999"
              value={pegawaiQuery}
              onChangeText={setPegawaiQuery}
            />

            {loadingPegawai ? (
              <View style={styles.lookupLoadingBox}>
                <ActivityIndicator color={COLORS.primary} />
              </View>
            ) : pegawaiOptions.length === 0 ? (
              <View style={styles.lookupLoadingBox}>
                <Text style={styles.lookupEmptyText}>Pegawai tidak ditemukan</Text>
              </View>
            ) : (
              <FlatList
                data={pegawaiOptions}
                keyExtractor={(item) => String(item.id_pegawai)}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.lookupItem}
                    onPress={() => {
                      setIdPegawai(String(item.id_pegawai))
                      setNamaPegawaiDipilih(item.nama_pegawai)
                      setPegawaiPickerVisible(false)
                    }}
                  >
                    <Text style={styles.lookupItemTitle}>{item.nama_pegawai}</Text>
                  </TouchableOpacity>
                )}
              />
            )}
          </View>
        </View>
      </Modal>

      <Modal
        visible={shiftPickerVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setShiftPickerVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.lookupModalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Pilih Shift</Text>
              <TouchableOpacity onPress={() => setShiftPickerVisible(false)}>
                <Ionicons name="close-outline" size={26} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <TextInput
              placeholder="Cari kode / nama shift"
              style={styles.input}
              placeholderTextColor="#999"
              value={shiftQuery}
              onChangeText={setShiftQuery}
            />

            {loadingShift ? (
              <View style={styles.lookupLoadingBox}>
                <ActivityIndicator color={COLORS.primary} />
              </View>
            ) : shiftOptions.length === 0 ? (
              <View style={styles.lookupLoadingBox}>
                <Text style={styles.lookupEmptyText}>Shift tidak ditemukan</Text>
              </View>
            ) : (
              <FlatList
                data={shiftOptions}
                keyExtractor={(item) => item.kode_shift}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.lookupItem}
                    onPress={() => {
                      setKodeShift(item.kode_shift)
                      setNamaShiftDipilih(item.nama_shift)
                      setShiftPickerVisible(false)
                    }}
                  >
                    <Text style={styles.lookupItemTitle}>
                      {item.kode_shift} - {item.nama_shift}
                    </Text>
                  </TouchableOpacity>
                )}
              />
            )}
          </View>
        </View>
      </Modal>

      {showFilterTanggalAwalPicker && (
        <DateTimePicker
          value={selectedFilterTanggalAwal}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(_, date) => {
            if (Platform.OS !== 'ios') {
              setShowFilterTanggalAwalPicker(false)
            }
            if (date) {
              setFilterTanggalAwal(toInputDate(date))
            }
          }}
        />
      )}

      {showFilterTanggalAkhirPicker && (
        <DateTimePicker
          value={selectedFilterTanggalAkhir}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(_, date) => {
            if (Platform.OS !== 'ios') {
              setShowFilterTanggalAkhirPicker(false)
            }
            if (date) {
              setFilterTanggalAkhir(toInputDate(date))
            }
          }}
        />
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.primary },

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

  filterCard: {
    backgroundColor: '#FFF',
    borderRadius: 18,
    padding: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },

  filterRow: {
    gap: 10,
  },

  filterDateButton: {
    marginTop: 0,
  },

  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
    gap: 12,
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
    maxHeight: '92%',
  },

  lookupModalCard: {
    backgroundColor: '#FFF',
    borderRadius: 22,
    padding: 18,
    maxHeight: '80%',
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
    backgroundColor: '#FFF',
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

  comboButton: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    padding: 14,
    backgroundColor: '#FFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  comboLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },

  comboLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2,
  },

  comboValue: {
    fontSize: 14,
    fontWeight: '700',
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
    marginTop: 12,
  },

  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },

  lookupLoadingBox: {
    minHeight: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },

  lookupEmptyText: {
    color: '#6B7280',
    fontSize: 13,
  },

  lookupItem: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },

  lookupItemTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
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
    marginBottom: 8,
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