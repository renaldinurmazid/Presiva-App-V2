import React from 'react';
import { View, Text, StyleSheet, Image, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { COLORS } from '@/constants/colors';

type Props = {
  namaPegawai: string;
  namaMitra?: string | null;
  noTelp?: string | null;
  foto?: string | null;
  idPegawai?: string; // optional kalau nanti mau kirim param
};

const BASE_URL = 'https://gosukses.com';

export default function ProfileSummaryCard({
  namaPegawai,
  namaMitra,
  noTelp,
  foto,
  idPegawai,
}: Props) {
  const router = useRouter();

  const getFotoUri = (foto?: string | null) => {
    if (!foto || foto === 'null' || foto.trim() === '') return null;

    const cleanFoto = foto.trim();

    if (cleanFoto.startsWith('http')) {
      return `${cleanFoto}?t=${Date.now()}`;
    }

    if (cleanFoto.startsWith('/')) {
      return `${BASE_URL}${cleanFoto}?t=${Date.now()}`;
    }

    if (cleanFoto.startsWith('uploads/')) {
      return `${BASE_URL}/${cleanFoto}?t=${Date.now()}`;
    }

    if (cleanFoto.startsWith('foto_pegawai/')) {
      return `${BASE_URL}/uploads/${cleanFoto}?t=${Date.now()}`;
    }

    return `${BASE_URL}/uploads/foto_pegawai/${encodeURIComponent(cleanFoto)}?t=${Date.now()}`;
  };

  const fotoUri = getFotoUri(foto);

  return (
    <Pressable
      onPress={() =>
        router.push({
          pathname: '/pegawai/biodata',
          params: { id: idPegawai || '' }, // optional kirim id
        })
      }
      style={({ pressed }) => [
        styles.card,
        pressed && { opacity: 0.85 },
      ]}
    >
      <View style={styles.left}>
        {fotoUri ? (
          <Image
            source={{ uri: fotoUri }}
            style={styles.avatar}
            onError={(e) =>
              console.log('Image load error:', e.nativeEvent)
            }
          />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Ionicons
              name="person-outline"
              size={30}
              color={COLORS.primary}
            />
          </View>
        )}

        <View style={styles.textWrapper}>
          <Text style={styles.name} numberOfLines={1}>
            {namaPegawai}
          </Text>
          <Text style={styles.meta} numberOfLines={1}>
            {namaMitra || '-'}
          </Text>
          <Text style={styles.meta}>
            Telp: {noTelp || '-'}
          </Text>
        </View>
      </View>

      <Ionicons
        name="chevron-forward-outline"
        size={20}
        color="#D1D5DB"
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFF',
    marginHorizontal: 20,
    marginTop: 8,
    borderRadius: 22,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 68,
    height: 68,
    borderRadius: 34,
    marginRight: 14,
    backgroundColor: '#F3F4F6',
  },
  avatarPlaceholder: {
    width: 68,
    height: 68,
    borderRadius: 34,
    marginRight: 14,
    backgroundColor: '#EAF3FD',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textWrapper: { flex: 1 },
  name: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
  },
  meta: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
});