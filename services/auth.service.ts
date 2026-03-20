import { api } from './api';

export type LoginPayload = {
  email: string;
  password: string;
};

export interface RegisterMitraPayload {
  nama_mitra: string
  no_telp_mitra?: string
  alamat_mitra?: string
  nama_pic: string
  email_pic: string
  no_telp_pic: string
  password: string
  remark?: string
  latitude?: number | null
  longitude?: number | null
}

export const authService = {
  async login(payload: LoginPayload) {
    const response = await api.post('/auth/login.php', payload)
    return response.data
  },

  async registerMitra(payload: RegisterMitraPayload) {
    const response = await api.post('/auth/register_mitra.php', payload)
    return response.data
  },
}