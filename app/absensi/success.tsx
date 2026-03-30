import { useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  StatusBar,
  ScrollView,
} from 'react-native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { COLORS } from '@/constants/colors'
import { useAuthStore } from '@/store/auth.store'
import { Ionicons } from '@expo/vector-icons'

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

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} translucent />
      
      {/* HEADER SECTION */}
      <View style={[styles.headerBackground, { paddingTop: insets.top }]}>
        <View style={styles.headerTop}>
          <View style={{ flex: 1 }}>
            <DashboardHeader title="Konfirmasi" />
          </View>
          <TouchableOpacity
            style={styles.homeButton}
            onPress={() => router.replace('/(tabs)')}
          >
            <Ionicons name="home-outline" size={18} color="#fff" />
            <Text style={styles.homeButtonText}>Home</Text>
          </TouchableOpacity>
        </View>

        <ProfileSummaryCard
          namaPegawai={user?.nama_pegawai || '-'}
          namaMitra={user?.nama_mitra || '-'}
          noTelp={user?.no_telp || '-'}
          foto={user?.foto || null}
        />
      </View>

      {/* CONTENT AREA */}
      <ScrollView 
        style={styles.contentContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.successBadgeContainer}>
          <View style={styles.successIconCircle}>
            <Ionicons name="checkmark-sharp" size={40} color={COLORS.success} />
          </View>
          <Text style={styles.title}>Absensi Berhasil</Text>
          <Text style={styles.subtitle}>
            Data absensi Anda telah tersimpan dengan aman di sistem.
          </Text>
        </View>

        {/* DETAILS CARD */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Detail Absensi</Text>
          </View>

          {foto ? (
            <Image source={{ uri: foto }} style={styles.image} />
          ) : (
            <View style={styles.noImagePlaceholder}>
              <Ionicons name="image-outline" size={32} color={COLORS.muted} />
              <Text style={styles.noImageText}>Tidak ada foto</Text>
            </View>
          )}

          <View style={styles.detailsContainer}>
            <View style={styles.infoRow}>
              <View style={styles.iconBox}>
                <Ionicons name="location" size={18} color={COLORS.primary} />
              </View>
              <View style={styles.infoText}>
                <Text style={styles.label}>Lokasi Absensi</Text>
                <Text style={styles.value}>{namaLokasi || '-'}</Text>
                {alamat ? (
                  <Text style={styles.address}>{alamat}</Text>
                ) : null}
              </View>
            </View>

            <View style={styles.infoRow}>
              <View style={styles.iconBox}>
                <Ionicons name="time" size={18} color={COLORS.primary} />
              </View>
              <View style={styles.infoText}>
                <Text style={styles.label}>Waktu</Text>
                <Text style={styles.value}>{formattedTime}</Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <View style={styles.iconBox}>
                <Ionicons name="navigate" size={18} color={COLORS.primary} />
              </View>
              <View style={styles.infoText}>
                <Text style={styles.label}>Jarak ke Lokasi</Text>
                <Text style={styles.value}>{distance} meter</Text>
              </View>
            </View>
          </View>
        </View>

        {/* ACTION BUTTON */}
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => router.replace('/(tabs)')}
        >
          <Text style={styles.primaryButtonText}>Selesai & Keluar</Text>
          <Ionicons name="arrow-forward" size={18} color="#fff" style={{ marginLeft: 8 }} />
        </TouchableOpacity>
        
        <View style={{ height: 40 }} />
      </ScrollView>
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
    paddingBottom: 32,
    borderBottomRightRadius: 40,
    zIndex: 10,
  },

  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingRight: 20,
  },

  homeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 10,
  },

  homeButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 13,
    marginLeft: 6,
  },

  contentContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderTopLeftRadius: 36,
    marginTop: -24,
  },

  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 24,
  },

  successBadgeContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },

  successIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#D1FAE5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: COLORS.success,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },

  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 8,
    letterSpacing: -0.5,
  },

  subtitle: {
    fontSize: 15,
    color: COLORS.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 20,
    lineHeight: 22,
  },

  card: {
    backgroundColor: '#fff',
    borderRadius: 24,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 15,
    shadowOffset: { width: 0, height: 10 },
    elevation: 5,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },

  cardHeader: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    backgroundColor: '#FCFDFF',
  },

  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#475569',
  },

  image: {
    width: '100%',
    height: 220,
    backgroundColor: '#F1F5F9',
  },

  noImagePlaceholder: {
    width: '100%',
    height: 180,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
  },

  noImageText: {
    color: COLORS.muted,
    fontSize: 14,
    marginTop: 8,
  },

  detailsContainer: {
    padding: 20,
  },

  infoRow: {
    flexDirection: 'row',
    marginBottom: 20,
  },

  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },

  infoText: {
    flex: 1,
  },

  label: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },

  value: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
    lineHeight: 22,
  },

  address: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 4,
    lineHeight: 20,
  },

  primaryButton: {
    backgroundColor: COLORS.accentOrange,
    paddingVertical: 16,
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.accentOrange,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },

  primaryButtonText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 16,
  },
})