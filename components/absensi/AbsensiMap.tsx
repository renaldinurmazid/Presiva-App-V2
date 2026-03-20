import React, { useMemo } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import MapView, { Circle, Marker, Region } from 'react-native-maps'

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
}

type AbsensiMapProps = {
  currentLocation: Coordinate | null
  selectedLokasi: LokasiAbsensi | null
  height?: number
}

export default function AbsensiMap({
  currentLocation,
  selectedLokasi,
  height = 260,
}: AbsensiMapProps) {
  const region = useMemo<Region | null>(() => {
    if (currentLocation) {
      return {
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }
    }

    if (selectedLokasi) {
      return {
        latitude: selectedLokasi.latitude,
        longitude: selectedLokasi.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }
    }

    return null
  }, [currentLocation, selectedLokasi])

  if (!region) {
    return (
      <View style={[styles.emptyContainer, { height }]}>
        <Text style={styles.emptyText}>Lokasi belum tersedia</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <MapView style={[styles.map, { height }]} initialRegion={region}>
        {currentLocation && (
          <Marker
            coordinate={currentLocation}
            title="Posisi Anda"
            description="Lokasi GPS saat ini"
          />
        )}

        {selectedLokasi && (
          <>
            <Marker
              coordinate={{
                latitude: selectedLokasi.latitude,
                longitude: selectedLokasi.longitude,
              }}
              title={selectedLokasi.nama_lokasi}
              description={`Radius ${selectedLokasi.radius_meter} meter`}
            />

            <Circle
              center={{
                latitude: selectedLokasi.latitude,
                longitude: selectedLokasi.longitude,
              }}
              radius={selectedLokasi.radius_meter}
              strokeWidth={2}
            />
          </>
        )}
      </MapView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  map: {
    width: '100%',
    borderRadius: 14,
  },
  emptyContainer: {
    width: '100%',
    borderRadius: 14,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: '#64748b',
    fontSize: 14,
  },
})