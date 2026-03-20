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

import { COLORS } from '@/constants/colors'
import { useAuthStore } from '@/store/auth.store'
import { api, setAuthToken } from '@/services/api'

type InformasiItem = {
  id_informasi: number | string
  judul_informasi: string
  isi_informasi: string
  status_informasi: 'AKTIF' | 'NONAKTIF'
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

export default function InformasiScreen() {
  const router = useRouter()
  const user = useAuthStore((state) => state.user)
  const clearSession = useAuthStore((state) => state.clearSession)

  const namaMitra =
    (user as any)?.nama_mitra ||
    (user as any)?.mitra?.nama_mitra ||
    '-'

  const [statusFilter, setStatusFilter] = useState<'AKTIF' | 'NONAKTIF'>('AKTIF')
  const [list, setList] = useState<InformasiItem[]>([])
  const [loading, setLoading] = useState(true)

  const [modalVisible, setModalVisible] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editingItem, setEditingItem] = useState<InformasiItem | null>(null)

  const [judulInformasi, setJudulInformasi] = useState('')
  const [isiInformasi, setIsiInformasi] = useState('')
  const [statusInformasi, setStatusInformasi] = useState<'AKTIF' | 'NONAKTIF'>('AKTIF')
  const [remark, setRemark] = useState('')

  const canSave = useMemo(() => {
    return judulInformasi.trim() !== '' && isiInformasi.trim() !== ''
  }, [judulInformasi, isiInformasi])

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
        `/hrd/informasi/list.php?status=${statusFilter}`
      )

      if (!res?.data?.success) {
        throw new Error(res?.data?.message || 'Gagal mengambil data informasi.')
      }

      setList(Array.isArray(res.data.data) ? res.data.data : [])
    } catch (error: any) {
      console.log('HRD INFORMASI LIST ERROR:', error?.response?.data || error?.message)

      if (error?.response?.status === 401) {
        await handleUnauthorized()
        return
      }

      Alert.alert(
        'Error',
        error?.response?.data?.message ||
          error?.message ||
          'Gagal mengambil data informasi.'
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [statusFilter])

  const openAddModal = () => {
    setEditingItem(null)
    setJudulInformasi('')
    setIsiInformasi('')
    setStatusInformasi('AKTIF')
    setRemark('')
    setModalVisible(true)
  }

  const openEditModal = (item: InformasiItem) => {
    setEditingItem(item)
    setJudulInformasi(item.judul_informasi || '')
    setIsiInformasi(item.isi_informasi || '')
    setStatusInformasi(item.status_informasi || 'AKTIF')
    setRemark(item.remark || '')
    setModalVisible(true)
  }

  const closeModal = () => {
    if (saving) return
    setModalVisible(false)
    setEditingItem(null)
    setJudulInformasi('')
    setIsiInformasi('')
    setStatusInformasi('AKTIF')
    setRemark('')
  }

  const handleSave = async () => {
    if (!canSave) {
      Alert.alert('Validasi', 'Judul dan isi informasi wajib diisi.')
      return
    }

    try {
      setSaving(true)

      const payload = {
        id_informasi: editingItem?.id_informasi,
        judul_informasi: judulInformasi.trim(),
        isi_informasi: isiInformasi.trim(),
        status_informasi: statusInformasi,
        remark: remark.trim(),
      }

      const endpoint = editingItem
        ? '/hrd/informasi/update.php'
        : '/hrd/informasi/create.php'

      const res = await api.post(endpoint, payload)

      if (!res?.data?.success) {
        Alert.alert('Gagal', res?.data?.message || 'Gagal menyimpan informasi.')
        return
      }

      closeModal()
      await loadData()
    } catch (error: any) {
      console.log('HRD INFORMASI SAVE ERROR:', error?.response?.data || error?.message)

      if (error?.response?.status === 401) {
        await handleUnauthorized()
        return
      }

      Alert.alert(
        'Error',
        error?.response?.data?.message ||
          error?.message ||
          'Terjadi kesalahan saat menyimpan informasi.'
      )
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = (item: InformasiItem) => {
    Alert.alert(
      'Hapus Informasi',
      `Yakin ingin menghapus informasi "${item.judul_informasi}"?`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: async () => {
            try {
              const res = await api.post('/hrd/informasi/delete.php', {
                id_informasi: item.id_informasi,
              })

              if (!res?.data?.success) {
                Alert.alert('Gagal', res?.data?.message || 'Gagal menghapus informasi.')
                return
              }

              setList((prev) =>
                prev.filter((x) => String(x.id_informasi) !== String(item.id_informasi))
              )
            } catch (error: any) {
              console.log('HRD INFORMASI DELETE ERROR:', error?.response?.data || error?.message)

              if (error?.response?.status === 401) {
                await handleUnauthorized()
                return
              }

              Alert.alert(
                'Error',
                error?.response?.data?.message ||
                  error?.message ||
                  'Terjadi kesalahan saat menghapus informasi.'
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
      'Hapus Informasi',
      `Yakin ingin menghapus Informasi Ini?`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: async () => {
            try {
              setSaving(true)

              const res = await api.post('/hrd/informasi/delete.php', {
                id_informasi: editingItem.id_informasi,
              })

              if (!res?.data?.success) {
                Alert.alert('Gagal', res?.data?.message || 'Gagal menghapus data.')
                return
              }

              const deletedId = editingItem.id_informasi
              closeModal()
              setList((prev) => prev.filter((x) => String(x.id_informasi) !== String(deletedId)))
            } catch (error: any) {
              console.log(
                'HRD INFORMASI DELETE FROM MODAL ERROR:',
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

  const renderRightActions = (item: InformasiItem) => (
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
    item: InformasiItem
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
            <Ionicons name="notifications-outline" size={24} color={COLORS.primary} />
          </View>

          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>{item.judul_informasi}</Text>
            <Text style={styles.cardSubtitle} numberOfLines={3}>
              {item.isi_informasi?.trim() ? item.isi_informasi : 'Isi informasi kosong'}
            </Text>

            <View
              style={[
                styles.statusBadge,
                item.status_informasi === 'AKTIF'
                  ? styles.statusAktif
                  : styles.statusNonaktif,
              ]}
            >
              <Text style={styles.statusBadgeText}>{item.status_informasi}</Text>
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
          <Text style={styles.headerTitle}>Informasi</Text>
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
              <Text style={styles.centerStateText}>Memuat informasi...</Text>
            </View>
          ) : list.length === 0 ? (
            <View style={styles.centerState}>
              <Ionicons name="notifications-outline" size={48} color="#9CA3AF" />
              <Text style={styles.centerStateTitle}>Belum ada informasi</Text>
              <Text style={styles.centerStateText}>
                Tambahkan data informasi untuk status {statusFilter.toLowerCase()}.
              </Text>
            </View>
          ) : (
            <FlatList
              data={list}
              keyExtractor={(item) => String(item.id_informasi)}
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
                {editingItem ? 'Update Informasi' : 'Tambah Informasi'}
              </Text>
              <TouchableOpacity onPress={closeModal} disabled={saving}>
                <Ionicons name="close-outline" size={26} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <TextInput
              placeholder="Judul Informasi"
              style={styles.input}
              placeholderTextColor="#999"
              value={judulInformasi}
              onChangeText={setJudulInformasi}
              editable={!saving}
            />

            <TextInput
              placeholder="Isi Informasi"
              style={[styles.input, styles.textAreaLarge]}
              placeholderTextColor="#999"
              value={isiInformasi}
              onChangeText={setIsiInformasi}
              editable={!saving}
              multiline
            />

            <View style={styles.statusSwitchWrap}>
              <TouchableOpacity
                style={[
                  styles.statusSwitchBtn,
                  statusInformasi === 'AKTIF' && styles.statusSwitchActive,
                ]}
                onPress={() => setStatusInformasi('AKTIF')}
                disabled={saving}
              >
                <Text
                  style={[
                    styles.statusSwitchText,
                    statusInformasi === 'AKTIF' && styles.statusSwitchTextActive,
                  ]}
                >
                  AKTIF
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.statusSwitchBtn,
                  statusInformasi === 'NONAKTIF' && styles.statusSwitchActive,
                ]}
                onPress={() => setStatusInformasi('NONAKTIF')}
                disabled={saving}
              >
                <Text
                  style={[
                    styles.statusSwitchText,
                    statusInformasi === 'NONAKTIF' && styles.statusSwitchTextActive,
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

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={closeModal}
              disabled={saving}
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

  textAreaLarge: {
    minHeight: 120,
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

  cancelButton: {
    marginTop: 14,
    alignItems: 'center',
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

  cancelButtonText: {
    color: '#6B7280',
    fontWeight: '700',
    fontSize: 14,
  },
})