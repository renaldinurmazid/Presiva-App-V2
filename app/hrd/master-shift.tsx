import React, { useEffect, useMemo, useRef, useState } from 'react'
import {
  View, Text, StyleSheet, TouchableOpacity, FlatList, Modal,
  TextInput, Alert, StatusBar, ActivityIndicator, Animated
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { Swipeable } from 'react-native-gesture-handler'
import DateTimePickerModal from "react-native-modal-datetime-picker"

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

export default function MasterShiftScreen() {
  const router = useRouter()
  const user = useAuthStore((state) => state.user)
  const namaMitra = (user as any)?.nama_mitra || '-'

  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalVisible, setModalVisible] = useState(false)
  const [saving, setSaving] = useState(false)
  
  // Time Picker State
  const [isTimePickerVisible, setTimePickerVisibility] = useState(false)
  const [pickingTarget, setPickingTarget] = useState<'jam_masuk' | 'jam_keluar'>('jam_masuk')

  const [form, setForm] = useState({
    id_shift: '',
    kode_shift: '',
    nama_shift: '',
    jam_masuk: '08:00',
    jam_keluar: '17:00',
    is_lintas_hari: 'TIDAK' as 'YA' | 'TIDAK',
    remark: ''
  })

  const loadData = async () => {
    try {
      setLoading(true)
      const res = await api.get('/hrd/shift/list.php')
      setList(res.data.data || [])
    } catch (error) {
      Alert.alert('Error', 'Gagal mengambil data shift')
    } finally { setLoading(false) }
  }

  useEffect(() => { loadData() }, [])

  const handleSave = async () => {
    if (!form.kode_shift || !form.nama_shift) return Alert.alert('Validasi', 'Kode dan Nama wajib diisi')
    try {
      setSaving(true)
      const endpoint = form.id_shift ? '/hrd/shift/update.php' : '/hrd/shift/create.php'
      await api.post(endpoint, form)
      setModalVisible(false)
      loadData()
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Gagal menyimpan data')
    } finally { setSaving(false) }
  }

  const handleDelete = (id: any) => {
    Alert.alert('Hapus', 'Yakin hapus shift ini?', [
      { text: 'Batal' },
      { text: 'Hapus', style: 'destructive', onPress: async () => {
          await api.post('/hrd/shift/delete.php', { id_shift: id })
          loadData()
      }}
    ])
  }

  const showPicker = (target: 'jam_masuk' | 'jam_keluar') => {
    setPickingTarget(target)
    setTimePickerVisibility(true)
  }

  const renderItem = ({ item, index }: any) => (
    <CardAnimated index={index}>
      <Swipeable renderRightActions={() => (
        <TouchableOpacity style={styles.deleteSwipeAction} onPress={() => handleDelete(item.id_shift)}>
          <Ionicons name="trash-outline" size={22} color="#FFF" />
          <Text style={styles.deleteSwipeText}>Hapus</Text>
        </TouchableOpacity>
      )}>
        <TouchableOpacity style={styles.card} activeOpacity={0.9} onPress={() => { setForm(item); setModalVisible(true); }}>
          <View style={styles.cardIconWrap}>
            <Ionicons name="time-outline" size={26} color={COLORS.primary} />
          </View>
          <View style={styles.cardContent}>
            <View style={{flexDirection:'row', justifyContent:'space-between'}}>
                <Text style={styles.cardTitle}>{item.nama_shift}</Text>
                <Text style={{fontWeight:'700', color: COLORS.primary}}>{item.kode_shift}</Text>
            </View>
            <Text style={styles.cardSubtitle}>{item.jam_masuk.substring(0,5)} - {item.jam_keluar.substring(0,5)}</Text>
            {item.is_lintas_hari === 'YA' && (
               <View style={[styles.statusBadge, {backgroundColor:'#FEF3C7'}]}>
                 <Text style={styles.statusBadgeText}>🌙 Lintas Hari</Text>
               </View>
            )}
          </View>
        </TouchableOpacity>
      </Swipeable>
    </CardAnimated>
  )

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      <View style={styles.headerBackground}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Master Shift</Text>
          <Text style={styles.headerSubtitle}>{namaMitra}</Text>
        </View>
      </View>

      <View style={styles.contentContainer}>
        <View style={styles.content}>
          <TouchableOpacity style={[styles.addButton, {marginBottom: 15}]} onPress={() => { setForm({id_shift:'', kode_shift:'', nama_shift:'', jam_masuk:'08:00', jam_keluar:'17:00', is_lintas_hari:'TIDAK', remark:''}); setModalVisible(true); }}>
            <Ionicons name="add" size={18} color="#FFF" />
            <Text style={styles.addButtonText}>Tambah Shift</Text>
          </TouchableOpacity>

          {loading ? <ActivityIndicator size="large" color={COLORS.primary} style={{marginTop: 20}} /> : (
            <FlatList data={list} keyExtractor={(item) => String(item.id_shift)} renderItem={renderItem} contentContainerStyle={styles.listContent} />
          )}
        </View>

        <TouchableOpacity style={styles.floatingHome} onPress={() => router.replace('/hrd')}>
          <Text style={styles.homeIcon}>🏠</Text>
        </TouchableOpacity>
      </View>

      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{form.id_shift ? 'Update' : 'Tambah'} Shift</Text>
            
            <TextInput placeholder="Kode Shift (Contoh: S1)" style={[styles.input, !!form.id_shift && {backgroundColor: '#f0f0f0'}]} editable={!form.id_shift} value={form.kode_shift} onChangeText={t => setForm({...form, kode_shift: t})} />
            <TextInput placeholder="Nama Shift (Contoh: Pagi)" style={styles.input} value={form.nama_shift} onChangeText={t => setForm({...form, nama_shift: t})} />
            
            <View style={{flexDirection:'row', gap: 10, marginTop: 10}}>
                <TouchableOpacity style={styles.timePickerBtn} onPress={() => showPicker('jam_masuk')}>
                    <Text style={styles.timeLabel}>Jam Masuk</Text>
                    <Text style={styles.timeValue}>{form.jam_masuk.substring(0,5)}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.timePickerBtn} onPress={() => showPicker('jam_keluar')}>
                    <Text style={styles.timeLabel}>Jam Keluar</Text>
                    <Text style={styles.timeValue}>{form.jam_keluar.substring(0,5)}</Text>
                </TouchableOpacity>
            </View>

            <Text style={{fontWeight:'700', marginTop: 15, marginBottom: 5}}>Lintas Hari?</Text>
            <View style={styles.statusSwitchWrap}>
              {['TIDAK','YA'].map(opt => (
                <TouchableOpacity key={opt} onPress={() => setForm({...form, is_lintas_hari: opt as any})} style={[styles.statusSwitchBtn, form.is_lintas_hari === opt && styles.statusSwitchActive]}>
                  <Text style={[styles.statusSwitchText, form.is_lintas_hari === opt && styles.statusSwitchTextActive]}>{opt}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={saving}>
              {saving ? <ActivityIndicator color="#FFF" /> : <Text style={styles.saveButtonText}>SIMPAN SHIFT</Text>}
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.cancelButton}><Text style={styles.cancelButtonText}>Batal</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>

      <DateTimePickerModal 
        isVisible={isTimePickerVisible} 
        mode="time" 
        is24Hour={true} 
        onConfirm={(date) => {
            const time = date.getHours().toString().padStart(2,'0') + ":" + date.getMinutes().toString().padStart(2,'0');
            setForm({...form, [pickingTarget]: time});
            setTimePickerVisibility(false);
        }} 
        onCancel={() => setTimePickerVisibility(false)} 
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.primary },
  headerBackground: { backgroundColor: COLORS.primary, paddingBottom: 28, borderBottomRightRadius: 44 },
  header: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 18 },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#FFF' },
  headerSubtitle: { marginTop: 4, fontSize: 14, color: '#E5E7EB' },
  contentContainer: { flex: 1, backgroundColor: '#f5f7fb', borderTopLeftRadius: 34, marginTop: -6, paddingTop: 8 },
  content: { flex: 1, paddingHorizontal: 16, paddingTop: 8 },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, gap: 12 },
  addButton: { backgroundColor: COLORS.accentOrange, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf:'flex-end' },
  addButtonText: { color: '#FFF', fontWeight: '800', fontSize: 13 },
  listContent: { paddingBottom: 100 },
  card: { backgroundColor: '#FFF', borderRadius: 22, padding: 16, marginBottom: 12, flexDirection: 'row', alignItems: 'center', elevation: 3 },
  cardIconWrap: { width: 54, height: 54, borderRadius: 16, backgroundColor: '#EAF3FF', alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  cardContent: { flex: 1 },
  cardTitle: { fontSize: 16, fontWeight: '800', color: '#111827' },
  cardSubtitle: { marginTop: 2, fontSize: 13, color: '#6B7280' },
  statusBadge: { marginTop: 6, alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  statusBadgeText: { fontSize: 10, fontWeight: '800', color: '#111827' },
  floatingHome: { position: 'absolute', bottom: 24, left: 16, backgroundColor: 'rgba(37, 99, 235, 0.85)', padding: 14, borderRadius: 50, elevation: 5 },
  homeIcon: { fontSize: 18, color: '#fff' },
  deleteSwipeAction: { width: 80, marginBottom: 12, borderRadius: 22, backgroundColor: '#EF4444', alignItems: 'center', justifyContent: 'center' },
  deleteSwipeText: { color: '#FFF', marginTop: 4, fontWeight: '700', fontSize: 10 },
  modalOverlay: { flex: 1, backgroundColor: '#00000066', justifyContent: 'center', padding: 20 },
  modalCard: { backgroundColor: '#FFF', borderRadius: 22, padding: 20 },
  modalTitle: { fontSize: 18, fontWeight: '800', marginBottom: 15 },
  input: { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 14, padding: 12, fontSize: 14, marginTop: 10 },
  timePickerBtn: { flex: 1, padding: 12, backgroundColor: '#f8fafc', borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0' },
  timeLabel: { fontSize: 11, color: '#64748b', fontWeight: 'bold' },
  timeValue: { fontSize: 16, fontWeight: '800', color: COLORS.primary, marginTop: 2 },
  statusSwitchWrap: { flexDirection: 'row', gap: 10, marginTop: 10 },
  statusSwitchBtn: { flex: 1, padding: 12, borderRadius: 12, backgroundColor: '#E5E7EB', alignItems: 'center' },
  statusSwitchActive: { backgroundColor: COLORS.primary },
  statusSwitchText: { fontWeight: '700', fontSize: 12 },
  statusSwitchTextActive: { color: '#FFF' },
  saveButton: { backgroundColor: COLORS.primary, borderRadius: 14, padding: 15, alignItems: 'center', marginTop: 20 },
  saveButtonText: { color: '#FFF', fontWeight: '800' },
  cancelButton: { marginTop: 15, alignItems: 'center' },
  cancelButtonText: { color: '#6B7280', fontWeight: '700' }
})