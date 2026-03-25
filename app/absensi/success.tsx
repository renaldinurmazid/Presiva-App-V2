import { useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  StatusBar,
} from 'react-native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { COLORS } from '@/constants/colors'
import { useAuthStore } from '@/store/auth.store'

import DashboardHeader from '@/components/home/DashboardHeader'
import ProfileSummaryCard from '@/components/home/ProfileSummaryCard'

export default function AbsensiSuccessScreen() {
  const router = useRouter()
  const params = useLocalSearchParams()
  const user = useAuthStore((state) => state.user)
  const insets = useSafeAreaInsets()

  const foto = params.foto as string
  const namaLokasi = params.nama_lokasi as string
  const alamat = params.alamat as string
  const waktu = params.waktu as string
  const distance = params.distance as string

  const formattedTime = waktu
    ? new Date(waktu).toLocaleString('id-ID', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '-'

  // Optional auto redirect
  // useEffect(() => {
  //   const t = setTimeout(() => {
  //     router.replace('/(tabs)')
  //   }, 3000)
  //   return () => clearTimeout(t)
  // }, [])

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} translucent />
      {/* HEADER (SAMA DENGAN HOME) */}
      <View style={[styles.headerBackground, { paddingTop: insets.top }]}>
        <DashboardHeader />

        <ProfileSummaryCard
          namaPegawai={user?.nama_pegawai || '-'}
          namaMitra={user?.nama_mitra || '-'}
          noTelp={user?.no_telp || '-'}
          foto={user?.foto || null}
        />

        <TouchableOpacity
          style={styles.backButtonFloating}
          onPress={() => router.replace('/(tabs)')}
        >
          <Text style={styles.backButtonText}>← Home</Text>
        </TouchableOpacity>
      </View>

      {/* CONTENT */}
      <View style={styles.contentContainer}>
        <View style={styles.container}>

          {/* TITLE */}
          <Text style={styles.title}>Absensi Berhasil</Text>
          <Text style={styles.subtitle}>
            Data absensi Anda telah tersimpan
          </Text>

          {/* CARD */}
          <View style={styles.card}>
            {foto ? (
              <Image source={{ uri: foto }} style={styles.image} />
            ) : null}

            <View style={styles.infoGroup}>
              <Text style={styles.label}>Lokasi</Text>
              <Text style={styles.value}>{namaLokasi || '-'}</Text>
              {alamat ? (
                <Text style={styles.address}>{alamat}</Text>
              ) : null}
            </View>

            <View style={styles.infoGroup}>
              <Text style={styles.label}>Waktu</Text>
              <Text style={styles.value}>{formattedTime}</Text>
            </View>

            <View style={styles.infoGroup}>
              <Text style={styles.label}>Jarak</Text>
              <Text style={styles.value}>{distance} meter</Text>
            </View>
          </View>

          {/* BUTTON */}
          <TouchableOpacity
            style={styles.button}
            onPress={() => router.replace('/(tabs)')}
          >
            <Text style={styles.buttonText}>Kembali ke Home</Text>
          </TouchableOpacity>
        </View>
      </View>
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

  contentContainer: {
    flex: 1,
    backgroundColor: '#f5f7fb',
    borderTopLeftRadius: 34,
    marginTop: -6,
    paddingTop: 8,
  },

  container: {
    flex: 1,
    padding: 16,
    justifyContent: 'center',
  },

  backButtonFloating: {
    position: 'absolute',
    top: 16,
    left: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },

  backButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 12,
  },

  icon: {
    fontSize: 60,
    textAlign: 'center',
    marginBottom: 10,
  },

  title: {
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
    color: '#0f172a',
  },

  subtitle: {
    textAlign: 'center',
    color: '#64748b',
    marginBottom: 20,
  },

  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },

  image: {
    width: '100%',
    height: 200,
    borderRadius: 14,
    marginBottom: 12,
  },

  infoGroup: {
    marginTop: 10,
  },

  label: {
    fontSize: 12,
    color: '#64748b',
  },

  value: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
  },

  address: {
    fontSize: 13,
    color: '#64748b',
  },

  button: {
    backgroundColor: COLORS.accentOrange,
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
  },

  buttonText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 14,
  },
})