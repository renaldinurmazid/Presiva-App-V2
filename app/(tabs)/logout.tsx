import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function BarcodeScreen() {
  return (
    <View style={styles.container}>
      <Text>BARCODE SCREEN</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});