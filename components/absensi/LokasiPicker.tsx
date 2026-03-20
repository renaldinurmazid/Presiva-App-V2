import React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { Picker } from '@react-native-picker/picker'

export type LokasiAbsensiItem = {
  id_lokasi: string
  id_mitra: string
  nama_lokasi: string
  alamat?: string
  latitude: number
  longitude: number
  radius_meter: number
}

type LokasiPickerProps = {
  lokasiList?: LokasiAbsensiItem[]
  selectedLokasi: LokasiAbsensiItem | null
  onSelect: (lokasi: LokasiAbsensiItem | null) => void
  disabled?: boolean
}

export default function LokasiPicker({
  lokasiList = [],
  selectedLokasi,
  onSelect,
  disabled = false,
}: LokasiPickerProps) {
  const safeLokasiList = Array.isArray(lokasiList) ? lokasiList : []

  function handleChange(value: string) {
    if (!value) {
      onSelect(null)
      return
    }

    const found = safeLokasiList.find((item) => String(item.id_lokasi) === String(value))
    onSelect(found || null)
  }

  if (safeLokasiList.length === 0) {
    return (
      <View style={styles.infoBox}>
        <Text style={styles.emptyText}>Lokasi kantor tidak ditemukan.</Text>
        <Text style={styles.helperText}>
          Pastikan data tersedia di tabel data_lokasi_absensi sesuai id_mitra user login dan
          status_lokasi = AKTIF.
        </Text>
      </View>
    )
  }

  if (safeLokasiList.length === 1 && selectedLokasi) {
    return (
      <View style={styles.infoBox}>
        <Text style={styles.singleTitle}>{selectedLokasi.nama_lokasi}</Text>
        <Text style={styles.infoText}>Alamat: {selectedLokasi.alamat || '-'}</Text>
        <Text style={styles.infoText}>Radius: {selectedLokasi.radius_meter} meter</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <View style={[styles.pickerWrapper, disabled && styles.disabled]}>
        <Picker
          selectedValue={selectedLokasi?.id_lokasi || ''}
          onValueChange={handleChange}
          enabled={!disabled}
        >
          <Picker.Item label="-- Pilih Lokasi Kantor --" value="" />
          {safeLokasiList.map((item) => (
            <Picker.Item
              key={item.id_lokasi}
              label={item.nama_lokasi}
              value={item.id_lokasi}
            />
          ))}
        </Picker>
      </View>

      {selectedLokasi ? (
        <View style={styles.infoBox}>
          <Text style={styles.singleTitle}>{selectedLokasi.nama_lokasi}</Text>
          <Text style={styles.infoText}>Alamat: {selectedLokasi.alamat || '-'}</Text>
          <Text style={styles.infoText}>Radius: {selectedLokasi.radius_meter} meter</Text>
        </View>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 12,
    backgroundColor: '#fff',
    overflow: 'hidden',
  },
  disabled: {
    opacity: 0.6,
  },
  infoBox: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 12,
    marginTop: 10,
  },
  singleTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 6,
  },
  infoText: {
    color: '#475569',
    marginBottom: 4,
  },
  emptyText: {
    color: '#dc2626',
    fontWeight: '700',
    marginBottom: 6,
  },
  helperText: {
    color: '#64748b',
    lineHeight: 20,
  },
})