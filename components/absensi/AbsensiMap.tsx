import React, { useMemo } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { WebView } from 'react-native-webview'

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
  const centerLat = currentLocation?.latitude ?? selectedLokasi?.latitude ?? null
  const centerLng = currentLocation?.longitude ?? selectedLokasi?.longitude ?? null

  const htmlContent = useMemo(() => {
    if (centerLat === null || centerLng === null) return null

    const userMarker = currentLocation
      ? `
        var userIcon = L.divIcon({
          html: '<div style="width:14px;height:14px;background:#2563eb;border:3px solid #fff;border-radius:50%;box-shadow:0 0 6px rgba(37,99,235,0.5);"></div>',
          className: '',
          iconSize: [14, 14],
          iconAnchor: [7, 7]
        });
        L.marker([${currentLocation.latitude}, ${currentLocation.longitude}], { icon: userIcon })
          .addTo(map)
          .bindPopup('<b>Posisi Anda</b><br>Lokasi GPS saat ini');
      `
      : ''

    const lokasiMarker = selectedLokasi
      ? `
        var lokasiIcon = L.divIcon({
          html: '<div style="width:12px;height:12px;background:#dc2626;border:3px solid #fff;border-radius:50%;box-shadow:0 0 6px rgba(220,38,38,0.5);"></div>',
          className: '',
          iconSize: [12, 12],
          iconAnchor: [6, 6]
        });
        L.marker([${selectedLokasi.latitude}, ${selectedLokasi.longitude}], { icon: lokasiIcon })
          .addTo(map)
          .bindPopup('<b>' + ${JSON.stringify(selectedLokasi.nama_lokasi)} + '</b><br>Radius ' + ${selectedLokasi.radius_meter} + ' meter');

        L.circle([${selectedLokasi.latitude}, ${selectedLokasi.longitude}], {
          radius: ${selectedLokasi.radius_meter},
          color: '#2563eb',
          fillColor: '#2563eb',
          fillOpacity: 0.12,
          weight: 2
        }).addTo(map);
      `
      : ''

    // Fit bounds if both markers exist
    const fitBounds =
      currentLocation && selectedLokasi
        ? `
        var bounds = L.latLngBounds([
          [${currentLocation.latitude}, ${currentLocation.longitude}],
          [${selectedLokasi.latitude}, ${selectedLokasi.longitude}]
        ]);
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 16 });
      `
        : ''

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        <style>
          * { margin: 0; padding: 0; }
          html, body, #map { width: 100%; height: 100%; }
        </style>
      </head>
      <body>
        <div id="map"></div>
        <script>
          try {
            var map = L.map('map', {
              center: [${centerLat}, ${centerLng}],
              zoom: 16,
              zoomControl: false,
              attributionControl: false
            });

            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
              maxZoom: 19
            }).addTo(map);

            ${userMarker}
            ${lokasiMarker}
            ${fitBounds}
          } catch (e) {
            console.error('Map init error:', e);
          }
        </script>
      </body>
      </html>
    `
  }, [centerLat, centerLng, currentLocation, selectedLokasi])

  if (!htmlContent) {
    return (
      <View style={[styles.emptyContainer, { height }]}>
        <Text style={styles.emptyText}>Lokasi belum tersedia</Text>
      </View>
    )
  }

  return (
    <View style={[styles.container, { height }]}>
      <WebView
        source={{ html: htmlContent }}
        style={styles.map}
        scrollEnabled={false}
        nestedScrollEnabled={false}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        originWhitelist={['*']}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    borderRadius: 14,
    overflow: 'hidden',
  },
  map: {
    flex: 1,
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