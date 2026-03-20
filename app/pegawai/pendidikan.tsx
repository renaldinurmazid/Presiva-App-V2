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

type PendidikanItem = {
  id_pendidikan: number | string
  id_pegawai: number | string
  nama_pegawai: string
  jenjang_pendidikan: 'SD' | 'SMP' | 'SMA' | 'D1' | 'D2' | 'D3' | 'D4' | 'S1' | 'S2' | 'S3'
  nama_institusi: string
  jurusan: string
  tahun_masuk: string
  tahun_lulus: string
  kota_institusi: string
  status_pendidikan: 'LULUS' | 'BELUM_LULUS'
  remark: string | null
}

const JENJANG_OPTIONS: PendidikanItem['jenjang_pendidikan'][] = [
  'SD',
  'SMP',
  'SMA',
  'D1',
  'D2',
  'D3',
  'D4',
  'S1',
  'S2',
  'S3',
]

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

export default function PendidikanScreen() {
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

  const [statusFilter, setStatusFilter] = useState<'LULUS' | 'BELUM_LULUS'>('LULUS')
  const [list, setList] = useState<PendidikanItem[]>([])
  const [loading, setLoading] = useState(true)

  const [modalVisible, setModalVisible] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editingItem, setEditingItem] = useState<PendidikanItem | null>(null)

  const [jenjangPendidikan, setJenjangPendidikan] =
    useState<PendidikanItem['jenjang_pendidikan']>('SMA')
  const [namaInstitusi, setNamaInstitusi] = useState('')
  const [jurusan, setJurusan] = useState('')
  const [tahunMasuk, setTahunMasuk] = useState('')
  const [tahunLulus, setTahunLulus] = useState('')
  const [kotaInstitusi, setKotaInstitusi] = useState('')
  const [statusPendidikan, setStatusPendidikan] =
    useState<PendidikanItem['status_pendidikan']>('LULUS')
  const [remark, setRemark] = useState('')

  const canSave = useMemo(() => {
    return namaInstitusi.trim() !== '' && jenjangPendidikan.trim() !== ''
  }, [namaInstitusi, jenjangPendidikan])

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
        `/pegawai/pendidikan/list.php?status_pendidikan=${statusFilter}`
      )

      if (!res?.data?.success) {
        throw new Error(res?.data?.message || 'Gagal mengambil data pendidikan pegawai.')
      }

      setList(Array.isArray(res.data.data) ? res.data.data : [])
    } catch (error: any) {
      console.log('PEGAWAI PENDIDIKAN LIST ERROR:', error?.response?.data || error?.message)

      if (error?.response?.status === 401) {
        await handleUnauthorized()
        return
      }

      Alert.alert(
        'Error',
        error?.response?.data?.message ||
          error?.message ||
          'Gagal mengambil data pendidikan pegawai.'
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [statusFilter])

  const resetForm = () => {
    setEditingItem(null)
    setJenjangPendidikan('SMA')
    setNamaInstitusi('')
    setJurusan('')
    setTahunMasuk('')
    setTahunLulus('')
    setKotaInstitusi('')
    setStatusPendidikan('LULUS')
    setRemark('')
  }

  const openAddModal = () => {
    resetForm()
    setModalVisible(true)
  }

  const openEditModal = (item: PendidikanItem) => {
    setEditingItem(item)
    setJenjangPendidikan(item.jenjang_pendidikan || 'SMA')
    setNamaInstitusi(item.nama_institusi || '')
    setJurusan(item.jurusan || '')
    setTahunMasuk(item.tahun_masuk || '')
    setTahunLulus(item.tahun_lulus || '')
    setKotaInstitusi(item.kota_institusi || '')
    setStatusPendidikan(item.status_pendidikan || 'LULUS')
    setRemark(item.remark || '')
    setModalVisible(true)
  }

  const closeModal = () => {
    if (saving) return
    setModalVisible(false)
    resetForm()
  }

  const handleSave = async () => {
    if (!canSave) {
      Alert.alert('Validasi', 'Jenjang pendidikan dan nama institusi wajib diisi.')
      return
    }

    if (tahunMasuk.trim() && !/^\d{4}$/.test(tahunMasuk.trim())) {
      Alert.alert('Validasi', 'Tahun masuk harus 4 digit.')
      return
    }

    if (tahunLulus.trim() && !/^\d{4}$/.test(tahunLulus.trim())) {
      Alert.alert('Validasi', 'Tahun lulus harus 4 digit.')
      return
    }

    if (
      tahunMasuk.trim() &&
      tahunLulus.trim() &&
      Number(tahunLulus.trim()) < Number(tahunMasuk.trim())
    ) {
      Alert.alert('Validasi', 'Tahun lulus tidak boleh lebih kecil dari tahun masuk.')
      return
    }

    try {
      setSaving(true)

      const payload = {
        id_pendidikan: editingItem?.id_pendidikan,
        jenjang_pendidikan: jenjangPendidikan,
        nama_institusi: namaInstitusi.trim(),
        jurusan: jurusan.trim(),
        tahun_masuk: tahunMasuk.trim(),
        tahun_lulus: tahunLulus.trim(),
        kota_institusi: kotaInstitusi.trim(),
        status_pendidikan: statusPendidikan,
        remark: remark.trim(),
      }

      const endpoint = editingItem
        ? '/pegawai/pendidikan/update.php'
        : '/pegawai/pendidikan/create.php'

      const res = await api.post(endpoint, payload)

      if (!res?.data?.success) {
        Alert.alert('Gagal', res?.data?.message || 'Gagal menyimpan pendidikan pegawai.')
        return
      }

      closeModal()
      await loadData()
    } catch (error: any) {
      console.log('PEGAWAI PENDIDIKAN SAVE ERROR:', error?.response?.data || error?.message)

      if (error?.response?.status === 401) {
        await handleUnauthorized()
        return
      }

      Alert.alert(
        'Error',
        error?.response?.data?.message ||
          error?.message ||
          'Terjadi kesalahan saat menyimpan pendidikan pegawai.'
      )
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = (item: PendidikanItem) => {
    Alert.alert(
      'Hapus Pendidikan',
      `Yakin ingin menghapus pendidikan "${item.nama_institusi}"?`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: async () => {
            try {
              const res = await api.post('/pegawai/pendidikan/delete.php', {
                id_pendidikan: item.id_pendidikan,
              })

              if (!res?.data?.success) {
                Alert.alert('Gagal', res?.data?.message || 'Gagal menghapus pendidikan pegawai.')
                return
              }

              setList((prev) =>
                prev.filter((x) => String(x.id_pendidikan) !== String(item.id_pendidikan))
              )
            } catch (error: any) {
              console.log('PEGAWAI PENDIDIKAN DELETE ERROR:', error?.response?.data || error?.message)

              if (error?.response?.status === 401) {
                await handleUnauthorized()
                return
              }

              Alert.alert(
                'Error',
                error?.response?.data?.message ||
                  error?.message ||
                  'Terjadi kesalahan saat menghapus pendidikan pegawai.'
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
      'Hapus Pendidikan',
      `Yakin ingin menghapus pendidikan "${editingItem.nama_institusi}"?`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: async () => {
            try {
              setSaving(true)

              const res = await api.post('/pegawai/pendidikan/delete.php', {
                id_pendidikan: editingItem.id_pendidikan,
              })

              if (!res?.data?.success) {
                Alert.alert('Gagal', res?.data?.message || 'Gagal menghapus pendidikan pegawai.')
                return
              }

              const deletedId = editingItem.id_pendidikan
              closeModal()
              setList((prev) =>
                prev.filter((x) => String(x.id_pendidikan) !== String(deletedId))
              )
            } catch (error: any) {
              console.log(
                'PEGAWAI PENDIDIKAN DELETE FROM MODAL ERROR:',
                error?.response?.data || error?.message
              )

              if (error?.response?.status === 401) {
                await handleUnauthorized()
                return
              }

              Alert.alert(
                'Error',
                error?.response?.data?.message ||
                  error?.message ||
                  'Terjadi kesalahan saat menghapus pendidikan pegawai.'
              )
            } finally {
              setSaving(false)
            }
          },
        },
      ]
    )
  }

  const renderRightActions = (item: PendidikanItem) => (
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
    item: PendidikanItem
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
            <Ionicons name="school-outline" size={24} color={COLORS.primary} />
          </View>

          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>
              {item.jenjang_pendidikan} - {item.nama_institusi}
            </Text>

            <Text style={styles.cardSubtitle} numberOfLines={3}>
              {item.jurusan?.trim() ? `Jurusan: ${item.jurusan}` : 'Jurusan: -'}
              {'\n'}
              Tahun: {item.tahun_masuk || '-'} - {item.tahun_lulus || '-'}
              {'\n'}
              Kota: {item.kota_institusi?.trim() ? item.kota_institusi : '-'}
            </Text>

            <View
              style={[
                styles.statusBadge,
                item.status_pendidikan === 'LULUS'
                  ? styles.statusLulus
                  : styles.statusBelumLulus,
              ]}
            >
              <Text style={styles.statusBadgeText}>{item.status_pendidikan}</Text>
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
          <Text style={styles.headerTitle}>Pendidikan</Text>
          <Text style={styles.headerSubtitle}>{namaPegawai}</Text>
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
                  statusFilter === 'LULUS' && styles.filterActive,
                ]}
                onPress={() => setStatusFilter('LULUS')}
              >
                <Text
                  style={[
                    styles.filterText,
                    statusFilter === 'LULUS' && styles.filterTextActive,
                  ]}
                >
                  LULUS
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.filterBtn,
                  statusFilter === 'BELUM_LULUS' && styles.filterActive,
                ]}
                onPress={() => setStatusFilter('BELUM_LULUS')}
              >
                <Text
                  style={[
                    styles.filterText,
                    statusFilter === 'BELUM_LULUS' && styles.filterTextActive,
                  ]}
                >
                  BELUM LULUS
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
              <Text style={styles.centerStateText}>Memuat data pendidikan...</Text>
            </View>
          ) : list.length === 0 ? (
            <View style={styles.centerState}>
              <Ionicons name="school-outline" size={48} color="#9CA3AF" />
              <Text style={styles.centerStateTitle}>Belum ada data pendidikan</Text>
              <Text style={styles.centerStateText}>
                Tambahkan data pendidikan untuk status {statusFilter.toLowerCase().replace('_', ' ')}.
              </Text>
            </View>
          ) : (
            <FlatList
              data={list}
              keyExtractor={(item) => String(item.id_pendidikan)}
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
              <Text style={styles.modalTitle}>
                {editingItem ? 'Update Pendidikan' : 'Tambah Pendidikan'}
              </Text>
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

              <Text style={styles.sectionLabel}>Jenjang Pendidikan</Text>
              <View style={styles.optionWrap}>
                {JENJANG_OPTIONS.map((item) => {
                  const active = jenjangPendidikan === item
                  return (
                    <TouchableOpacity
                      key={item}
                      style={[styles.optionChip, active && styles.optionChipActive]}
                      onPress={() => setJenjangPendidikan(item)}
                      disabled={saving}
                    >
                      <Text style={[styles.optionChipText, active && styles.optionChipTextActive]}>
                        {item}
                      </Text>
                    </TouchableOpacity>
                  )
                })}
              </View>

              <TextInput
                placeholder="Nama Institusi"
                style={styles.input}
                placeholderTextColor="#999"
                value={namaInstitusi}
                onChangeText={setNamaInstitusi}
                editable={!saving}
              />

              <TextInput
                placeholder="Jurusan"
                style={styles.input}
                placeholderTextColor="#999"
                value={jurusan}
                onChangeText={setJurusan}
                editable={!saving}
              />

              <View style={styles.rowTwoCol}>
                <TextInput
                  placeholder="Tahun Masuk"
                  style={[styles.input, styles.flexHalf]}
                  placeholderTextColor="#999"
                  value={tahunMasuk}
                  onChangeText={setTahunMasuk}
                  editable={!saving}
                  keyboardType="number-pad"
                  maxLength={4}
                />

                <TextInput
                  placeholder="Tahun Lulus"
                  style={[styles.input, styles.flexHalf]}
                  placeholderTextColor="#999"
                  value={tahunLulus}
                  onChangeText={setTahunLulus}
                  editable={!saving}
                  keyboardType="number-pad"
                  maxLength={4}
                />
              </View>

              <TextInput
                placeholder="Kota Institusi"
                style={styles.input}
                placeholderTextColor="#999"
                value={kotaInstitusi}
                onChangeText={setKotaInstitusi}
                editable={!saving}
              />

              <View style={styles.statusSwitchWrap}>
                <TouchableOpacity
                  style={[
                    styles.statusSwitchBtn,
                    statusPendidikan === 'LULUS' && styles.statusSwitchActive,
                  ]}
                  onPress={() => setStatusPendidikan('LULUS')}
                  disabled={saving}
                >
                  <Text
                    style={[
                      styles.statusSwitchText,
                      statusPendidikan === 'LULUS' && styles.statusSwitchTextActive,
                    ]}
                  >
                    LULUS
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.statusSwitchBtn,
                    statusPendidikan === 'BELUM_LULUS' && styles.statusSwitchActive,
                  ]}
                  onPress={() => setStatusPendidikan('BELUM_LULUS')}
                  disabled={saving}
                >
                  <Text
                    style={[
                      styles.statusSwitchText,
                      statusPendidikan === 'BELUM_LULUS' && styles.statusSwitchTextActive,
                    ]}
                  >
                    BELUM LULUS
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

              <TouchableOpacity
                style={styles.cancelButton}
                onPress={closeModal}
                disabled={saving}
              >
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

  statusBadge: {
    marginTop: 8,
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },

  statusLulus: {
    backgroundColor: '#DCFCE7',
  },

  statusBelumLulus: {
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

  rowTwoCol: {
    flexDirection: 'row',
    gap: 10,
  },

  flexHalf: {
    flex: 1,
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