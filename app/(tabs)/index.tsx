import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  View,
  StyleSheet,
  ScrollView,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { Colors, FontSize, FontFamily, Radius, Spacing } from '@/constants/colors'
import ProfileSummaryCard from '@/components/home/ProfileSummaryCard'
import HomeMenuGrid, { HomeMenuItem } from '@/components/home/HomeMenuGrid'
import InformasiSection from '@/components/home/InformasiSection'
import { homeService, HomeResponse } from '@/services/home.service'
import { useAuthStore } from '@/store/auth.store'
import { setAuthToken } from '@/services/api'

export default function HomeScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()

  const user = useAuthStore((state) => state.user)
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const accessToken = useAuthStore((state) => state.access_token)
  const clearSession = useAuthStore((state) => state.clearSession)
  const updateUser = useAuthStore((state) => state.updateUser)

  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [data, setData] = useState<HomeResponse['data'] | null>(null)

  const loadHome = useCallback(async () => {
    if (!isAuthenticated || !accessToken) {
      setLoading(false)
      return
    }
    
    try {
      setAuthToken(accessToken)
      const result = await homeService.getHome()
      setData(result?.data || null)

      const serverPegawai = result?.data?.pegawai
      if (serverPegawai) {
        await updateUser({
          nama_pegawai: serverPegawai.nama_pegawai,
          nama_mitra: serverPegawai.nama_mitra,
          no_telp: serverPegawai.no_telp,
          foto: serverPegawai.foto,
          role: serverPegawai.role,
          id_lokasi_absen_default: serverPegawai.id_lokasi_absen_default,
        })
      }
    } catch (error: any) {
      if (error?.response?.status === 401) {
        await clearSession()
        setAuthToken(undefined)
        router.replace('/auth/login')
        return
      }
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [isAuthenticated, accessToken, clearSession, router, updateUser])

  useEffect(() => {
    if (!isAuthenticated || !accessToken) {
      setLoading(false)
      return
    }

    loadHome()
  }, [isAuthenticated, accessToken, loadHome])

  const onRefresh = async () => {
    if (!isAuthenticated || !accessToken) {
      setRefreshing(false)
      return
    }

    setRefreshing(true)
    await loadHome()
  }

  const menus = useMemo<HomeMenuItem[]>(() => {
    const baseMenus: HomeMenuItem[] = [
      {
        key: 'keluarga',
        label: 'Keluarga',
        icon: 'people-outline',
        onPress: () => router.push('/pegawai/keluarga'),
      },
      {
        key: 'pendidikan',
        label: 'Pendidikan',
        icon: 'school-outline',
        onPress: () => router.push('/pegawai/pendidikan'),
      },
      {
        key: 'keahlian',
        label: 'Keahlian',
        icon: 'star-outline',
        onPress: () => router.push('/pegawai/keahlian'),
      },
      {
        key: 'kursus',
        label: 'Kursus/Diklat',
        icon: 'ribbon-outline',
        onPress: () => router.push('/pegawai/kursus'),
      },
      {
        key: 'pengalaman',
        label: 'Pengalaman',
        icon: 'briefcase-outline',
        onPress: () => router.push('/pegawai/pengalaman'),
      },
      {
        key: 'hist_absensi',
        label: 'History Absensi',
        icon: 'clipboard-outline',
        onPress: () => router.push('/pegawai/absensi'),
      },
      {
        key: 'laporan_pegawai',
        label: 'Laporan',
        icon: 'bar-chart-outline',
        onPress: () => router.push('/laporan_pegawai'),
      },
    ]

    if (user?.role === 'HRD' || user?.role === 'ADMIN_PRESIVA') {
      baseMenus.push(
        {
          key: 'hrd',
          label: 'HRD',
          icon: 'business-outline',
          onPress: () => router.push('/hrd'),
        }, 
        {
          key: 'laporan_hrd',
          label: 'Laporan HRD',
          icon: 'bar-chart-outline',
          onPress: () => router.push('/laporan_hrd'),
        }
      )
    }

    return baseMenus
  }, [router, user?.role])

  return (
    <View style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.primary[500]} translucent />

      <View style={[styles.headerBackground, { paddingTop: insets.top }]}>
        <ProfileSummaryCard
          namaPegawai={user?.nama_pegawai || '-'}
          namaMitra={user?.nama_mitra || '-'}
          noTelp={user?.no_telp || '-'}
          foto={user?.foto || null}
        />
      </View>

      <View style={styles.contentContainer}>
        {loading ? (
          <View style={styles.loaderWrapper}>
            <ActivityIndicator size="large" color={Colors.primary[500]} />
          </View>
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
          >
            <HomeMenuGrid menus={menus} />
            <InformasiSection items={data?.informasi || []} />
          </ScrollView>
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.primary[500],
  },
  headerBackground: {
    backgroundColor: Colors.primary[500],
    paddingBottom: Spacing[6],
    borderBottomRightRadius: Radius.xl,
  },
  contentContainer: {
    flex: 1,
    backgroundColor: Colors.neutral[50],
    borderTopLeftRadius: Radius.xl,
    marginTop: -Spacing[2],
    paddingTop: Spacing[2],
  },
  loaderWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
})