import React from 'react';
import { View, Text, StyleSheet, Image, Pressable } from 'react-native';
import { ChevronRight, User } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { Colors, FontSize, FontFamily, Radius, Spacing } from '@/constants/colors';

type Props = {
  namaPegawai: string;
  namaMitra?: string | null;
  noTelp?: string | null;
  foto?: string | null;
  idPegawai?: string;
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
          params: { id: idPegawai || '' },
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
            <User
              size={24}
              color={Colors.primary[500]}
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
          <Text style={styles.meta} numberOfLines={1}>
            Telp: {noTelp || '-'}
          </Text>
        </View>
      </View>

      <ChevronRight
        size={18}
        color={Colors.neutral[500]}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.neutral[0],
    marginHorizontal: Spacing[4],
    marginTop: Spacing[4],
    borderRadius: Radius.lg,
    padding: Spacing[4],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: Colors.neutral[100],
    elevation: 0,
    shadowOpacity: 0,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: Radius.full,
    marginRight: Spacing[3],
    backgroundColor: Colors.neutral[50],
    borderWidth: 2,
    borderColor: Colors.neutral[100],
  },
  avatarPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: Radius.full,
    marginRight: Spacing[3],
    backgroundColor: Colors.primary[100],
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.neutral[100],
  },
  textWrapper: { 
    flex: 1,
    paddingRight: Spacing[2],
  },
  name: {
    fontSize: FontSize.md,
    fontFamily: FontFamily.semibold,
    color: Colors.neutral[900],
  },
  meta: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.regular,
    color: Colors.neutral[700],
    marginTop: Spacing[1],
  },
});