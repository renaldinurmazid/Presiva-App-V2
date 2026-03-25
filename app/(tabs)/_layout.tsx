import { Tabs, useRouter } from 'expo-router'
import React from 'react'
import { Ionicons } from '@expo/vector-icons'
import { COLORS } from '@/constants/colors'
import { useAuthStore } from '@/store/auth.store'
import { Alert, Platform } from 'react-native'
import { setAuthToken } from '@/services/api'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

export default function TabsLayout() {
  const clearSession = useAuthStore((state) => state.clearSession)
  const router = useRouter()
  const insets = useSafeAreaInsets()

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Apakah Anda yakin ingin logout?',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await clearSession()
            setAuthToken(undefined)
            router.replace('/auth/login')
          },
        },
      ]
    )
  }

  // Calculate proper tab bar height accounting for bottom insets (navigation bar)
  const tabBarHeight = 60 + insets.bottom

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: '#999',
        tabBarStyle: {
          height: tabBarHeight,
          paddingBottom: insets.bottom + 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '700',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'HOME',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="barcode"
        options={{
          title: 'BARCODE',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="qr-code-outline" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="absensi"
        options={{
          title: 'ABSENSI',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="location-outline" size={size} color={color} />
          ),
        }}
      />


      <Tabs.Screen
        name="logout"
        options={{
          title: 'LOGOUT',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="log-out-outline" size={size} color={color} />
          ),
        }}
        listeners={{
          tabPress: (e) => {
            e.preventDefault()
            handleLogout()
          },
        }}
      />
    </Tabs>
  )
}