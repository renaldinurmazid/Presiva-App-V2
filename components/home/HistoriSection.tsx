import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, FontSize, FontFamily, Radius, Spacing } from '@/constants/colors';

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

            <Text style={styles.time}>Waktu: {item.waktu_absensi}</Text>
            <Text style={styles.location}>Lokasi: {item.nama_lokasi || '-'}</Text>
          </View>
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: Spacing[4],
    marginTop: Spacing[5],
    marginBottom: Spacing[8],
  },
  title: {
    fontSize: FontSize.lg,
    fontFamily: FontFamily.semibold,
    color: Colors.neutral[900],
    marginBottom: Spacing[3],
  },
  card: {
    backgroundColor: Colors.neutral[0],
    borderRadius: Radius.lg,
    padding: Spacing[4],
    marginBottom: Spacing[3],
    borderWidth: 1,
    borderColor: Colors.neutral[100],
    elevation: 0,
    shadowOpacity: 0,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  date: {
    fontSize: FontSize.base,
    fontFamily: FontFamily.semibold,
    color: Colors.neutral[900],
  },
  time: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.regular,
    color: Colors.neutral[700],
    marginTop: Spacing[2],
  },
  location: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.regular,
    color: Colors.neutral[700],
    marginTop: Spacing[1],
  },
  badge: {
    fontSize: FontSize.xs,
    fontFamily: FontFamily.semibold,
    paddingVertical: Spacing[1],
    paddingHorizontal: Spacing[2] + 2,
    borderRadius: Radius.full,
    overflow: 'hidden',
  },
  badgeMasuk: {
    backgroundColor: Colors.success[100],
    color: '#16A34A',
  },
  badgeKeluar: {
    backgroundColor: Colors.primary[100],
    color: Colors.primary[500],
  },
  emptyCard: {
    backgroundColor: Colors.neutral[0],
    borderRadius: Radius.lg,
    padding: Spacing[4],
    borderWidth: 1,
    borderColor: Colors.neutral[100],
  },
  emptyText: {
    fontFamily: FontFamily.regular,
    color: Colors.neutral[500],
    fontSize: FontSize.base,
  },
});