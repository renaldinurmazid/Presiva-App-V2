import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/constants/colors';

export type HomeMenuItem = {
  key: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
};

type Props = {
  menus: HomeMenuItem[];
};

export default function HomeMenuGrid({ menus }: Props) {
  return (
    <View style={styles.container}>
      {menus.map((item) => (
        <TouchableOpacity key={item.key} style={styles.item} onPress={item.onPress}>
          <View style={styles.iconWrapper}>
            <Ionicons name={item.icon} size={30} color={COLORS.primary} />
          </View>
          <Text style={styles.label}>{item.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    paddingTop: 12,
    justifyContent: 'space-between',
  },
  item: {
    width: '30%',
    alignItems: 'center',
    marginBottom: 22,
  },
  iconWrapper: {
    width: 68,
    height: 68,
    borderRadius: 20,
    backgroundColor: '#EEF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#D9EAFB',
  },
  label: {
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
});