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
