import { create } from 'zustand'
import * as SecureStore from 'expo-secure-store'

type AuthUser = {
  id_pegawai: string | number
  id_mitra: string | number
  nama_pegawai: string
  nama_mitra?: string | null
  email?: string
  no_telp?: string | null
  foto?: string | null
  role?: string
  id_lokasi_absen_default?: string | number
}

type AuthState = {
  access_token: string | null
  expired_at: string | null
  user: AuthUser | null
  isAuthenticated: boolean

  setSession: (payload: {
    access_token: string
    expired_at: string
    user: AuthUser
  }) => Promise<void>

  restoreSession: () => Promise<void>
  clearSession: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  access_token: null,
  expired_at: null,
  user: null,
  isAuthenticated: false,

  setSession: async ({ access_token, expired_at, user }) => {
    await SecureStore.setItemAsync('access_token', access_token)
    await SecureStore.setItemAsync('expired_at', expired_at)
    await SecureStore.setItemAsync('user', JSON.stringify(user))

    set({
      access_token,
      expired_at,
      user,
      isAuthenticated: true,
    })
  },

  restoreSession: async () => {
    try {
      const access_token = await SecureStore.getItemAsync('access_token')
      const expired_at = await SecureStore.getItemAsync('expired_at')
      const userRaw = await SecureStore.getItemAsync('user')

      let user = null
      if (userRaw) {
        try {
          user = JSON.parse(userRaw)
        } catch {
          user = null
        }
      }

      if (access_token && expired_at && user) {
        const expiredTime = new Date(expired_at).getTime()
        const now = Date.now()

        if (expiredTime > now) {
          set({
            access_token,
            expired_at,
            user,
            isAuthenticated: true,
          })
          return
        }
      }
    } catch {
      // Ignore SecureStore read errors
    }

    try {
      await SecureStore.deleteItemAsync('access_token')
      await SecureStore.deleteItemAsync('expired_at')
      await SecureStore.deleteItemAsync('user')
    } catch {
      // Ignore SecureStore delete errors
    }

    set({
      access_token: null,
      expired_at: null,
      user: null,
      isAuthenticated: false,
    })
  },

  clearSession: async () => {
    await SecureStore.deleteItemAsync('access_token')
    await SecureStore.deleteItemAsync('expired_at')
    await SecureStore.deleteItemAsync('user')

    set({
      access_token: null,
      expired_at: null,
      user: null,
      isAuthenticated: false,
    })
  },
}))