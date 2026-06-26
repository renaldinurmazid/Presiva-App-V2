import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, FontSize, FontFamily, Radius, Spacing } from '@/constants/colors';

type InformasiItem = {
  id_informasi: number;
  judul_informasi: string;
  created_date: string | null;
  created_by: string | null;
  isi_informasi: string | null;
};

type Props = {
  items: InformasiItem[];
};

export default function InformasiSection({ items }: Props) {
  return (
    <View style={styles.wrapper}>
      <Text style={styles.title}>Informasi</Text>

      {items.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>Belum ada informasi aktif</Text>
        </View>
      ) : (
        items.map((item) => (
          <View key={item.id_informasi} style={styles.card}>
            <Text style={styles.cardTitle}>{item.judul_informasi}</Text>
            <Text style={styles.cardDesc} numberOfLines={2}>
              {item.isi_informasi || '-'}
            </Text>
            <Text style={styles.cardDate}>
              {item.created_date || '-'} {item.created_by ? `by ${item.created_by}` : ''}
            </Text>
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
  cardTitle: {
    fontSize: FontSize.md,
    fontFamily: FontFamily.semibold,
    color: Colors.neutral[900],
  },
  cardDate: {
    fontSize: FontSize.xs,
    fontFamily: FontFamily.medium,
    color: Colors.primary[500],
    marginTop: Spacing[2],
  },
  cardDesc: {
    fontSize: FontSize.base,
    fontFamily: FontFamily.regular,
    color: Colors.neutral[700],
    marginTop: Spacing[2],
    lineHeight: 20,
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