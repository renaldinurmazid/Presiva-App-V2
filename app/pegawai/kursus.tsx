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

type KursusItem = {
  id_kursus_diklat: number | string
  nama_kursus_diklat: string
  penyelenggara: string
  tahun: string
  nomor_sertifikat: string
  file_sertifikat: string
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

export default function KursusScreen() {
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

  const [list, setList] = useState<KursusItem[]>([])
  const [loading, setLoading] = useState(true)

  const [modalVisible, setModalVisible] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editingItem, setEditingItem] = useState<KursusItem | null>(null)

  const [namaKursusDiklat, setNamaKursusDiklat] = useState('')
  const [penyelenggara, setPenyelenggara] = useState('')
  const [tahun, setTahun] = useState('')
  const [nomorSertifikat, setNomorSertifikat] = useState('')
  const [fileSertifikat, setFileSertifikat] = useState('')
  const [remark, setRemark] = useState('')

  const canSave = useMemo(() => {
    return namaKursusDiklat.trim() !== ''
  }, [namaKursusDiklat])

  const handleUnauthorized = async () => {
    await clearSession()
    setAuthToken(undefined)
    Alert.alert('Session Expired', 'Silakan login kembali.')
    router.replace('/auth/login')
  }

  const loadData = async () => {
    try {
      setLoading(true)

      const res = await api.get('/pegawai/kursus/list.php')

      if (!res?.data?.success) {
        throw new Error(res?.data?.message || 'Gagal mengambil data kursus / diklat.')
      }

      setList(Array.isArray(res.data.data) ? res.data.data : [])
    } catch (error: any) {
      console.log('PEGAWAI KURSUS LIST ERROR:', error?.response?.data || error?.message)

      if (error?.response?.status === 401) {
        await handleUnauthorized()
        return
      }

      Alert.alert(
        'Error',
        error?.response?.data?.message ||
          error?.message ||
          'Gagal mengambil data kursus / diklat.'
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
    setNamaKursusDiklat('')
    setPenyelenggara('')
    setTahun('')
    setNomorSertifikat('')
    setFileSertifikat('')
    setRemark('')
  }

  const openAddModal = () => {
    resetForm()
    setModalVisible(true)
  }

  const openEditModal = (item: KursusItem) => {
    setEditingItem(item)
    setNamaKursusDiklat(item.nama_kursus_diklat || '')
    setPenyelenggara(item.penyelenggara || '')
    setTahun(item.tahun || '')
    setNomorSertifikat(item.nomor_sertifikat || '')
    setFileSertifikat(item.file_sertifikat || '')
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
      Alert.alert('Validasi', 'Nama kursus / diklat wajib diisi.')
      return
    }

    if (tahun.trim() && !/^\d{4}$/.test(tahun.trim())) {
      Alert.alert('Validasi', 'Tahun harus 4 digit.')
      return
    }

    try {
      setSaving(true)

      const payload = {
        id_kursus_diklat: editingItem?.id_kursus_diklat,
        nama_kursus_diklat: namaKursusDiklat.trim(),
        penyelenggara: penyelenggara.trim(),
        tahun: tahun.trim(),
        nomor_sertifikat: nomorSertifikat.trim(),
        file_sertifikat: fileSertifikat.trim(),
        remark: remark.trim(),
      }

      const endpoint = editingItem
        ? '/pegawai/kursus/update.php'
        : '/pegawai/kursus/create.php'

      const res = await api.post(endpoint, payload)

      if (!res?.data?.success) {
        Alert.alert('Gagal', res?.data?.message || 'Gagal menyimpan kursus / diklat.')
        return
      }

      closeModal()
      await loadData()
    } catch (error: any) {
      console.log('PEGAWAI KURSUS SAVE ERROR:', error?.response?.data || error?.message)

      if (error?.response?.status === 401) {
        await handleUnauthorized()
        return
      }

      Alert.alert(
        'Error',
        error?.response?.data?.message ||
          error?.message ||
          'Terjadi kesalahan saat menyimpan kursus / diklat.'
      )
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = (item: KursusItem) => {
    Alert.alert(
      'Hapus Kursus / Diklat',
      `Yakin ingin menghapus "${item.nama_kursus_diklat}"?`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: async () => {
            try {
              const res = await api.post('/pegawai/kursus/delete.php', {
                id_kursus_diklat: item.id_kursus_diklat,
              })

              if (!res?.data?.success) {
                Alert.alert('Gagal', res?.data?.message || 'Gagal menghapus kursus / diklat.')
                return
              }

              setList((prev) =>
                prev.filter(
                  (x) => String(x.id_kursus_diklat) !== String(item.id_kursus_diklat)
                )
              )
            } catch (error: any) {
              console.log('PEGAWAI KURSUS DELETE ERROR:', error?.response?.data || error?.message)

              if (error?.response?.status === 401) {
                await handleUnauthorized()
                return
              }

              Alert.alert(
                'Error',
                error?.response?.data?.message ||
                  error?.message ||
                  'Terjadi kesalahan saat menghapus kursus / diklat.'
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
      'Hapus Kursus / Diklat',
      `Yakin ingin menghapus "${editingItem.nama_kursus_diklat}"?`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: async () => {
            try {
              setSaving(true)

              const res = await api.post('/pegawai/kursus/delete.php', {
                id_kursus_diklat: editingItem.id_kursus_diklat,
              })

              if (!res?.data?.success) {
                Alert.alert('Gagal', res?.data?.message || 'Gagal menghapus kursus / diklat.')
                return
              }

              const deletedId = editingItem.id_kursus_diklat
              closeModal()
              setList((prev) =>
                prev.filter((x) => String(x.id_kursus_diklat) !== String(deletedId))
              )
            } catch (error: any) {
              console.log(
                'PEGAWAI KURSUS DELETE FROM MODAL ERROR:',
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
                  'Terjadi kesalahan saat menghapus kursus / diklat.'
              )
            } finally {
              setSaving(false)
            }
          },
        },
      ]
    )
  }

  const renderRightActions = (item: KursusItem) => (
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
    item: KursusItem
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
            <Ionicons name="ribbon-outline" size={24} color={COLORS.primary} />
          </View>

          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>{item.nama_kursus_diklat}</Text>
            <Text style={styles.cardSubtitle} numberOfLines={3}>
              Penyelenggara: {item.penyelenggara?.trim() ? item.penyelenggara : '-'}
              {'\n'}
              Tahun: {item.tahun || '-'}
              {'\n'}
              Sertifikat: {item.nomor_sertifikat?.trim() ? item.nomor_sertifikat : '-'}
            </Text>

            <View style={styles.yearBadge}>
              <Text style={styles.yearBadgeText}>{item.tahun || 'N/A'}</Text>
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
          <Text style={styles.headerTitle}>Kursus / Diklat</Text>
          <Text style={styles.headerSubtitle}>{namaPegawai}</Text>
          <Text style={styles.headerSubtitle}>{namaMitra}</Text>
        </View>
      </View>

      <View style={styles.contentContainer}>
        <View style={styles.content}>
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
              <Text style={styles.centerStateText}>Memuat data kursus / diklat...</Text>
            </View>
          ) : list.length === 0 ? (
            <View style={styles.centerState}>
              <Ionicons name="ribbon-outline" size={48} color="#9CA3AF" />
              <Text style={styles.centerStateTitle}>Belum ada data kursus / diklat</Text>
              <Text style={styles.centerStateText}>
                Tambahkan data kursus / diklat terlebih dahulu.
              </Text>
            </View>
          ) : (
            <FlatList
              data={list}
              keyExtractor={(item) => String(item.id_kursus_diklat)}
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
                {editingItem ? 'Update Kursus / Diklat' : 'Tambah Kursus / Diklat'}
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

              <TextInput
                placeholder="Nama Kursus / Diklat"
                style={styles.input}
                placeholderTextColor="#999"
                value={namaKursusDiklat}
                onChangeText={setNamaKursusDiklat}
                editable={!saving}
              />

              <TextInput
                placeholder="Penyelenggara"
                style={styles.input}
                placeholderTextColor="#999"
                value={penyelenggara}
                onChangeText={setPenyelenggara}
                editable={!saving}
              />

              <TextInput
                placeholder="Tahun"
                style={styles.input}
                placeholderTextColor="#999"
                value={tahun}
                onChangeText={setTahun}
                editable={!saving}
                keyboardType="number-pad"
                maxLength={4}
              />

              <TextInput
                placeholder="Nomor Sertifikat"
                style={styles.input}
                placeholderTextColor="#999"
                value={nomorSertifikat}
                onChangeText={setNomorSertifikat}
                editable={!saving}
              />

              <TextInput
                placeholder="File Sertifikat"
                style={styles.input}
                placeholderTextColor="#999"
                value={fileSertifikat}
                onChangeText={setFileSertifikat}
                editable={!saving}
              />

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

  yearBadge: {
    marginTop: 8,
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: '#DBEAFE',
  },

  yearBadgeText: {
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