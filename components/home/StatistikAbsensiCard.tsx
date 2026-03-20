import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '@/constants/colors';

type Props = {
  hadir: number;
  terlambat: number;
  tidakHadir: number;
  periode?: string | null;
};

export default function StatistikAbsensiCard({
  hadir,
  terlambat,
  tidakHadir,
  periode,
}: Props) {
  const stats = [
    { label: 'Hadir', value: hadir, color: COLORS.success },
    { label: 'Terlambat', value: terlambat, color: COLORS.warning },
    { label: 'Tidak Hadir', value: tidakHadir, color: COLORS.danger },
  ];

  return (
    <View style={styles.wrapper}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Statistik Absensi</Text>
        <Text style={styles.period}>{periode || '-'}</Text>
      </View>

      <View style={styles.statsRow}>
        {stats.map((item) => (
          <View key={item.label} style={styles.statCard}>
            <View style={[styles.dot, { backgroundColor: item.color }]} />
            <Text style={styles.value}>{item.value}</Text>
            <Text style={styles.label}>{item.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: 20,
    marginTop: 4,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.primary,
  },
  period: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    width: '31%',
    backgroundColor: COLORS.white,
    borderRadius: 18,
    paddingVertical: 16,
    paddingHorizontal: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginBottom: 10,
  },
  value: {
    fontSize: 26,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  label: {
    fontSize: 12,
    textAlign: 'center',
    color: COLORS.textSecondary,
    marginTop: 4,
    fontWeight: '700',
  },
});