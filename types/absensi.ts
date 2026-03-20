export type LokasiAbsensi = {
  id_lokasi: string
  id_mitra: string
  nama_lokasi: string
  alamat?: string
  latitude: number
  longitude: number
  radius_meter: number
}

export type UserCoordinate = {
  latitude: number
  longitude: number
}

export type CreateAbsensiPayload = {
  id_lokasi: string
  latitude: number
  longitude: number
  foto_absensi: string
  device_info: string
}

export type ApiResponse<T = any> = {
  success: boolean
  message?: string
  data?: T
}