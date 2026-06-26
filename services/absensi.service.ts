import { api } from './api'
import { ApiResponse, CreateAbsensiPayload, LokasiAbsensi } from '@/types/absensi'

console.log('ABSENSI API INSTANCE =', api)

export async function getLokasiAbsensi(): Promise<ApiResponse<LokasiAbsensi[]>> {
  const response = await api.get('/absensi/lokasi.php')
  return response.data
}

export async function createAbsensi(
  payload: CreateAbsensiPayload
): Promise<ApiResponse<{
  kode_absensi: string
  waktu_absensi?: string
  tanggal?: string
  distance_meter?: number
}>> {
  const response = await api.post('/absensi/create.php', payload)
  return response.data
}

export async function createBarcodeAbsensi(
  payload: {
    id_pegawai: number
    id_lokasi: number
    latitude: number
    longitude: number
    foto_absensi: string
    device_info: string
    qr_string: string
  }
): Promise<ApiResponse<{
  id_absensi: number
  tanggal: string
  waktu_absensi: string
  id_pegawai: string
  nama_pegawai: string
  id_lokasi: string
  nama_lokasi: string
  alamat_lokasi: string
  distance_meter: number
  radius_meter: number
  foto_absensi: string
  metode_absensi: string
  scanned_by: string
}>> {
  const response = await api.post('/absensi/create_barcode.php', payload)
  return response.data
}

