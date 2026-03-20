import React from 'react'
import {
  ActivityIndicator,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'

type SelfieCaptureProps = {
  selfieUri: string | null
  onTakeSelfie: () => void
  loading?: boolean
  title?: string
  emptyText?: string
}

export default function SelfieCapture({
  selfieUri,
  onTakeSelfie,
  loading = false,
  title = 'Selfie Absensi',
  emptyText = 'Belum ada foto selfie',
}: SelfieCaptureProps) {
  const hasPhoto = Boolean(selfieUri)

  return (
    <View style={styles.card}>
      <Text style={styles.title}>{title}</Text>

      {hasPhoto ? (
        <Image source={{ uri: selfieUri! }} style={styles.image} />
      ) : (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyText}>{emptyText}</Text>
        </View>
      )}

      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={onTakeSelfie}
        activeOpacity={0.8}
        disabled={loading}
      >
        {loading ? (
          <View style={styles.buttonContent}>
            <ActivityIndicator color="#fff" size="small" />
            <Text style={styles.buttonText}>Membuka Kamera...</Text>
          </View>
        ) : (
          <Text style={styles.buttonText}>
            {hasPhoto ? 'Ambil Ulang Selfie' : 'Ambil Selfie'}
          </Text>
        )}
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 12,
  },
  image: {
    width: '100%',
    height: 260,
    borderRadius: 14,
    backgroundColor: '#e2e8f0',
  },
  emptyBox: {
    height: 220,
    borderRadius: 14,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#cbd5e1',
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  emptyText: {
    color: '#64748b',
    fontSize: 14,
    textAlign: 'center',
  },
  button: {
    marginTop: 14,
    backgroundColor: '#2563eb',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
})