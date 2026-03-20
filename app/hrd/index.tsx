import React from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { COLORS } from '@/constants/colors'
import { useAuthStore } from '@/store/auth.store'

type HrdMenuItem = {
  title: string
  subtitle: string
  route: string
  icon: keyof typeof Ionicons.glyphMap
}

const HRD_MENUS: HrdMenuItem[] = [
  {
    title: 'Update Data Mitra',
    subtitle: 'Kelola data mitra',
    route: '/hrd/mitra',
    icon: 'business-outline',
  },
  {
    title: 'Hari Libur',
    subtitle: 'Kelola data tanggal libur',
    route: '/hrd/hari-libur',
    icon: 'calendar-outline',
  },
  {
    title: 'Informasi',
    subtitle: 'Kelola informasi untuk pegawai',
    route: '/hrd/informasi',
    icon: 'notifications-outline',
  },
  {
    title: 'Lokasi Absen',
    subtitle: 'Kelola lokasi absensi',
    route: '/hrd/lokasi-absensi',
    icon: 'location-outline',
  },
  {
    title: 'Data Pegawai',
    subtitle: 'Kelola data pegawai',
    route: '/hrd/pegawai',
    icon: 'people-outline',
  },
  {
    title: 'Periode Gaji',
    subtitle: 'Kelola periode absensi',
    route: '/hrd/periode',
    icon: 'time-outline',
  },
  {
    title: 'Master Shift',
    subtitle: 'Kelola master shift',
    route: '/hrd/master-shift',
    icon: 'layers-outline',
  },
  {
    title: 'Shift Pegawai',
    subtitle: 'Kelola shift pegawai',
    route: '/hrd/jadwal-shift',
    icon: 'swap-horizontal-outline',
  },
]

function MenuCard({
  title,
  subtitle,
  icon,
  onPress,
}: {
  title: string
  subtitle: string
  icon: keyof typeof Ionicons.glyphMap
  onPress: () => void
}) {
  return (
    <TouchableOpacity style={styles.menuCard} onPress={onPress} activeOpacity={0.85}>
      <View style={styles.menuIconWrap}>
        <Ionicons name={icon} size={28} color={COLORS.primary} />
      </View>

      <View style={styles.menuContent}>
        <Text style={styles.menuTitle}>{title}</Text>
        <Text style={styles.menuSubtitle}>{subtitle}</Text>
      </View>

      <Ionicons name="chevron-forward-outline" size={24} color="#A3A3A3" />
    </TouchableOpacity>
  )
}

export default function HrdMenuScreen() {
  const user = useAuthStore((state) => state.user)
  const namaMitra =
    (user as any)?.nama_mitra ||
    (user as any)?.mitra?.nama_mitra ||
    'Mitra PRESIVA'

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>HRD MENU</Text>
          <Text style={styles.headerSubtitle}>{namaMitra}</Text>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.sectionTitle}>Menu HRD</Text>

          {HRD_MENUS.map((item) => (
            <MenuCard
              key={item.route}
              title={item.title}
              subtitle={item.subtitle}
              icon={item.icon}
              onPress={() => router.push(item.route as any)}
            />
          ))}

          <View style={{ height: 90 }} />
        </ScrollView>

        <TouchableOpacity
          style={styles.floatingHomeButton}
          onPress={() => router.replace('/(tabs)')}
          activeOpacity={0.9}
        >
          <Ionicons name="home-outline" size={24} color="#FFF" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.primary,
  },

  container: {
    flex: 1,
    backgroundColor: COLORS.primary,
  },

  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 18,
    backgroundColor: COLORS.primary,
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

  scrollContent: {
    padding: 20,
    paddingBottom: 30,
    backgroundColor: '#F3F4F6',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    minHeight: '100%',
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 16,
  },

  menuCard: {
    backgroundColor: '#FFF',
    borderRadius: 22,
    padding: 18,
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },

  menuIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: '#EAF3FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },

  menuContent: {
    flex: 1,
  },

  menuTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 4,
  },

  menuSubtitle: {
    fontSize: 14,
    color: '#8C8C8C',
    lineHeight: 20,
  },

  floatingHomeButton: {
    position: 'absolute',
    left: 20,
    bottom: 24,
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: COLORS.accentOrange,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
})