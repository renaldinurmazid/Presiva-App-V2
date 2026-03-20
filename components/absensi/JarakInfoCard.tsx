import React from 'react'
import { StyleSheet, Text, View } from 'react-native'

type Coordinate = {
  latitude: number
  longitude: number
}

type LokasiAbsensi = {
  id_lokasi_absensi?: string
  id_lokasi?: string | number
  nama_lokasi: string
  latitude: number
  longitude: number
  radius_meter: number
  alamat?: string
}

type JarakInfoCardProps = {
  currentLocation: Coordinate | null
  selectedLokasi: LokasiAbsensi | null
  distanceMeter: number | null
  isWithinRadius: boolean
}

function formatCoordinate(value?: number | null) {
  if (typeof value !== 'number') return '-'
  return value.toFixed(6)
}

function formatDistance(value?: number | null) {
  if (typeof value !== 'number') return '-'
  return `${Math.round(value)} meter`
}

export default function JarakInfoCard({
  currentLocation,
  selectedLokasi,
  distanceMeter,
  isWithinRadius,
}: JarakInfoCardProps) {
  const hasLokasi = Boolean(selectedLokasi)
  const hasCurrentLocation = Boolean(currentLocation)
  const canShowStatus = hasLokasi && hasCurrentLocation && typeof distanceMeter === 'number'

  const statusText = !hasLokasi
    ? 'Pilih lokasi absensi terlebih dahulu'
    : !hasCurrentLocation
    ? 'Lokasi GPS belum tersedia'
    : isWithinRadius
    ? 'Dalam jangkauan lokasi absensi'
    : 'Di luar jangkauan lokasi absensi'

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Status Lokasi</Text>

      <View style={styles.row}>
        <Text style={styles.label}>Latitude</Text>
        <Text style={styles.value}>
          {formatCoordinate(currentLocation?.latitude)}
        </Text>
      </View>

      <View style={styles.row}>
        <Text style={styles.label}>Longitude</Text>
        <Text style={styles.value}>
          {formatCoordinate(currentLocation?.longitude)}
        </Text>
      </View>

      <View style={styles.row}>
        <Text style={styles.label}>Lokasi Dipilih</Text>
        <Text style={styles.value}>
          {selectedLokasi?.nama_lokasi || '-'}
        </Text>
      </View>

      <View style={styles.row}>
        <Text style={styles.label}>Jarak ke Lokasi</Text>
        <Text style={styles.value}>{formatDistance(distanceMeter)}</Text>
      </View>

      <View style={styles.row}>
        <Text style={styles.label}>Radius Lokasi</Text>
        <Text style={styles.value}>
          {selectedLokasi ? `${selectedLokasi.radius_meter} meter` : '-'}
        </Text>
      </View>

      <View style={styles.rowTop}>
        <Text style={styles.label}>Status</Text>
        <Text
          style={[
            styles.statusText,
            canShowStatus
              ? isWithinRadius
                ? styles.statusOk
                : styles.statusBad
              : styles.statusNeutral,
          ]}
        >
          {statusText}
        </Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  rowTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 16,
    paddingTop: 10,
  },
  label: {
    flex: 1,
    color: '#64748b',
    fontSize: 14,
  },
  value: {
    flex: 1,
    textAlign: 'right',
    color: '#0f172a',
    fontSize: 14,
    fontWeight: '600',
  },
  statusText: {
    flex: 1,
    textAlign: 'right',
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
  },
  statusOk: {
    color: '#16a34a',
  },
  statusBad: {
    color: '#dc2626',
  },
  statusNeutral: {
    color: '#64748b',
  },
})