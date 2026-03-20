import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '@/constants/colors';

type HistoriItem = {
  id_absensi: number;
  tanggal_kerja: string;
  waktu_absensi: string;
  kode_absensi: 'MASUK' | 'KELUAR';
  nama_lokasi: string | null;
};

type Props = {
  items: HistoriItem[];
};

export default function HistoriSection({ items }: Props) {
  return (
    <View style={styles.wrapper}>
      <Text style={styles.title}>Histori Absensi</Text>

      {items.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>Belum ada histori absensi</Text>
        </View>
      ) : (
        items.map((item) => (
          <View key={item.id_absensi} style={styles.card}>
            <View style={styles.rowBetween}>
              <Text style={styles.date}>{item.tanggal_kerja}</Text>
              <Text
                style={[
                  styles.badge,
                  item.kode_absensi === 'MASUK' ? styles.badgeMasuk : styles.badgeKeluar,
                ]}
              >
                {item.kode_absensi}
              </Text>
            </View>

            <Text style={styles.time}>{item.waktu_absensi}</Text>
            <Text style={styles.location}>{item.nama_lokasi || '-'}</Text>
          </View>
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: 20,
    marginTop: 24,
    marginBottom: 32,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.primary,
    marginBottom: 12,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 7,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  date: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  time: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 8,
  },
  location: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  badge: {
    fontSize: 11,
    fontWeight: '800',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 999,
    overflow: 'hidden',
  },
  badgeMasuk: {
    backgroundColor: '#E8F5E9',
    color: COLORS.success,
  },
  badgeKeluar: {
    backgroundColor: '#FFF3E0',
    color: COLORS.accentOrange,
  },
  emptyCard: {
    backgroundColor: COLORS.white,
    borderRadius: 18,
    padding: 18,
  },
  emptyText: {
    color: COLORS.textSecondary,
    fontSize: 13,
  },
});