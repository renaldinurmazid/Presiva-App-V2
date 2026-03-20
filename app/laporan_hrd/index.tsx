import React, { useEffect, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  ActivityIndicator,
  Alert,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { COLORS } from '@/constants/colors'
import { useAuthStore } from '@/store/auth.store'
import { api } from '@/services/api'

type RptPegawai = {
  title: string
  subtitle: string
  route: string
  icon: keyof typeof Ionicons.glyphMap
}

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

export default function RPTMenuScreen() {
  const router = useRouter()
  const user = useAuthStore((state) => state.user)
  const [menus, setMenus] = useState<RptPegawai[]>([])
  const [loading, setLoading] = useState(true)

  const namaMitra = (user as any)?.nama_mitra || '-'
  const idPegawai = String((user as any)?.id_pegawai ?? '')
  const idMitra = String((user as any)?.id_mitra ?? '')

  const loadMenus = async () => {
    try {
      setLoading(true)
      const res = await api.get('/laporan/list_hrd.php')

      if (res.data?.success) {
        setMenus(res.data.data)
      } else {
        throw new Error(res.data?.message || 'Gagal memuat data')
      }
    } catch (error: any) {
      console.error('RPT_FETCH_ERROR:', error.response?.data || error.message)
      Alert.alert('Error', 'Gagal mengambil daftar laporan dari server.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadMenus()
  }, [])

  const handleNavigation = (item: RptPegawai) => {
    if (!item.route) return

    const isExternal = item.route.startsWith('http')

    console.log('USER DATA =', user)
    console.log('SEND id_pegawai =', idPegawai)
    console.log('SEND id_mitra =', idMitra)
    console.log('MENU ROUTE =', item.route)

    if (isExternal) {
      router.push({
        pathname: '/laporan_hrd/view',
        params: {
          url: encodeURIComponent(item.route),
          title: item.title,
          id_pegawai: idPegawai,
          id_mitra: idMitra,
        },
      })
    } else {
      const cleanPath = item.route.startsWith('/') ? item.route : `/${item.route}`
      router.push(cleanPath as any)
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>LAPORAN HRD</Text>
          <Text style={styles.headerSubtitle}>{namaMitra}</Text>
        </View>

        <View style={styles.contentContainer}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.sectionTitle}>Daftar Laporan</Text>

            {loading ? (
              <View style={styles.centerState}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text style={styles.centerText}>Memuat menu...</Text>
              </View>
            ) : menus.length > 0 ? (
              menus.map((item, index) => (
                <MenuCard
                  key={index}
                  title={item.title}
                  subtitle={item.subtitle}
                  icon={item.icon || 'document-text-outline'}
                  onPress={() => handleNavigation(item)}
                />
              ))
            ) : (
              <View style={styles.centerState}>
                <Ionicons name="document-outline" size={60} color="#D1D5DB" />
                <Text style={styles.centerText}>Belum ada laporan tersedia.</Text>
              </View>
            )}

            <View style={{ height: 100 }} />
          </ScrollView>
        </View>

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
    paddingBottom: 28,
    backgroundColor: COLORS.primary,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FFF',
  },
  headerSubtitle: {
    marginTop: 4,
    fontSize: 14,
    color: '#E5E7EB',
  },
  contentContainer: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderTopLeftRadius: 34,
    marginTop: -6,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 16,
    marginLeft: 4,
  },
  menuCard: {
    backgroundColor: '#FFF',
    borderRadius: 22,
    padding: 18,
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 12,
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
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 4,
  },
  menuSubtitle: {
    fontSize: 13,
    color: '#8C8C8C',
    lineHeight: 18,
  },
  centerState: {
    marginTop: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerText: {
    marginTop: 12,
    color: '#9CA3AF',
    fontSize: 14,
  },
  floatingHomeButton: {
    position: 'absolute',
    left: 20,
    bottom: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.accentOrange,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
})