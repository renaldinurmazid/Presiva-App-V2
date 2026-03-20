import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '@/constants/colors';

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
//console.log('INFORMASI ITEMS:', JSON.stringify(items, null, 2));
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
    paddingHorizontal: 20,
    marginTop: 24,
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
  cardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  cardDate: {
    fontSize: 12,
    color: COLORS.accentOrange,
    marginTop: 6,
    fontWeight: '700',
  },
  cardDesc: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 8,
    lineHeight: 18,
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