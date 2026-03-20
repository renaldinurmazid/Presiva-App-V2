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

type KeluargaItem = {
  id_pegawai_keluarga: number | string
  hubungan_keluarga: 'ISTRI' | 'SUAMI' | 'ANAK'
  nama_keluarga: string
  jenis_kelamin: 'L' | 'P' | ''
  tempat_lahir: string
  tanggal_lahir: string
  pekerjaan: string
  status_tanggungan: 'YA' | 'TIDAK'
  remark: string | null
}

const HUBUNGAN_OPTIONS: KeluargaItem['hubungan_keluarga'][] = ['ISTRI', 'SUAMI', 'ANAK']

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

export default function KeluargaScreen() {
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

  const [hubunganFilter, setHubunganFilter] = useState<'ISTRI' | 'SUAMI' | 'ANAK'>('ANAK')
  const [list, setList] = useState<KeluargaItem[]>([])
  const [loading, setLoading] = useState(true)

  const [modalVisible, setModalVisible] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editingItem, setEditingItem] = useState<KeluargaItem | null>(null)

  const [hubunganKeluarga, setHubunganKeluarga] =
    useState<KeluargaItem['hubungan_keluarga']>('ANAK')
  const [namaKeluarga, setNamaKeluarga] = useState('')
  const [jenisKelamin, setJenisKelamin] = useState<'L' | 'P' | ''>('')
  const [tempatLahir, setTempatLahir] = useState('')
  const [tanggalLahir, setTanggalLahir] = useState('')
  const [pekerjaan, setPekerjaan] = useState('')
  const [statusTanggungan, setStatusTanggungan] = useState<'YA' | 'TIDAK'>('YA')
  const [remark, setRemark] = useState('')

  const canSave = useMemo(() => {
    return hubunganKeluarga.trim() !== '' && namaKeluarga.trim() !== ''
  }, [hubunganKeluarga, namaKeluarga])

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
        `/pegawai/keluarga/list.php?hubungan_keluarga=${hubunganFilter}`
      )

      if (!res?.data?.success) {
        throw new Error(res?.data?.message || 'Gagal mengambil data keluarga pegawai.')
      }

      setList(Array.isArray(res.data.data) ? res.data.data : [])
    } catch (error: any) {
      console.log('PEGAWAI KELUARGA LIST ERROR:', error?.response?.data || error?.message)

      if (error?.response?.status === 401) {
        await handleUnauthorized()
        return
      }

      Alert.alert(
        'Error',
        error?.response?.data?.message ||
          error?.message ||
          'Gagal mengambil data keluarga pegawai.'
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [hubunganFilter])

  const resetForm = () => {
    setEditingItem(null)
    setHubunganKeluarga('ANAK')
    setNamaKeluarga('')
    setJenisKelamin('')
    setTempatLahir('')
    setTanggalLahir('')
    setPekerjaan('')
    setStatusTanggungan('YA')
    setRemark('')
  }

  const openAddModal = () => {
    resetForm()
    setModalVisible(true)
  }

  const openEditModal = (item: KeluargaItem) => {
    setEditingItem(item)
    setHubunganKeluarga(item.hubungan_keluarga || 'ANAK')
    setNamaKeluarga(item.nama_keluarga || '')
    setJenisKelamin((item.jenis_kelamin as 'L' | 'P' | '') || '')
    setTempatLahir(item.tempat_lahir || '')
    setTanggalLahir(item.tanggal_lahir || '')
    setPekerjaan(item.pekerjaan || '')
    setStatusTanggungan(item.status_tanggungan || 'YA')
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
      Alert.alert('Validasi', 'Hubungan keluarga dan nama keluarga wajib diisi.')
      return
    }

    if (tanggalLahir.trim() && !/^\d{4}-\d{2}-\d{2}$/.test(tanggalLahir.trim())) {
      Alert.alert('Validasi', 'Tanggal lahir harus format YYYY-MM-DD.')
      return
    }

    try {
      setSaving(true)

      const payload = {
        id_pegawai_keluarga: editingItem?.id_pegawai_keluarga,
        hubungan_keluarga: hubunganKeluarga,
        nama_keluarga: namaKeluarga.trim(),
        jenis_kelamin: jenisKelamin,
        tempat_lahir: tempatLahir.trim(),
        tanggal_lahir: tanggalLahir.trim(),
        pekerjaan: pekerjaan.trim(),
        status_tanggungan: statusTanggungan,
        remark: remark.trim(),
      }

      const endpoint = editingItem
        ? '/pegawai/keluarga/update.php'
        : '/pegawai/keluarga/create.php'

      const res = await api.post(endpoint, payload)

      if (!res?.data?.success) {
        Alert.alert('Gagal', res?.data?.message || 'Gagal menyimpan keluarga pegawai.')
        return
      }

      closeModal()
      await loadData()
    } catch (error: any) {
      console.log('PEGAWAI KELUARGA SAVE ERROR:', error?.response?.data || error?.message)

      if (error?.response?.status === 401) {
        await handleUnauthorized()
        return
      }

      Alert.alert(
        'Error',
        error?.response?.data?.message ||
          error?.message ||
          'Terjadi kesalahan saat menyimpan keluarga pegawai.'
      )
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = (item: KeluargaItem) => {
    Alert.alert(
      'Hapus Keluarga',
      `Yakin ingin menghapus data "${item.nama_keluarga}"?`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: async () => {
            try {
              const res = await api.post('/pegawai/keluarga/delete.php', {
                id_pegawai_keluarga: item.id_pegawai_keluarga,
              })

              if (!res?.data?.success) {
                Alert.alert('Gagal', res?.data?.message || 'Gagal menghapus keluarga pegawai.')
                return
              }

              setList((prev) =>
                prev.filter(
                  (x) =>
                    String(x.id_pegawai_keluarga) !== String(item.id_pegawai_keluarga)
                )
              )
            } catch (error: any) {
              console.log('PEGAWAI KELUARGA DELETE ERROR:', error?.response?.data || error?.message)

              if (error?.response?.status === 401) {
                await handleUnauthorized()
                return
              }

              Alert.alert(
                'Error',
                error?.response?.data?.message ||
                  error?.message ||
                  'Terjadi kesalahan saat menghapus keluarga pegawai.'
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
      'Hapus Keluarga',
      `Yakin ingin menghapus data "${editingItem.nama_keluarga}"?`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: async () => {
            try {
              setSaving(true)

              const res = await api.post('/pegawai/keluarga/delete.php', {
                id_pegawai_keluarga: editingItem.id_pegawai_keluarga,
              })

              if (!res?.data?.success) {
                Alert.alert('Gagal', res?.data?.message || 'Gagal menghapus keluarga pegawai.')
                return
              }

              const deletedId = editingItem.id_pegawai_keluarga
              closeModal()
              setList((prev) =>
                prev.filter(
                  (x) => String(x.id_pegawai_keluarga) !== String(deletedId)
                )
              )
            } catch (error: any) {
              console.log(
                'PEGAWAI KELUARGA DELETE FROM MODAL ERROR:',
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
                  'Terjadi kesalahan saat menghapus keluarga pegawai.'
              )
            } finally {
              setSaving(false)
            }
          },
        },
      ]
    )
  }

  const renderRightActions = (item: KeluargaItem) => (
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
    item: KeluargaItem
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
            <Ionicons name="people-outline" size={24} color={COLORS.primary} />
          </View>

          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>
              {item.nama_keluarga}
            </Text>

            <Text style={styles.cardSubtitle} numberOfLines={3}>
              Hubungan: {item.hubungan_keluarga}
              {'\n'}
              Lahir: {item.tempat_lahir?.trim() ? item.tempat_lahir : '-'} / {item.tanggal_lahir || '-'}
              {'\n'}
              Pekerjaan: {item.pekerjaan?.trim() ? item.pekerjaan : '-'}
            </Text>

            <View style={styles.badgeRow}>
              <View style={styles.statusBadge}>
                <Text style={styles.statusBadgeText}>{item.status_tanggungan}</Text>
              </View>

              {item.jenis_kelamin ? (
                <View style={styles.genderBadge}>
                  <Text style={styles.genderBadgeText}>{item.jenis_kelamin}</Text>
                </View>
              ) : null}
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
          <Text style={styles.headerTitle}>Keluarga</Text>
          <Text style={styles.headerSubtitle}>{namaPegawai}</Text>
          <Text style={styles.headerSubtitle}>{namaMitra}</Text>
        </View>
      </View>

      <View style={styles.contentContainer}>
        <View style={styles.content}>
          <View style={styles.topBar}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterWrap}>
              {HUBUNGAN_OPTIONS.map((item) => {
                const active = hubunganFilter === item
                return (
                  <TouchableOpacity
                    key={item}
                    style={[styles.filterBtn, active && styles.filterActive]}
                    onPress={() => setHubunganFilter(item)}
                  >
                    <Text style={[styles.filterText, active && styles.filterTextActive]}>
                      {item}
                    </Text>
                  </TouchableOpacity>
                )
              })}
            </ScrollView>

            <TouchableOpacity style={styles.addButton} onPress={openAddModal}>
              <Ionicons name="add" size={18} color="#FFF" />
              <Text style={styles.addButtonText}>Tambah</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.centerState}>
              <ActivityIndicator size="large" color={COLORS.primary} />
              <Text style={styles.centerStateText}>Memuat data keluarga...</Text>
            </View>
          ) : list.length === 0 ? (
            <View style={styles.centerState}>
              <Ionicons name="people-outline" size={48} color="#9CA3AF" />
              <Text style={styles.centerStateTitle}>Belum ada data keluarga</Text>
              <Text style={styles.centerStateText}>
                Tambahkan data keluarga untuk kategori {hubunganFilter.toLowerCase()}.
              </Text>
            </View>
          ) : (
            <FlatList
              data={list}
              keyExtractor={(item) => String(item.id_pegawai_keluarga)}
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
                {editingItem ? 'Update Keluarga' : 'Tambah Keluarga'}
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

              <Text style={styles.sectionLabel}>Hubungan Keluarga</Text>
              <View style={styles.optionWrap}>
                {HUBUNGAN_OPTIONS.map((item) => {
                  const active = hubunganKeluarga === item
                  return (
                    <TouchableOpacity
                      key={item}
                      style={[styles.optionChip, active && styles.optionChipActive]}
                      onPress={() => setHubunganKeluarga(item)}
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
                placeholder="Nama Keluarga"
                style={styles.input}
                placeholderTextColor="#999"
                value={namaKeluarga}
                onChangeText={setNamaKeluarga}
                editable={!saving}
              />

              <View style={styles.statusSwitchWrap}>
                <TouchableOpacity
                  style={[
                    styles.statusSwitchBtn,
                    jenisKelamin === 'L' && styles.statusSwitchActive,
                  ]}
                  onPress={() => setJenisKelamin('L')}
                  disabled={saving}
                >
                  <Text
                    style={[
                      styles.statusSwitchText,
                      jenisKelamin === 'L' && styles.statusSwitchTextActive,
                    ]}
                  >
                    L
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.statusSwitchBtn,
                    jenisKelamin === 'P' && styles.statusSwitchActive,
                  ]}
                  onPress={() => setJenisKelamin('P')}
                  disabled={saving}
                >
                  <Text
                    style={[
                      styles.statusSwitchText,
                      jenisKelamin === 'P' && styles.statusSwitchTextActive,
                    ]}
                  >
                    P
                  </Text>
                </TouchableOpacity>
              </View>

              <TextInput
                placeholder="Tempat Lahir"
                style={styles.input}
                placeholderTextColor="#999"
                value={tempatLahir}
                onChangeText={setTempatLahir}
                editable={!saving}
              />

              <TextInput
                placeholder="Tanggal Lahir (YYYY-MM-DD)"
                style={styles.input}
                placeholderTextColor="#999"
                value={tanggalLahir}
                onChangeText={setTanggalLahir}
                editable={!saving}
              />

              <TextInput
                placeholder="Pekerjaan"
                style={styles.input}
                placeholderTextColor="#999"
                value={pekerjaan}
                onChangeText={setPekerjaan}
                editable={!saving}
              />

              <View style={styles.statusSwitchWrap}>
                <TouchableOpacity
                  style={[
                    styles.statusSwitchBtn,
                    statusTanggungan === 'YA' && styles.statusSwitchActive,
                  ]}
                  onPress={() => setStatusTanggungan('YA')}
                  disabled={saving}
                >
                  <Text
                    style={[
                      styles.statusSwitchText,
                      statusTanggungan === 'YA' && styles.statusSwitchTextActive,
                    ]}
                  >
                    TANGGUNGAN YA
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.statusSwitchBtn,
                    statusTanggungan === 'TIDAK' && styles.statusSwitchActive,
                  ]}
                  onPress={() => setStatusTanggungan('TIDAK')}
                  disabled={saving}
                >
                  <Text
                    style={[
                      styles.statusSwitchText,
                      statusTanggungan === 'TIDAK' && styles.statusSwitchTextActive,
                    ]}
                  >
                    TANGGUNGAN TIDAK
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
    gap: 10,
    paddingRight: 8,
  },

  filterBtn: {
    paddingVertical: 12,
    paddingHorizontal: 16,
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

  badgeRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },

  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: '#DCFCE7',
  },

  statusBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#111827',
  },

  genderBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: '#E0E7FF',
  },

  genderBadgeText: {
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