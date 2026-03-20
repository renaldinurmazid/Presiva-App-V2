import React from 'react'
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native'

type AbsensiSubmitButtonProps = {
  onPress: () => void
  disabled?: boolean
  loading?: boolean
  title?: string
  loadingTitle?: string
}

export default function AbsensiSubmitButton({
  onPress,
  disabled = false,
  loading = false,
  title = 'ABSENSI',
  loadingTitle = 'Mengirim Absensi...',
}: AbsensiSubmitButtonProps) {
  const isDisabled = disabled || loading

  return (
    <TouchableOpacity
      style={[styles.button, isDisabled && styles.buttonDisabled]}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.85}
    >
      {loading ? (
        <View style={styles.content}>
          <ActivityIndicator size="small" color="#fff" />
          <Text style={styles.buttonText}>{loadingTitle}</Text>
        </View>
      ) : (
        <Text style={styles.buttonText}>{title}</Text>
      )}
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#f97316',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
})