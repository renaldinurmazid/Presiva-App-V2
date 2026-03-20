import React, { useEffect, useState } from 'react'
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  TextInput, Alert, StatusBar, ActivityIndicator
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { Picker } from '@react-native-picker/picker'
import DateTimePickerModal from "react-native-modal-datetime-picker"

import { COLORS } from '@/constants/colors'
import { useAuthStore } from '@/store/auth.store'
import { api } from '@/services/api'

const DAFTAR_HARI = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Ahad']

export default function MitraScreen() {
  const router = useRouter()
  const user = useAuthStore((state) => state.user)
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    nama_mitra: '',
    no_telp_mitra: '',
    alamat_mitra: '',
    jenis_periode: 'BULANAN',
    jam_masuk: '08:00',
    jam_keluar: '16:00',
    tanggal_awal_periode: '',
    tanggal_akhir_periode: '',
    hari_awal: 'Sabtu',
    hari_akhir: 'Jumat',
  })

  // Time Picker State
  const [isTimePickerVisible, setTimePickerVisibility] = useState(false)
  const [pickingTarget, setPickingTarget] = useState<'jam_masuk' | 'jam_keluar'>('jam_masuk')

	const loadData = async () => {
	  try {
		setLoading(true)
		const res = await api.get('/hrd/mitra/detail.php')
		if (res.data.success) {
		  // Pastikan format jam hanya HH:mm untuk Picker
		  const data = res.data.data;
		  if (data.jam_masuk) data.jam_masuk = data.jam_masuk.substring(0,5);
		  if (data.jam_keluar) data.jam_keluar = data.jam_keluar.substring(0,5);
		  
		  setForm(data)
		}
	  } catch (error) {
		Alert.alert('Error', 'Gagal memuat profil')
	  } finally { setLoading(false) }
	}

  useEffect(() => { loadData() }, [])

  const handleSave = async () => {
    try {
      setSaving(true)
      await api.post('/hrd/mitra/update.php', form)
      Alert.alert('Sukses', 'Profil mitra berhasil diperbarui')
    } catch (error) {
      Alert.alert('Error', 'Gagal menyimpan data')
    } finally { setSaving(false) }
  }

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={COLORS.primary} /></View>

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      <View style={styles.headerBackground}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profil Mitra</Text>
          <Text style={styles.headerSubtitle}>Pengaturan Dasar Instansi</Text>
        </View>
      </View>

      <View style={styles.contentContainer}>
        <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 100 }}>
          <Text style={styles.sectionTitle}>Informasi Umum</Text>
          <TextInput placeholder="Nama Mitra" style={styles.input} value={form.nama_mitra} onChangeText={t => setForm({...form, nama_mitra: t})} />
          <TextInput placeholder="No. Telepon" style={styles.input} keyboardType="phone-pad" value={form.no_telp_mitra} onChangeText={t => setForm({...form, no_telp_mitra: t})} />
          <TextInput placeholder="Alamat" style={[styles.input, {height: 80}]} multiline value={form.alamat_mitra} onChangeText={t => setForm({...form, alamat_mitra: t})} />

          <Text style={styles.sectionTitle}>Default Jam Kerja</Text>
          <View style={styles.row}>
            <TouchableOpacity style={styles.timeBtn} onPress={() => { setPickingTarget('jam_masuk'); setTimePickerVisibility(true); }}>
              <Text style={styles.timeLabel}>Jam Masuk</Text>
              <Text style={styles.timeValue}>{form.jam_masuk?.substring(0,5)}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.timeBtn} onPress={() => { setPickingTarget('jam_keluar'); setTimePickerVisibility(true); }}>
              <Text style={styles.timeLabel}>Jam Keluar</Text>
              <Text style={styles.timeValue}>{form.jam_keluar?.substring(0,5)}</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.sectionTitle}>Siklus Periode</Text>
          <View style={styles.switchRow}>
            {['BULANAN', 'PEKANAN'].map(type => (
              <TouchableOpacity key={type} onPress={() => setForm({...form, jenis_periode: type as any})} style={[styles.switchBtn, form.jenis_periode === type && styles.switchBtnActive]}>
                <Text style={[styles.switchText, form.jenis_periode === type && styles.switchTextActive]}>{type}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* KONDISIONAL INPUT BERDASARKAN JENIS PERIODE */}
          {form.jenis_periode === 'BULANAN' ? (
            <View style={styles.cardBox}>
              <Text style={styles.boxLabel}>Cut-off Tanggal (Bulanan)</Text>
              <View style={styles.row}>
                <TextInput placeholder="Tgl Awal (Misal: 26)" style={[styles.input, {flex:1}]} keyboardType="numeric" value={form.tanggal_awal_periode} onChangeText={t => setForm({...form, tanggal_awal_periode: t})} />
                <TextInput placeholder="Tgl Akhir (Misal: 25)" style={[styles.input, {flex:1}]} keyboardType="numeric" value={form.tanggal_akhir_periode} onChangeText={t => setForm({...form, tanggal_akhir_periode: t})} />
              </View>
            </View>
          ) : (
            <View style={styles.cardBox}>
              <Text style={styles.boxLabel}>Rentang Hari (Pekanan)</Text>
              <View style={styles.pickerRow}>
                <Picker style={{flex:1}} selectedValue={form.hari_awal} onValueChange={v => setForm({...form, hari_awal: v})}>
                  {DAFTAR_HARI.map(h => <Picker.Item key={h} label={h} value={h} />)}
                </Picker>
                <Ionicons name="arrow-forward" size={20} color="#CCC" />
                <Picker style={{flex:1}} selectedValue={form.hari_akhir} onValueChange={v => setForm({...form, hari_akhir: v})}>
                  {DAFTAR_HARI.map(h => <Picker.Item key={h} label={h} value={h} />)}
                </Picker>
              </View>
            </View>
          )}

          <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
            {saving ? <ActivityIndicator color="#FFF" /> : <Text style={styles.saveBtnText}>SIMPAN PERUBAHAN</Text>}
          </TouchableOpacity>
        </ScrollView>

        <TouchableOpacity style={styles.floatingHome} onPress={() => router.replace('/hrd')}>
          <Text style={styles.homeIcon}>🏠</Text>
        </TouchableOpacity>
      </View>

      <DateTimePickerModal 
        isVisible={isTimePickerVisible} mode="time" is24Hour={true} 
        onConfirm={(date) => {
          setForm({...form, [pickingTarget]: date.getHours().toString().padStart(2,'0') + ":" + date.getMinutes().toString().padStart(2,'0')});
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
  headerSubtitle: { fontSize: 14, color: '#E5E7EB', marginTop: 4 },
  contentContainer: { flex: 1, backgroundColor: '#f5f7fb', borderTopLeftRadius: 34, marginTop: -6 },
  content: { padding: 20 },
  sectionTitle: { fontSize: 14, fontWeight: '800', color: '#4B5563', marginTop: 20, marginBottom: 10, textTransform: 'uppercase' },
  input: { backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 14, padding: 14, marginBottom: 12, fontSize: 15 },
  row: { flexDirection: 'row', gap: 12 },
  timeBtn: { flex: 1, backgroundColor: '#FFF', padding: 14, borderRadius: 14, borderWidth: 1, borderColor: '#E5E7EB', alignItems: 'center' },
  timeLabel: { fontSize: 11, color: '#6B7280', fontWeight: 'bold' },
  timeValue: { fontSize: 18, fontWeight: '800', color: COLORS.primary, marginTop: 4 },
  switchRow: { flexDirection: 'row', gap: 10, marginBottom: 15 },
  switchBtn: { flex: 1, padding: 14, backgroundColor: '#E5E7EB', borderRadius: 14, alignItems: 'center' },
  switchBtnActive: { backgroundColor: COLORS.primary },
  switchText: { fontWeight: '800', fontSize: 13, color: '#4B5563' },
  switchTextActive: { color: '#FFF' },
  cardBox: { backgroundColor: '#FFF', padding: 15, borderRadius: 18, borderLeftWidth: 5, borderLeftColor: COLORS.accentOrange, elevation: 2 },
  boxLabel: { fontSize: 13, fontWeight: 'bold', color: '#1F2937', marginBottom: 10 },
  pickerRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9FAFB', borderRadius: 12 },
  saveBtn: { backgroundColor: COLORS.primary, padding: 18, borderRadius: 15, alignItems: 'center', marginTop: 30, elevation: 4 },
  saveBtnText: { color: '#FFF', fontWeight: '800', fontSize: 16 },
  floatingHome: { position: 'absolute', bottom: 24, left: 16, backgroundColor: 'rgba(37, 99, 235, 0.85)', padding: 14, borderRadius: 50, elevation: 5 },
  homeIcon: { fontSize: 18 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' }
})