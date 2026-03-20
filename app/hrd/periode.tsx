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
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { Swipeable } from 'react-native-gesture-handler'

import { COLORS } from '@/constants/colors'
import { useAuthStore } from '@/store/auth.store'
import { api, setAuthToken } from '@/services/api'

type PeriodeItem = {
  id: number | string
  jenis_periode: 'PEKANAN' | 'BULANAN'
  periode: string
  tanggal_awal: string
  tanggal_akhir: string
  status: 'AKTIF' | 'NONAKTIF'
  remark: string | null
}

type PeriodeOption = {
  periode: string
  label: string
  tanggal_awal: string
  tanggal_akhir: string
  is_default: boolean
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

function formatTanggalIndonesia(dateStr: string) {
  if (!dateStr) return '-'
  const date = new Date(`${dateStr}T00:00:00`)
  const bulan = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
  ]
  const dd = String(date.getDate()).padStart(2, '0')
  const mm = bulan[date.getMonth()] || '-'
  const yyyy = date.getFullYear()
  return `${dd} ${mm} ${yyyy}`
}

export default function PeriodeScreen() {
  const router = useRouter()
  const user = useAuthStore((state) => state.user)
  const clearSession = useAuthStore((state) => state.clearSession)

  const namaMitra =
    (user as any)?.nama_mitra ||
    (user as any)?.mitra?.nama_mitra ||
    '-'

  const [jenisPeriode, setJenisPeriode] = useState<'PEKANAN' | 'BULANAN'>('PEKANAN')
  const [periodeOptions, setPeriodeOptions] = useState<PeriodeOption[]>([])
  const [list, setList] = useState<PeriodeItem[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingConfig, setLoadingConfig] = useState(true)

  const [modalVisible, setModalVisible] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editingItem, setEditingItem] = useState<PeriodeItem | null>(null)

  const [selectedPeriode, setSelectedPeriode] = useState('')
  const [selectedPeriodeLabel, setSelectedPeriodeLabel] = useState('')
  const [tanggalAwal, setTanggalAwal] = useState('')
  const [tanggalAkhir, setTanggalAkhir] = useState('')
  const [status, setStatus] = useState<'AKTIF' | 'NONAKTIF'>('AKTIF')
  const [remark, setRemark] = useState('')

  const canSave = useMemo(() => {
    return selectedPeriode.trim() !== '' && tanggalAwal.trim() !== '' && tanggalAkhir.trim() !== ''
  }, [selectedPeriode, tanggalAwal, tanggalAkhir])

  const handleUnauthorized = async () => {
    await clearSession()
    setAuthToken(undefined)
    Alert.alert('Session Expired', 'Silakan login kembali.')
    router.replace('/auth/login')
  }

  const loadConfig = async () => {
    try {
      setLoadingConfig(true)
      const res = await api.get('/hrd/periode/config.php')

      if (!res?.data?.success) {
        throw new Error(res?.data?.message || 'Gagal mengambil konfigurasi periode.')
      }

      const data = res.data.data || {}
      const options = Array.isArray(data.periode_options) ? data.periode_options : []

      setJenisPeriode((data.jenis_periode || 'PEKANAN') as 'PEKANAN' | 'BULANAN')
      setPeriodeOptions(options)

      const defaultOption = options.find((x: PeriodeOption) => x.is_default) || options[0]
      if (!editingItem && defaultOption) {
        setSelectedPeriode(defaultOption.periode)
        setSelectedPeriodeLabel(defaultOption.label)
        setTanggalAwal(defaultOption.tanggal_awal)
        setTanggalAkhir(defaultOption.tanggal_akhir)
      }
    } catch (error: any) {
      console.log('HRD PERIODE CONFIG ERROR:', error?.response?.data || error?.message)

      if (error?.response?.status === 401) {
        await handleUnauthorized()
        return
      }

      Alert.alert(
        'Error',
        error?.response?.data?.message || error?.message || 'Gagal mengambil konfigurasi periode.'
      )
    } finally {
      setLoadingConfig(false)
    }
  }

  const loadData = async () => {
    try {
      setLoading(true)
      const res = await api.get('/hrd/periode/list.php')

      if (!res?.data?.success) {
        throw new Error(res?.data?.message || 'Gagal mengambil data periode.')
      }

      setList(Array.isArray(res.data.data) ? res.data.data : [])
    } catch (error: any) {
      console.log('HRD PERIODE LIST ERROR:', error?.response?.data || error?.message)

      if (error?.response?.status === 401) {
        await handleUnauthorized()
        return
      }

      Alert.alert(
        'Error',
        error?.response?.data?.message || error?.message || 'Gagal mengambil data periode.'
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadConfig()
    loadData()
  }, [])

  const resetForm = () => {
    setEditingItem(null)
    setSelectedPeriode('')
    setSelectedPeriodeLabel('')
    setTanggalAwal('')
    setTanggalAkhir('')
    setStatus('AKTIF')
    setRemark('')

    const defaultOption = periodeOptions.find((x) => x.is_default) || periodeOptions[0]
    if (defaultOption) {
      setSelectedPeriode(defaultOption.periode)
      setSelectedPeriodeLabel(defaultOption.label)
      setTanggalAwal(defaultOption.tanggal_awal)
      setTanggalAkhir(defaultOption.tanggal_akhir)
    }
  }

  const openAddModal = () => {
    resetForm()
    setModalVisible(true)
  }

  const openEditModal = (item: PeriodeItem) => {
    setEditingItem(item)
    setSelectedPeriode(item.periode || '')
    setSelectedPeriodeLabel(item.periode || '')
    setTanggalAwal(item.tanggal_awal || '')
    setTanggalAkhir(item.tanggal_akhir || '')
    setStatus(item.status || 'AKTIF')
    setRemark(item.remark || '')
    setModalVisible(true)
  }

  const closeModal = () => {
    if (saving) return
    setModalVisible(false)
    resetForm()
  }

  const handleSelectPeriode = (option: PeriodeOption) => {
    setSelectedPeriode(option.periode)
    setSelectedPeriodeLabel(option.label)
    setTanggalAwal(option.tanggal_awal)
    setTanggalAkhir(option.tanggal_akhir)
  }

  const handleSave = async () => {
    if (!canSave) {
      Alert.alert('Validasi', 'Periode wajib dipilih.')
      return
    }

    try {
      setSaving(true)

      const payload = {
        id: editingItem?.id,
        periode: selectedPeriode,
        tanggal_awal: tanggalAwal,
        tanggal_akhir: tanggalAkhir,
        status,
        remark: remark.trim(),
      }

      const endpoint = editingItem
        ? '/hrd/periode/update.php'
        : '/hrd/periode/create.php'

      const res = await api.post(endpoint, payload)

      if (!res?.data?.success) {
        Alert.alert('Gagal', res?.data?.message || 'Gagal menyimpan periode.')
        return
      }

      closeModal()
      await loadData()
    } catch (error: any) {
      console.log('HRD PERIODE SAVE ERROR:', error?.response?.data || error?.message)

      if (error?.response?.status === 401) {
        await handleUnauthorized()
        return
      }

      Alert.alert(
        'Error',
        error?.response?.data?.message || error?.message || 'Terjadi kesalahan saat menyimpan periode.'
      )
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = (item: PeriodeItem) => {
    Alert.alert(
      'Hapus Periode',
      `Yakin ingin menghapus periode "${item.periode}"?`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: async () => {
            try {
              const res = await api.post('/hrd/periode/delete.php', {
                id: item.id,
              })

              if (!res?.data?.success) {
                Alert.alert('Gagal', res?.data?.message || 'Gagal menghapus periode.')
                return
              }

              setList((prev) => prev.filter((x) => String(x.id) !== String(item.id)))
            } catch (error: any) {
              console.log('HRD PERIODE DELETE ERROR:', error?.response?.data || error?.message)

              if (error?.response?.status === 401) {
                await handleUnauthorized()
                return
              }

              Alert.alert(
                'Error',
                error?.response?.data?.message || error?.message || 'Terjadi kesalahan saat menghapus periode.'
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
      'Hapus Periode',
      `Yakin ingin menghapus periode "${editingItem.periode}"?`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: async () => {
            try {
              setSaving(true)

              const res = await api.post('/hrd/periode/delete.php', {
                id: editingItem.id,
              })

              if (!res?.data?.success) {
                Alert.alert('Gagal', res?.data?.message || 'Gagal menghapus periode.')
                return
              }

              const deletedId = editingItem.id
              closeModal()
              setList((prev) => prev.filter((x) => String(x.id) !== String(deletedId)))
            } catch (error: any) {
              console.log(
                'HRD PERIODE DELETE FROM MODAL ERROR:',
                error?.response?.data || error?.message
              )

              if (error?.response?.status === 401) {
                await handleUnauthorized()
                return
              }

              Alert.alert(
                'Error',
                error?.response?.data?.message || error?.message || 'Terjadi kesalahan saat menghapus periode.'
              )
            } finally {
              setSaving(false)
            }
          },
        },
      ]
    )
  }

  const renderRightActions = (item: PeriodeItem) => (
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
    item: PeriodeItem
    index: number
  }) => (
    <CardAnimated index={index}>
      <Swipeable renderRightActions={() => renderRightActions(item)} overshootRight={false}>
        <TouchableOpacity style={styles.card} activeOpacity={0.92} onPress={() => openEditModal(item)}>
          <View style={styles.cardIconWrap}>
            <Ionicons name="albums-outline" size={24} color={COLORS.primary} />
          </View>

          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>{item.periode}</Text>
            <Text style={styles.cardSubtitle} numberOfLines={3}>
              Jenis: {item.jenis_periode}
              {'\n'}
              {formatTanggalIndonesia(item.tanggal_awal)} - {formatTanggalIndonesia(item.tanggal_akhir)}
              {'\n'}
              {item.remark?.trim() ? item.remark : 'Tanpa remark'}
            </Text>

            <View
              style={[
                styles.statusBadge,
                item.status === 'AKTIF' ? styles.statusAktif : styles.statusNonaktif,
              ]}
            >
              <Text style={styles.statusBadgeText}>{item.status}</Text>
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
          <Text style={styles.headerTitle}>Periode</Text>
          <Text style={styles.headerSubtitle}>{namaMitra}</Text>
          <Text style={styles.headerSubtitle}>Jenis: {jenisPeriode}</Text>
        </View>
      </View>

      <View style={styles.contentContainer}>
        <View style={styles.content}>
          <View style={styles.topBar}>
            <View style={styles.topInfoCard}>
              <Ionicons name="information-circle-outline" size={18} color={COLORS.primary} />
              <Text style={styles.topInfoText}>{jenisPeriode}</Text>
            </View>

            <TouchableOpacity style={styles.addButton} onPress={openAddModal}>
              <Ionicons name="add" size={18} color="#FFF" />
              <Text style={styles.addButtonText}>Tambah</Text>
            </TouchableOpacity>
          </View>

          {loading || loadingConfig ? (
            <View style={styles.centerState}>
              <ActivityIndicator size="large" color={COLORS.primary} />
              <Text style={styles.centerStateText}>Memuat data periode...</Text>
            </View>
          ) : list.length === 0 ? (
            <View style={styles.centerState}>
              <Ionicons name="albums-outline" size={48} color="#9CA3AF" />
              <Text style={styles.centerStateTitle}>Belum ada data periode</Text>
              <Text style={styles.centerStateText}>
                Tambahkan data periode terlebih dahulu.
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
                {editingItem ? 'Update Periode' : 'Tambah Periode'}
              </Text>
              <TouchableOpacity onPress={closeModal} disabled={saving}>
                <Ionicons name="close-outline" size={26} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.infoUserBox}>
                <Ionicons name="information-circle-outline" size={18} color={COLORS.primary} />
                <Text style={styles.infoUserText}>Jenis Periode: {jenisPeriode}</Text>
              </View>

              <Text style={styles.sectionLabel}>Periode Gaji</Text>
              <View style={styles.optionWrap}>
                {periodeOptions.map((item) => {
                  const active = selectedPeriode === item.periode
                  return (
                    <TouchableOpacity
                      key={item.periode}
                      style={[styles.optionChip, active && styles.optionChipActive]}
                      onPress={() => handleSelectPeriode(item)}
                      disabled={saving}
                    >
                      <Text style={[styles.optionChipText, active && styles.optionChipTextActive]}>
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  )
                })}
              </View>

              <View style={styles.previewBox}>
                <Text style={styles.previewText}>Periode dipilih: {selectedPeriodeLabel || '-'}</Text>
                <Text style={styles.previewText}>
                  Tanggal: {formatTanggalIndonesia(tanggalAwal)} - {formatTanggalIndonesia(tanggalAkhir)}
                </Text>
              </View>

              <View style={styles.statusSwitchWrap}>
                <TouchableOpacity
                  style={[
                    styles.statusSwitchBtn,
                    status === 'AKTIF' && styles.statusSwitchActive,
                  ]}
                  onPress={() => setStatus('AKTIF')}
                  disabled={saving}
                >
                  <Text
                    style={[
                      styles.statusSwitchText,
                      status === 'AKTIF' && styles.statusSwitchTextActive,
                    ]}
                  >
                    AKTIF
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.statusSwitchBtn,
                    status === 'NONAKTIF' && styles.statusSwitchActive,
                  ]}
                  onPress={() => setStatus('NONAKTIF')}
                  disabled={saving}
                >
                  <Text
                    style={[
                      styles.statusSwitchText,
                      status === 'NONAKTIF' && styles.statusSwitchTextActive,
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
            </ScrollView>
          </View>
        </View>
      </Modal>
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

  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
    gap: 12,
  },

  topInfoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFF',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
    flex: 1,
  },

  topInfoText: {
    fontSize: 13,
    fontWeight: '700',
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

  sectionLabel: {
    marginTop: 14,
    marginBottom: 8,
    fontSize: 13,
    fontWeight: '700',
    color: '#374151',
  },

  optionWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },

  optionChip: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: '#E5E7EB',
  },

  optionChipActive: {
    backgroundColor: COLORS.primary,
  },

  optionChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#111827',
  },

  optionChipTextActive: {
    color: '#FFF',
  },

  previewBox: {
    marginTop: 12,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    padding: 12,
  },

  previewText: {
    fontSize: 13,
    color: '#374151',
    lineHeight: 20,
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
})