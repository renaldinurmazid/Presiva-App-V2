import { api } from './api';

export type HomeResponse = {
  success: boolean;
  message: string;
  data: {
    pegawai: {
      id_pegawai: number;
      nama_pegawai: string;
      nama_mitra: string | null;
      no_telp: string | null;
      foto: string | null;
      role: string;
      jabatan: string | null;
      divisi: string | null;
    };
    shift_hari_ini: {
      id_pegawai_shift: number | null;
      nama_shift: string | null;
      jam_masuk: string | null;
      jam_keluar: string | null;
      tanggal_shift: string | null;
      is_lintas_hari: number | null;
    };
    statistik: {
      hadir: number;
      terlambat: number;
      tidak_hadir: number;
      periode: string | null;
    };
	informasi: Array<{
	  id_informasi: number;
	  judul_informasi: string;
	  isi_informasi: string | null;
	  created_date: string | null;
	  created_by: string | null;
	}>;
    histori_absensi: Array<{
      id_absensi: number;
      tanggal_kerja: string;
      waktu_absensi: string;
      kode_absensi: 'MASUK' | 'KELUAR';
      nama_lokasi: string | null;
    }>;
  };
};

export const homeService = {
  getHome: async () => {
    const response = await api.get<HomeResponse>('/home/index.php');
    return response.data;
  },
};