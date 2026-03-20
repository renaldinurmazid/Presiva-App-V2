import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  View,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
} from 'react-native'
import { useRouter } from 'expo-router'
import { COLORS } from '@/constants/colors'
import DashboardHeader from '@/components/home/DashboardHeader'
import ProfileSummaryCard from '@/components/home/ProfileSummaryCard'
import HomeMenuGrid, { HomeMenuItem } from '@/components/home/HomeMenuGrid'
import InformasiSection from '@/components/home/InformasiSection'
import HistoriSection from '@/components/home/HistoriSection'
import { homeService, HomeResponse } from '@/services/home.service'
import { useAuthStore } from '@/store/auth.store'
import { setAuthToken } from '@/services/api'

export default function HomeScreen() {
  const router = useRouter()

  const user = useAuthStore((state) => state.user)
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const accessToken = useAuthStore((state) => state.access_token)
  const clearSession = useAuthStore((state) => state.clearSession)

  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [data, setData] = useState<HomeResponse['data'] | null>(null)

  const loadHome = useCallback(async () => {
  //console.log('LOAD HOME DIPANGGIL');

  if (!isAuthenticated || !accessToken) {
    //console.log('TIDAK AUTH / TOKEN KOSONG');
    setLoading(false)
    return
  }
  
    try {
      setAuthToken(accessToken)

      const result = await homeService.getHome()
	  //console.log('HOME INFORMASI:', JSON.stringify(result?.data?.informasi, null, 2))  
	  //console.log('HOME RESULT:', JSON.stringify(result, null, 2))
	  
      setData(result?.data || null)
    } catch (error: any) {
	  //console.log('HOME ERROR:', error?.response?.status, JSON.stringify(error?.response?.data, null, 2), error?.message)
	

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
  }, [isAuthenticated, accessToken, clearSession, router])

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
      baseMenus.push({
        key: 'hrd',
        label: 'HRD',
        icon: 'business-outline',
        onPress: () => router.push('/hrd'),
      }, 
	  {
        key: 'laporan_hrd',
        label: 'LAPORAN HRD',
        icon: 'bar-chart-outline',
        onPress: () => router.push('/laporan_hrd'),
      })
    }

    return baseMenus
  }, [router, user?.role])

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

      <View style={styles.headerBackground}>
        <DashboardHeader />
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
            <ActivityIndicator size="large" color={COLORS.primary} />
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
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 34,
    marginTop: -6,
    paddingTop: 8,
  },
  loaderWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
})