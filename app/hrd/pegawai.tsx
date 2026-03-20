import React, { useEffect, useMemo, useRef, useState } from 'react'
import {
  View, Text, StyleSheet, TouchableOpacity, FlatList, Modal,
  TextInput, Alert, StatusBar, ActivityIndicator, Animated, ScrollView
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { Swipeable } from 'react-native-gesture-handler'

import { COLORS } from '@/constants/colors'
import { useAuthStore } from '@/store/auth.store'
import { api } from '@/services/api'

function CardAnimated({ children, index }: { children: React.ReactNode; index: number }) {
  const opacity = useRef(new Animated.Value(0)).current
  const translateY = useRef(new Animated.Value(18)).current

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 250, delay: index * 40, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 250, delay: index * 40, useNativeDriver: true }),
    ]).start()
  }, [index])

  return <Animated.View style={{ opacity, transform: [{ translateY }] }}>{children}</Animated.View>
}

type PegawaiItem = {
  id_pegawai: string
  id_mitra?: string
  nama_pegawai: string
  email: string
  role: 'KARYAWAN' | 'HRD'
  status_pegawai: 'AKTIF' | 'NONAKTIF'
  remark?: string
  id_lokasi_absen_default?: string
  nama_lokasi_absen_default?: string
}

type LokasiItem = {
  id_lokasi: string
  nama_lokasi: string
}

type PegawaiForm = {
  id_pegawai: string
  nama_pegawai: string
  email: string
  role: 'KARYAWAN' | 'HRD'
  status_pegawai: 'AKTIF' | 'NONAKTIF'
  remark: string
  id_lokasi_absen_default: string
  nama_lokasi_absen_default: string
}

export default function PegawaiScreen() {
  const router = useRouter()
  const user = useAuthStore((state) => state.user)
  const namaMitra = (user as any)?.nama_mitra || '-'
  const idMitraLogin = String((user as any)?.id_mitra || '')

  const [filterStatus, setFilterStatus] = useState<'AKTIF' | 'NONAKTIF'>('AKTIF')
  const [filterRole, setFilterRole] = useState<'KARYAWAN' | 'HRD'>('KARYAWAN')
  const [list, setList] = useState<PegawaiItem[]>([])
  const [loading, setLoading] = useState(true)

  const [modalVisible, setModalVisible] = useState(false)
  const [saving, setSaving] = useState(false)

  const [lokasiList, setLokasiList] = useState<LokasiItem[]>([])
  const [loadingLokasi, setLoadingLokasi] = useState(false)
  const [lokasiModalVisible, setLokasiModalVisible] = useState(false)

  const emptyForm: PegawaiForm = {
    id_pegawai: '',
    nama_pegawai: '',
    email: '',
    role: 'KARYAWAN',
    status_pegawai: 'AKTIF',
    remark: '',
    id_lokasi_absen_default: '',
    nama_lokasi_absen_default: '',
  }

  const [form, setForm] = useState<PegawaiForm>(emptyForm)

  const selectedLokasiLabel = useMemo(() => {
    const found = lokasiList.find((x) => String(x.id_lokasi) === String(form.id_lokasi_absen_default))
    if (found) return found.nama_lokasi
    return form.nama_lokasi_absen_default || ''
  }, [lokasiList, form.id_lokasi_absen_default, form.nama_lokasi_absen_default])

  const loadData = async () => {
    try {
      setLoading(true)
      const res = await api.get(`/hrd/pegawai/list.php?status=${filterStatus}&role=${filterRole}`)
      setList(res.data.data || [])
    } catch (error) {
      Alert.alert('Error', 'Gagal mengambil data pegawai')
    } finally {
      setLoading(false)
    }
  }

  const loadLokasi = async () => {
    try {
      if (!idMitraLogin) {
        setLokasiList([])
        return
      }

      setLoadingLokasi(true)
      const res = await api.get(`/hrd/lokasi-absensi/by_mitra.php?id_mitra=${idMitraLogin}`)
      setLokasiList(res.data.data || [])
    } catch (error) {
      setLokasiList([])
      Alert.alert('Error', 'Gagal mengambil data lokasi absensi')
    } finally {
      setLoadingLokasi(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [filterStatus, filterRole])

  const openTambahModal = async () => {
    setForm(emptyForm)
    setModalVisible(true)
    await loadLokasi()
  }

  const openEditModal = async (item: PegawaiItem) => {
    setForm({
      id_pegawai: String(item.id_pegawai || ''),
      nama_pegawai: item.nama_pegawai || '',
      email: item.email || '',
      role: (item.role || 'KARYAWAN') as 'KARYAWAN' | 'HRD',
      status_pegawai: (item.status_pegawai || 'AKTIF') as 'AKTIF' | 'NONAKTIF',
      remark: item.remark || '',
      id_lokasi_absen_default: String(item.id_lokasi_absen_default || ''),
      nama_lokasi_absen_default: item.nama_lokasi_absen_default || '',
    })
    setModalVisible(true)
    await loadLokasi()
  }

  const handleSave = async () => {
    if (!form.nama_pegawai.trim() || !form.email.trim()) {
      return Alert.alert('Validasi', 'Nama dan Email wajib diisi')
    }

    if (!form.id_lokasi_absen_default) {
      return Alert.alert('Validasi', 'Lokasi absen default wajib dipilih')
    }

    try {
      setSaving(true)

      const payload = {
        id_pegawai: form.id_pegawai,
        nama_pegawai: form.nama_pegawai.trim(),
        email: form.email.trim(),
        role: form.role,
        status_pegawai: form.status_pegawai,
        remark: form.remark.trim(),
        id_lokasi_absen_default: form.id_lokasi_absen_default,
      }

      const endpoint = form.id_pegawai
        ? '/hrd/pegawai/update.php'
        : '/hrd/pegawai/create.php'

      const res = await api.post(endpoint, payload)

      if (res.data.success) {
        if (!form.id_pegawai) {
          const passwordDefault =
            res.data?.data?.password || '-'

          Alert.alert(
            'Berhasil',
            `Pegawai baru ditambahkan!\n\nPassword Default: ${passwordDefault}\n\nHarap catat password ini.`
          )
        } else {
          Alert.alert('Berhasil', 'Data pegawai berhasil diperbarui')
        }

        setModalVisible(false)
        setForm(emptyForm)
        loadData()
      } else {
        Alert.alert('Error', res.data.message || 'Gagal menyimpan data')
      }
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Gagal menyimpan data')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = (id: string) => {
    Alert.alert('Hapus', 'Hapus data pegawai ini?', [
      { text: 'Batal' },
      {
        text: 'Hapus',
        style: 'destructive',
        onPress: async () => {
          try {
            const res = await api.post('/hrd/pegawai/delete.php', { id_pegawai: id })
            if (res.data.success) {
              loadData()
            } else {
              Alert.alert('Error', res.data.message || 'Gagal menghapus data')
            }
          } catch (error: any) {
            Alert.alert('Error', error.response?.data?.message || 'Gagal menghapus data')
          }
        }
      }
    ])
  }

  const renderItem = ({ item, index }: { item: PegawaiItem; index: number }) => (
    <CardAnimated index={index}>
      <Swipeable
        renderRightActions={() => (
          <TouchableOpacity
            style={styles.deleteSwipeAction}
            onPress={() => handleDelete(String(item.id_pegawai))}
          >
            <Ionicons name="trash-outline" size={22} color="#FFF" />
            <Text style={styles.deleteSwipeText}>Hapus</Text>
          </TouchableOpacity>
        )}
      >
        <TouchableOpacity
          style={styles.card}
          activeOpacity={0.9}
          onPress={() => openEditModal(item)}
        >
          <View style={styles.cardIconWrap}>
            <Text style={styles.avatarText}>
              {item.nama_pegawai?.[0]?.toUpperCase() || '?'}
            </Text>
          </View>

          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>{item.nama_pegawai}</Text>
            <Text style={styles.cardSubtitle}>{item.email}</Text>

            {!!item.nama_lokasi_absen_default && (
              <Text style={styles.cardMeta}>
                Lokasi Default: {item.nama_lokasi_absen_default}
              </Text>
            )}

            <View style={styles.badgeRow}>
              <View style={[styles.statusBadge, { backgroundColor: '#E0E7FF' }]}>
                <Text style={styles.statusBadgeText}>{item.role}</Text>
              </View>

              <View
                style={[
                  styles.statusBadge,
                  item.status_pegawai === 'AKTIF' ? styles.statusAktif : styles.statusNonaktif
                ]}
              >
                <Text style={styles.statusBadgeText}>{item.status_pegawai}</Text>
              </View>
            </View>
          </View>

          <Ionicons name="chevron-forward" size={18} color="#CCC" />
        </TouchableOpacity>
      </Swipeable>
    </CardAnimated>
  )

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

      <View style={styles.headerBackground}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Data Pegawai</Text>
          <Text style={styles.headerSubtitle}>{namaMitra}</Text>
        </View>
      </View>

      <View style={styles.contentContainer}>
        <View style={styles.content}>
          <View style={{ height: 48, marginBottom: 12 }}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {(['AKTIF', 'NONAKTIF'] as const).map((s) => (
                <TouchableOpacity
                  key={s}
                  onPress={() => setFilterStatus(s)}
                  style={[styles.pill, filterStatus === s && styles.pillActive]}
                >
                  <Text style={[styles.pillText, filterStatus === s && styles.pillTextActive]}>
                    {s}
                  </Text>
                </TouchableOpacity>
              ))}

              <View style={styles.pillDivider} />

              {(['KARYAWAN', 'HRD'] as const).map((r) => (
                <TouchableOpacity
                  key={r}
                  onPress={() => setFilterRole(r)}
                  style={[styles.pill, filterRole === r && styles.pillActiveRole]}
                >
                  <Text style={[styles.pillText, filterRole === r && styles.pillTextActive]}>
                    {r}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <TouchableOpacity style={styles.addButton} onPress={openTambahModal}>
            <Ionicons name="person-add-outline" size={18} color="#FFF" />
            <Text style={styles.addButtonText}>Tambah Pegawai</Text>
          </TouchableOpacity>

          {loading ? (
            <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 20 }} />
          ) : (
            <FlatList
              data={list}
              keyExtractor={(item) => String(item.id_pegawai)}
              renderItem={renderItem}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>

        <TouchableOpacity style={styles.floatingHome} onPress={() => router.replace('/hrd')}>
          <Text style={styles.homeIcon}>🏠</Text>
        </TouchableOpacity>
      </View>

      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>{form.id_pegawai ? 'Update' : 'Tambah'} Pegawai</Text>

              <TextInput
                placeholder="Nama Lengkap"
                style={styles.input}
                value={form.nama_pegawai}
                onChangeText={(t) => setForm({ ...form, nama_pegawai: t })}
              />

              <TextInput
                placeholder="Email (Username)"
                style={styles.input}
                autoCapitalize="none"
                keyboardType="email-address"
                value={form.email}
                onChangeText={(t) => setForm({ ...form, email: t })}
              />

              <Text style={styles.inputLabel}>Role Akses</Text>
              <View style={styles.statusSwitchWrap}>
                {(['KARYAWAN', 'HRD'] as const).map((r) => (
                  <TouchableOpacity
                    key={r}
                    onPress={() => setForm({ ...form, role: r })}
                    style={[styles.statusSwitchBtn, form.role === r && styles.statusSwitchActive]}
                  >
                    <Text style={[styles.statusSwitchText, form.role === r && styles.statusSwitchTextActive]}>
                      {r}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.inputLabel}>Status Akun</Text>
              <View style={styles.statusSwitchWrap}>
                {(['AKTIF', 'NONAKTIF'] as const).map((s) => (
                  <TouchableOpacity
                    key={s}
                    onPress={() => setForm({ ...form, status_pegawai: s })}
                    style={[
                      styles.statusSwitchBtn,
                      form.status_pegawai === s &&
                        (s === 'AKTIF' ? styles.statusSwitchActive : styles.statusSwitchNonaktifActive)
                    ]}
                  >
                    <Text style={[styles.statusSwitchText, form.status_pegawai === s && styles.statusSwitchTextActive]}>
                      {s}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.inputLabel}>Lokasi Absen Default</Text>
              <TouchableOpacity
                style={styles.selectBox}
                onPress={() => setLokasiModalVisible(true)}
                disabled={loadingLokasi}
                activeOpacity={0.8}
              >
                <Text style={[styles.selectBoxText, !selectedLokasiLabel && { color: '#9CA3AF' }]}>
                  {loadingLokasi ? 'Memuat lokasi...' : (selectedLokasiLabel || 'Pilih lokasi absen default')}
                </Text>
                <Ionicons name="chevron-down-outline" size={18} color="#6B7280" />
              </TouchableOpacity>

              <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={saving}>
                {saving ? <ActivityIndicator color="#FFF" /> : <Text style={styles.saveButtonText}>SIMPAN DATA</Text>}
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  setModalVisible(false)
                  setForm(emptyForm)
                }}
                style={styles.cancelButton}
              >
                <Text style={styles.cancelButtonText}>Batal</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>

      <Modal
        visible={lokasiModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setLokasiModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.optionModalCard}>
            <Text style={styles.modalTitle}>Pilih Lokasi Absen</Text>

            {loadingLokasi ? (
              <ActivityIndicator size="large" color={COLORS.primary} style={{ marginVertical: 24 }} />
            ) : lokasiList.length === 0 ? (
              <Text style={styles.emptyText}>Belum ada data lokasi absensi untuk mitra ini.</Text>
            ) : (
              <ScrollView style={{ maxHeight: 320 }} showsVerticalScrollIndicator={false}>
                {lokasiList.map((lokasi) => {
                  const active = String(form.id_lokasi_absen_default) === String(lokasi.id_lokasi)

                  return (
                    <TouchableOpacity
                      key={String(lokasi.id_lokasi)}
                      style={[styles.optionItem, active && styles.optionItemActive]}
                      onPress={() => {
                        setForm({
                          ...form,
                          id_lokasi_absen_default: String(lokasi.id_lokasi),
                          nama_lokasi_absen_default: lokasi.nama_lokasi,
                        })
                        setLokasiModalVisible(false)
                      }}
                    >
                      <Text style={[styles.optionText, active && styles.optionTextActive]}>
                        {lokasi.nama_lokasi}
                      </Text>
                      {active && <Ionicons name="checkmark-circle" size={20} color={COLORS.primary} />}
                    </TouchableOpacity>
                  )
                })}
              </ScrollView>
            )}

            <TouchableOpacity onPress={() => setLokasiModalVisible(false)} style={styles.cancelButton}>
              <Text style={styles.cancelButtonText}>Tutup</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.primary },
  headerBackground: { backgroundColor: COLORS.primary, paddingBottom: 28, borderBottomRightRadius: 44 },
  header: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 18 },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#FFF' },
  headerSubtitle: { marginTop: 4, fontSize: 14, color: '#E5E7EB' },

  contentContainer: {
    flex: 1,
    backgroundColor: '#f5f7fb',
    borderTopLeftRadius: 34,
    marginTop: -6,
    paddingTop: 8
  },
  content: { flex: 1, paddingHorizontal: 16, paddingTop: 8 },

  pill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#E5E7EB',
    marginRight: 8,
    height: 36,
    justifyContent: 'center'
  },
  pillActive: { backgroundColor: COLORS.primary },
  pillActiveRole: { backgroundColor: '#5856D6' },
  pillText: { fontWeight: '700', fontSize: 12, color: '#4B5563' },
  pillTextActive: { color: '#FFF' },
  pillDivider: { width: 1, height: 20, backgroundColor: '#CCC', alignSelf: 'center', marginRight: 12 },

  addButton: {
    backgroundColor: COLORS.accentOrange,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-end'
  },
  addButtonText: { color: '#FFF', fontWeight: '800', fontSize: 13 },

  listContent: { paddingBottom: 100 },

  card: {
    backgroundColor: '#FFF',
    borderRadius: 22,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 3
  },
  cardIconWrap: {
    width: 50,
    height: 50,
    borderRadius: 15,
    backgroundColor: '#EAF3FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14
  },
  avatarText: { fontSize: 20, fontWeight: '800', color: COLORS.primary },
  cardContent: { flex: 1 },
  cardTitle: { fontSize: 16, fontWeight: '800', color: '#111827' },
  cardSubtitle: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  cardMeta: { fontSize: 12, color: '#4B5563', marginTop: 6, fontWeight: '600' },

  badgeRow: { flexDirection: 'row', gap: 6, marginTop: 8 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  statusAktif: { backgroundColor: '#DCFCE7' },
  statusNonaktif: { backgroundColor: '#FEE2E2' },
  statusBadgeText: { fontSize: 10, fontWeight: '800', color: '#111827' },

  floatingHome: {
    position: 'absolute',
    bottom: 24,
    left: 16,
    backgroundColor: 'rgba(37, 99, 235, 0.85)',
    padding: 14,
    borderRadius: 50,
    elevation: 5
  },
  homeIcon: { fontSize: 18, color: '#fff' },

  deleteSwipeAction: {
    width: 80,
    marginBottom: 12,
    borderRadius: 22,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center'
  },
  deleteSwipeText: { color: '#FFF', marginTop: 4, fontWeight: '700', fontSize: 10 },

  modalOverlay: {
    flex: 1,
    backgroundColor: '#00000066',
    justifyContent: 'center',
    padding: 20
  },
  modalCard: {
    backgroundColor: '#FFF',
    borderRadius: 22,
    padding: 20
  },
  optionModalCard: {
    backgroundColor: '#FFF',
    borderRadius: 22,
    padding: 20
  },

  modalTitle: { fontSize: 18, fontWeight: '800', marginBottom: 10 },

  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b',
    marginTop: 15,
    marginLeft: 4
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    padding: 12,
    fontSize: 14,
    marginTop: 10
  },

  selectBox: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
    backgroundColor: '#FFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  selectBoxText: {
    fontSize: 14,
    color: '#111827',
    flex: 1,
    paddingRight: 12
  },

  statusSwitchWrap: { flexDirection: 'row', gap: 10, marginTop: 8 },
  statusSwitchBtn: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#E5E7EB',
    alignItems: 'center'
  },
  statusSwitchActive: { backgroundColor: COLORS.primary },
  statusSwitchNonaktifActive: { backgroundColor: '#EF4444' },
  statusSwitchText: { fontWeight: '700', fontSize: 12, color: '#111827' },
  statusSwitchTextActive: { color: '#FFF' },

  optionItem: {
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  optionItemActive: {
    borderColor: COLORS.primary,
    backgroundColor: '#EFF6FF'
  },
  optionText: {
    fontSize: 14,
    color: '#111827',
    flex: 1,
    paddingRight: 12
  },
  optionTextActive: {
    color: COLORS.primary,
    fontWeight: '700'
  },

  emptyText: {
    textAlign: 'center',
    color: '#6B7280',
    marginVertical: 20
  },

  saveButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    padding: 15,
    alignItems: 'center',
    marginTop: 25
  },
  saveButtonText: { color: '#FFF', fontWeight: '800' },

  cancelButton: { marginTop: 15, alignItems: 'center' },
  cancelButtonText: { color: '#6B7280', fontWeight: '700' }
})