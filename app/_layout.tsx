import React, { useEffect, useState } from 'react'
import { Stack, usePathname, useRouter } from 'expo-router'
import { ActivityIndicator, View, StyleSheet } from 'react-native'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { useAuthStore } from '@/store/auth.store'
import { COLORS } from '@/constants/colors'
import { setAuthToken } from '@/services/api'

export default function RootLayout() {
  const router = useRouter()
  const pathname = usePathname()

  const restoreSession = useAuthStore((state) => state.restoreSession)
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const accessToken = useAuthStore((state) => state.access_token)

  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    const init = async () => {
      try {
        await restoreSession()
      } catch {
        // Session restore failed, will redirect to login
      }
      setIsReady(true)
    }

    init()
  }, []) // Remove restoreSession from deps to avoid re-triggering

  useEffect(() => {
    if (!isReady) return

    if (accessToken) {
      setAuthToken(accessToken)
    } else {
      setAuthToken(undefined)
    }
  }, [isReady, accessToken])

  useEffect(() => {
    if (!isReady) return

    const isAuthRoute = pathname.startsWith('/auth')

    if (!isAuthenticated && !isAuthRoute) {
      router.replace('/auth/login')
      return
    }

    if (isAuthenticated && (isAuthRoute || pathname === '/')) {
      router.replace('/(tabs)')
      return
    }
  }, [isReady, isAuthenticated, pathname, router])

  if (!isReady) {
    return (
      <SafeAreaProvider>
        <GestureHandlerRootView style={styles.root}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
          </View>
        </GestureHandlerRootView>
      </SafeAreaProvider>
    )
  }

  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={styles.root}>
        <Stack screenOptions={{ headerShown: false }} />
      </GestureHandlerRootView>
    </SafeAreaProvider>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
})