import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  StatusBar,
  Alert,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { COLORS } from '@/constants/colors'
import { useAuthStore } from '@/store/auth.store'
import { authService } from '@/services/auth.service'
import { setAuthToken } from '@/services/api'

export default function LoginScreen() {
  const router = useRouter()
  const setSession = useAuthStore((state) => state.setSession)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleLogin = async () => {
    const emailValue = email.trim()
    const passwordValue = password.trim()

    if (!emailValue || !passwordValue) {
      Alert.alert('Validasi', 'Email dan password wajib diisi.')
      return
    }

    try {
      setLoading(true)

      const response = await authService.login({
        email: emailValue,
        password: passwordValue,
      })

      if (!response?.success) {
        Alert.alert('Login Gagal', response?.message || 'Email atau password salah.')
        return
      }

      const accessToken = response.data?.access_token
      const expiredAt =
        response.data?.expired_at ||
        new Date(
          Date.now() + (response.data?.expires_in || 2592000) * 1000
        ).toISOString()
      const user = response.data?.pegawai

      if (!accessToken || !user) {
        throw new Error('Response login tidak lengkap.')
      }

      setAuthToken(accessToken)

      await setSession({
        access_token: accessToken,
        expired_at: expiredAt,
        user,
      })

      setShowPassword(false)
      router.replace('/(tabs)/absensi')
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        'Terjadi kesalahan saat login.'
      Alert.alert('Login Gagal', message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

      <View style={styles.container}>
        <View style={styles.logoContainer}>
          <Image
            source={require('../../assets/images/logo-presiva.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.title}>PRESIVA</Text>
          <Text style={styles.subtitle}>Presensi Digital</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.loginTitle}>Login</Text>

          <TextInput
            placeholder="Email"
            style={styles.input}
            placeholderTextColor="#999"
            autoCapitalize="none"
            keyboardType="email-address"
            autoCorrect={false}
            value={email}
            onChangeText={setEmail}
            editable={!loading}
          />

          <View style={styles.passwordWrapper}>
            <TextInput
              placeholder="Password"
              style={styles.passwordInput}
              placeholderTextColor="#999"
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoCorrect={false}
              value={password}
              onChangeText={setPassword}
              editable={!loading}
            />

            <TouchableOpacity
              style={styles.eyeIcon}
              onPress={() => setShowPassword((prev) => !prev)}
              disabled={loading}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons
                name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                size={20}
                color="#666"
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.loginButton, loading && styles.loginButtonDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.loginButtonText}>LOGIN</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.registerWrapper}
            onPress={() => router.push('/auth/register-mitra')}
            disabled={loading}
          >
            <Text style={styles.registerText}>
              Belum punya akun? <Text style={styles.registerLink}>Daftar Mitra</Text>
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.footer}>© PRESIVA</Text>
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
    paddingHorizontal: 24,
    justifyContent: 'center',
  },

  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },

  logo: {
    width: 120,
    height: 120,
    marginBottom: 10,
  },

  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFF',
  },

  subtitle: {
    fontSize: 14,
    color: '#E5E7EB',
    marginTop: 4,
  },

  card: {
    backgroundColor: '#FFF',
    borderRadius: 22,
    padding: 24,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },

  loginTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.primary,
    marginBottom: 20,
  },

  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 14,
    fontSize: 14,
    color: COLORS.textPrimary,
  },

  passwordWrapper: {
    position: 'relative',
    marginBottom: 14,
  },

  passwordInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    paddingRight: 44,
    fontSize: 14,
    color: COLORS.textPrimary,
  },

  eyeIcon: {
    position: 'absolute',
    right: 14,
    top: 13,
  },

  loginButton: {
    backgroundColor: COLORS.accentOrange,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 6,
  },

  loginButtonDisabled: {
    opacity: 0.7,
  },

  loginButtonText: {
    color: '#FFF',
    fontWeight: '800',
    fontSize: 14,
  },

  registerWrapper: {
    marginTop: 16,
    alignItems: 'center',
  },

  registerText: {
    fontSize: 13,
    color: '#666',
  },

  registerLink: {
    color: COLORS.primary,
    fontWeight: '700',
  },

  footer: {
    textAlign: 'center',
    color: '#E5E7EB',
    marginTop: 30,
    fontSize: 12,
  },
})